
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Wallet,
    TrendingUp,
    ReceiptText,
    CalendarDays,
    RefreshCw,
    CircleAlert,
    UserRound,
    Download,
} from "lucide-react";
import { getCurrentUser } from "../../../services/api/authAPI";
import { useNotification } from "../../../context/NotificationContext";
import {
    getPayslips,
    getSalaryStructures,
    downloadPayslip,
    unwrapList,
    triggerBlobDownload,
} from "../../../services/api/accountAPI";
import "./EmployeeSelfService.css";

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
    user?.full_name ||
    user?.name ||
    user?.employee?.full_name ||
    user?.employee?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    [user?.employee?.first_name, user?.employee?.last_name].filter(Boolean).join(" ") ||
    "Employee";

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
    const { showNotification } = useNotification();
    const notify = useCallback(
        (type, message) => showNotification({ type, message }),
        [showNotification]
    );
    const [user, setUser] = useState(null);
    const [payslipData, setPayslipData] = useState([]);
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [downloadingId, setDownloadingId] = useState(null);

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
                }

                // The payslips endpoint supports employee_id filtering. Avoid fetching
                // company-wide payslips for the employee self-service screen.
                const currentEmployeeId = getEmployeeId(currentUser);
                if (currentEmployeeId != null) {
                    const payslipsResponse = await getPayslips({
                        employee_id: currentEmployeeId,
                    });
                    if (active) setPayslipData(unwrapList(payslipsResponse));
                } else if (active) {
                    setPayslipData([]);
                }

                try {
                    const structuresResponse = await getSalaryStructures();
                    if (active) setStructures(unwrapList(structuresResponse));
                } catch (structureError) {
                    console.error("Failed to load employee salary structure:", structureError);
                    if (active) {
                        setStructures([]);
                        notify("error", "Your payslips loaded, but your salary structure could not be loaded.");
                    }
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

        return () => {
            active = false;
        };
    }, [refreshKey, notify]);

    const employeeId = getEmployeeId(user);
    const employeeCode = getEmployeeCode(user);

    const employeePayroll = useMemo(() => {
        if (!user || (!employeeId && !employeeCode)) return [];

        return payslipData
            .filter((slip) => {
                const slipEmployee = slip.employee && typeof slip.employee === "object"
                    ? slip.employee
                    : {};
                const slipEmployeeId = String(
                    slip.employee_id ??
                        slip.employeeId ??
                        slipEmployee.id ??
                        (typeof slip.employee === "object" ? "" : slip.employee) ??
                        ""
                );
                const slipEmployeeCode = String(
                    slip.employee_code ??
                        slip.employeeCode ??
                        slipEmployee.employee_code ??
                        slipEmployee.code ??
                        ""
                ).toLowerCase();

                return (
                    (employeeId != null && slipEmployeeId === String(employeeId)) ||
                    (employeeCode && slipEmployeeCode === employeeCode.toLowerCase())
                );
            })
            .map((slip) => ({
                ...slip,
                period: slip.period || slip.payroll_period,
                periodLabel: slip.period_label || formatPeriod(slip.period || slip.payroll_period),
                runStatus: slip.payroll_status || slip.status || "—",
                payslipId: slip.id || slip.payslip_id,
            }))
            .sort((a, b) => String(b.period).localeCompare(String(a.period)));
    }, [payslipData, user, employeeId, employeeCode]);

    const latest = employeePayroll[0];
    const currentStructure = useMemo(
        () =>
            structures.find((item) => {
                const employee = item.employee && typeof item.employee === "object"
                    ? item.employee
                    : {};
                const structureEmployeeId = String(
                    item.employee_id ?? item.employeeId ?? employee.id ?? item.employee ?? ""
                );
                const structureEmployeeCode = String(
                    item.employee_code ?? item.employeeCode ?? employee.employee_code ?? ""
                ).toLowerCase();
                return (
                    (employeeId != null && structureEmployeeId === String(employeeId)) ||
                    (employeeCode && structureEmployeeCode === employeeCode.toLowerCase())
                );
            }),
        [structures, employeeId, employeeCode]
    );

    const handleDownload = async (payroll) => {
        const payslipId = payroll.payslipId || payroll.id || payroll.payslip_id;
        if (!payslipId) {
            notify("error", "This payslip does not include a backend ID for download.");
            return;
        }

        setDownloadingId(payslipId);
        try {
            const blob = await downloadPayslip(payslipId);
            triggerBlobDownload(
                blob,
                `${employeeCode || employeeId}-${payroll.period}-payslip.pdf`
            );
            notify("success", "Payslip PDF downloaded.");
        } catch (error) {
            console.error("Failed to download payslip:", error);
            notify(
                "error",
                error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    "Unable to download your payslip."
            );
        } finally {
            setDownloadingId(null);
        }
    };

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
                    <strong>{latest ? money(latest.net ?? latest.net_salary ?? latest.net_pay) : "—"}</strong>
                    <p>{latest ? latest.periodLabel : "No released payroll yet"}</p>
                </article>

                <article className="ess-summary-card">
                    <div className="ess-summary-top">
                        <span>Gross Earnings</span>
                        <div className="ess-summary-icon"><TrendingUp size={19} /></div>
                    </div>
                    <strong>{latest ? money(latest.gross ?? latest.gross_salary) : "—"}</strong>
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
                                latest.total_deductions ??
                                latest.deductions ??
                                Number(latest.pf || 0) +
                                Number(latest.insurance || 0) +
                                Number(latest.otherDeductions ?? latest.other_deductions ?? 0)
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
                            value={currentStructure.otherAllowances ?? currentStructure.other_allowances}
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
                                    <th>Action</th>
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
                                                payroll.total_deductions ??
                                                payroll.deductions ??
                                                0
                                            )}
                                        </td>
                                        <td className="ess-net">
                                            {money(payroll.net ?? payroll.net_pay)}
                                        </td>
                                        <td>
                                            <span className="ess-release-badge">
                                                {payroll.runStatus}
                                            </span>
                                        </td>
                                        <td>
                                            {(payroll.payslipId || payroll.id) && (
                                                <button
                                                    className="ess-download-btn"
                                                    onClick={() => handleDownload(payroll)}
                                                    disabled={downloadingId === (payroll.payslipId || payroll.id)}
                                                    title="Download payslip PDF"
                                                >
                                                    <Download size={15} />
                                                    {downloadingId === (payroll.payslipId || payroll.id)
                                                        ? "..."
                                                        : "PDF"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
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
