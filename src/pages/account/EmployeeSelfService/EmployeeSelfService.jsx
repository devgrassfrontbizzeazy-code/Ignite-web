
import { useEffect, useMemo, useState } from "react";
import {
    Wallet,
    TrendingUp,
    ReceiptText,
    CalendarDays,
    RefreshCw,
    CircleAlert,
    UserRound,
} from "lucide-react";
import { getCurrentUser } from "../../../services/api/authAPI";
import "./EmployeeSelfService.css";

const PAYROLL_KEY = "ignite_payroll_runs";
const STRUCTURES_KEY = "ignite_salary_structures";

const getUserObject = (response) =>
    response?.data?.user ??
    response?.user ??
    response?.data ??
    response;

const getEmployeeId = (user) =>
    user?.employee_id ??
    user?.employee?.id ??
    user?.employeeId ??
    user?.employee?.employee_id ??
    null;

const getEmployeeCode = (user) =>
    user?.employee_code ??
    user?.employee?.employee_code ??
    user?.employeeCode ??
    user?.employee?.code ??
    "";

const getEmployeeName = (user) =>
    user?.full_name ??
    user?.name ??
    user?.employee?.full_name ??
    user?.employee?.name ??
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ??
    user?.employee?.first_name ??
    "Employee";

const readStorage = (key) => {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
};

const isReleased = (run) =>
    ["approved", "locked"].includes(
        String(run?.status || "").toLowerCase()
    );

const money = (value, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const formatPeriod = (period) => {
    if (!period) return "Payroll period";
    const date = new Date(`${period}-01T00:00:00`);
    return Number.isNaN(date.getTime())
        ? period
        : date.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
        });
};

export default function EmployeeSelfService() {
    const [user, setUser] = useState(null);
    const [runs, setRuns] = useState([]);
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await getCurrentUser();
                const currentUser = getUserObject(response);

                if (!currentUser || typeof currentUser !== "object") {
                    throw new Error("Could not identify the logged-in user.");
                }

                if (active) {
                    setUser(currentUser);
                    setRuns(readStorage(PAYROLL_KEY));
                    setStructures(readStorage(STRUCTURES_KEY));
                }
            } catch (err) {
                if (active) {
                    setError(
                        err?.response?.data?.detail ||
                        err?.response?.data?.message ||
                        err?.message ||
                        "Unable to load your employee profile."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        load();

        const onStorage = () => {
            setRuns(readStorage(PAYROLL_KEY));
            setStructures(readStorage(STRUCTURES_KEY));
        };

        window.addEventListener("storage", onStorage);

        return () => {
            active = false;
            window.removeEventListener("storage", onStorage);
        };
    }, [refreshKey]);

    const employeeId = getEmployeeId(user);
    const employeeCode = getEmployeeCode(user);

    const employeePayroll = useMemo(() => {
        if (!user || (!employeeId && !employeeCode)) return [];

        return runs
            .filter(isReleased)
            .map((run) => {
                const matchingEmployees = (run.employees || []).filter((employee) => {
                    const sameId =
                        employeeId != null &&
                        String(employee.employeeId ?? employee.employee_id ?? employee.id) ===
                        String(employeeId);

                    const sameCode =
                        employeeCode &&
                        String(employee.employeeCode ?? employee.employee_code ?? "")
                            .toLowerCase() === employeeCode.toLowerCase();

                    return sameId || sameCode;
                });

                return matchingEmployees.map((employee) => ({
                    ...employee,
                    period: run.period,
                    periodLabel: run.periodLabel || formatPeriod(run.period),
                    runStatus: run.status,
                }));
            })
            .flat()
            .sort((a, b) => String(b.period).localeCompare(String(a.period)));
    }, [runs, user, employeeId, employeeCode]);

    const latest = employeePayroll[0];

    const currentStructure = useMemo(() => {
        if (!employeeId && !employeeCode) return null;

        return structures.find((item) => {
            const sameId =
                employeeId != null &&
                String(item.employeeId ?? item.employee_id) === String(employeeId);

            const sameCode =
                employeeCode &&
                String(item.employeeCode ?? item.employee_code ?? "")
                    .toLowerCase() === employeeCode.toLowerCase();

            return sameId || sameCode;
        });
    }, [structures, employeeId, employeeCode]);

    if (loading) {
        return (
            <div className="ess-state">
                <RefreshCw className="ess-spin" size={22} />
                <p>Loading your payroll information...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ess-state ess-error">
                <CircleAlert size={24} />
                <h2>Unable to load your dashboard</h2>
                <p>{error}</p>
                <button onClick={() => setRefreshKey((value) => value + 1)}>
                    Try again
                </button>
            </div>
        );
    }

    if (!employeeId && !employeeCode) {
        const isOwner = String(user?.role || "").toUpperCase() === "OWNER";

        return (
            <div className="ess-state ess-error">
                <UserRound size={26} />

                <h2>
                    {isOwner
                        ? "Owner account detected"
                        : "Employee profile not linked"}
                </h2>

                <p>
                    {isOwner
                        ? "You are logged in with an Owner account. This account is not linked to an employee profile, so personal payroll records cannot be identified."
                        : "Your login is successful, but your account does not contain an employee ID or employee code. Please ask your administrator to link your employee profile."}
                </p>
            </div>
        );
    }


    return (
        <main className="ess-page">
            <header className="ess-header">
                <div>
                    <span className="ess-eyebrow">EMPLOYEE PORTAL</span>
                    <h1>My Payroll</h1>
                    <p>View your salary summary and released payroll records.</p>
                </div>
                <button
                    className="ess-refresh"
                    onClick={() => setRefreshKey((value) => value + 1)}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </header>

            <section className="ess-welcome">
                <div className="ess-avatar">
                    <UserRound size={25} />
                </div>
                <div className="ess-welcome-copy">
                    <span>Welcome back,</span>
                    <h2>{getEmployeeName(user)}</h2>
                    <p>
                        {employeeCode ? `Employee ID: ${employeeCode}` : "Employee portal"}
                        {user?.department || user?.employee?.department
                            ? ` · ${user?.department || user?.employee?.department}`
                            : ""}
                    </p>
                </div>
                <div className="ess-welcome-status">
                    <span className="ess-status-dot" />
                    Personal payroll overview
                </div>
            </section>

            <section className="ess-summary-grid">
                <article className="ess-summary-card">
                    <div className="ess-summary-top">
                        <span>Latest Net Salary</span>
                        <div className="ess-summary-icon"><Wallet size={19} /></div>
                    </div>
                    <strong>{latest ? money(latest.net) : "—"}</strong>
                    <p>{latest ? latest.periodLabel : "No released payroll yet"}</p>
                </article>

                <article className="ess-summary-card">
                    <div className="ess-summary-top">
                        <span>Gross Earnings</span>
                        <div className="ess-summary-icon"><TrendingUp size={19} /></div>
                    </div>
                    <strong>{latest ? money(latest.gross) : "—"}</strong>
                    <p>Latest released period</p>
                </article>

                <article className="ess-summary-card">
                    <div className="ess-summary-top">
                        <span>Total Deductions</span>
                        <div className="ess-summary-icon"><ReceiptText size={19} /></div>
                    </div>
                    <strong>
                        {latest
                            ? money(
                                latest.totalDeductions ??
                                latest.deductions ??
                                Number(latest.pf || 0) +
                                Number(latest.insurance || 0) +
                                Number(latest.otherDeductions || 0)
                            )
                            : "—"}
                    </strong>
                    <p>Latest released period</p>
                </article>

                <article className="ess-summary-card">
                    <div className="ess-summary-top">
                        <span>Released Payslips</span>
                        <div className="ess-summary-icon"><CalendarDays size={19} /></div>
                    </div>
                    <strong>{employeePayroll.length}</strong>
                    <p>Approved or locked payrolls</p>
                </article>
            </section>

            <section className="ess-panel">
                <div className="ess-panel-heading">
                    <div>
                        <h2>My Salary Structure</h2>
                        <p>Your currently saved salary structure, if available.</p>
                    </div>
                </div>

                {currentStructure ? (
                    <div className="ess-salary-grid">
                        <SalaryValue label="Basic Salary" value={currentStructure.basic} />
                        <SalaryValue label="HRA" value={currentStructure.hra} />
                        <SalaryValue
                            label="Other Allowances"
                            value={currentStructure.otherAllowances}
                        />
                        <SalaryValue label="Bonus" value={currentStructure.bonus} />
                        <SalaryValue label="PF" value={currentStructure.pf} />
                        <SalaryValue label="Insurance" value={currentStructure.insurance} />
                    </div>
                ) : (
                    <div className="ess-empty">
                        No salary structure was found for your employee profile.
                    </div>
                )}
            </section>

            <section className="ess-panel">
                <div className="ess-panel-heading">
                    <div>
                        <h2>Recent Payroll</h2>
                        <p>Only approved or locked payroll records are displayed.</p>
                    </div>
                    <span className="ess-record-count">
                        {employeePayroll.length} records
                    </span>
                </div>

                {employeePayroll.length === 0 ? (
                    <div className="ess-empty">
                        <ReceiptText size={27} />
                        <strong>No released payslips yet</strong>
                        <span>
                            Your payslips will appear here after payroll is approved or
                            locked.
                        </span>
                    </div>
                ) : (
                    <div className="ess-table-wrap">
                        <table className="ess-table">
                            <thead>
                                <tr>
                                    <th>Payroll Period</th>
                                    <th>Gross Earnings</th>
                                    <th>Deductions</th>
                                    <th>Net Salary</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employeePayroll.map((payroll, index) => (
                                    <tr key={`${payroll.period}-${index}`}>
                                        <td>
                                            <strong>{payroll.periodLabel}</strong>
                                        </td>
                                        <td>{money(payroll.gross)}</td>
                                        <td>
                                            {money(
                                                payroll.totalDeductions ??
                                                payroll.deductions ??
                                                0
                                            )}
                                        </td>
                                        <td className="ess-net">
                                            {money(payroll.net)}
                                        </td>
                                        <td>
                                            <span className="ess-release-badge">
                                                {payroll.runStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <p className="ess-disclaimer">
                Payroll information is currently read from this browser’s saved
                payroll data. Production employee access must use a backend endpoint
                that enforces employee ownership.
            </p>
        </main>
    );
}

function SalaryValue({ label, value }) {
    return (
        <div className="ess-salary-value">
            <span>{label}</span>
            <strong>{money(value)}</strong>
        </div>
    );
}
