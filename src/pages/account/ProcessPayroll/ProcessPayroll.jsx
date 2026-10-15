
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Calculator,
    CalendarDays,
    CircleAlert,
    Download,
    FileCheck2,
    RefreshCw,
    Save,
    Wallet,
} from "lucide-react";

import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import PayrollWorkflowNav from "../../../components/account/PayrollWorkflowNav";
import employeeService from "../../../services/employeeService";
import { useNotification } from "../../../context/NotificationContext";

import "./ProcessPayroll.css";

const STRUCTURE_STORAGE_KEY = "ignite_salary_structures";
const PAYROLL_STORAGE_KEY = "ignite_payroll_runs";

const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const readLocalData = (key) => {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
};

const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

const formatDate = (date) => {
    if (!date) return "—";
    const parsed = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsed.getTime())
        ? date
        : parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
};

const getEmployeeId = (employee) =>
    String(employee?.id ?? employee?.employee_id ?? "");

const getEmployeeName = (employee) =>
    [
        employee?.first_name,
        employee?.middle_name,
        employee?.last_name,
    ]
        .filter(Boolean)
        .join(" ") ||
    employee?.full_name ||
    employee?.name ||
    "Unnamed employee";

const isActiveEmployee = (employee) => {
    if (employee?.is_active === false) return false;

    const status = String(employee?.employment_status || "").toLowerCase();
    return !["inactive", "terminated", "resigned", "exited"].includes(status);
};

const getStructureForPeriod = (structures, employeeId, periodEnd) => {
    return structures
        .filter(
            (structure) =>
                String(structure.employeeId ?? structure.employee_id ?? "") ===
                employeeId &&
                structure.effectiveDate &&
                structure.effectiveDate <= periodEnd
        )
        .sort((a, b) =>
            String(b.effectiveDate).localeCompare(String(a.effectiveDate))
        )[0];
};

const calculateRow = (employee, structure) => {
    const basic = Number(structure.basic) || 0;
    const hra = Number(structure.hra) || 0;
    const otherAllowances = Number(structure.otherAllowances) || 0;
    const bonus = Number(structure.bonus) || 0;
    const pf = Number(structure.pf) || 0;
    const insurance = Number(structure.insurance) || 0;
    const otherDeductions = Number(structure.otherDeductions) || 0;

    const gross = basic + hra + otherAllowances + bonus;
    const totalDeductions = pf + insurance + otherDeductions;

    return {
        employeeId: getEmployeeId(employee),
        employeeCode: employee.employee_code || employee.employeeCode || "—",
        employeeName: getEmployeeName(employee),
        department:
            employee.department_name ||
            employee.department?.name ||
            employee.department ||
            "—",
        structureId: structure.id,
        effectiveDate: structure.effectiveDate,
        basic,
        hra,
        otherAllowances,
        bonus,
        pf,
        insurance,
        otherDeductions,
        gross,
        totalDeductions,
        net: gross - totalDeductions,
        status: "Ready",
    };
};

export default function ProcessPayroll() {
    const { showNotification } = useNotification();

    const [period, setPeriod] = useState(getCurrentPeriod);
    const [employees, setEmployees] = useState([]);
    const [structures, setStructures] = useState([]);
    const [payrollRuns, setPayrollRuns] = useState(() =>
        readLocalData(PAYROLL_STORAGE_KEY)
    );
    const [rows, setRows] = useState([]);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError("");

        try {
            const result = await employeeService.getAll();
            const list = Array.isArray(result)
                ? result
                : Array.isArray(result?.results)
                    ? result.results
                    : Array.isArray(result?.data)
                        ? result.data
                        : [];

            setEmployees(list.filter(isActiveEmployee));
            setStructures(readLocalData(STRUCTURE_STORAGE_KEY));
            setPayrollRuns(readLocalData(PAYROLL_STORAGE_KEY));
        } catch (error) {
            console.error("Failed to load payroll employees:", error);
            setLoadError("Employees could not be loaded. Please try again.");
            setEmployees([]);
            setStructures(readLocalData(STRUCTURE_STORAGE_KEY));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchInitialData = async () => {
            if (isMounted) {
                await loadData();
            }
        };
        fetchInitialData();
        return () => {
            isMounted = false;
        };
    }, [loadData]);

    const periodEnd = useMemo(() => {
        if (!/^\d{4}-\d{2}$/.test(period)) return "";
        const [year, month] = period.split("-").map(Number);
        return `${year}-${String(month).padStart(2, "0")}-${String(
            new Date(year, month, 0).getDate()
        ).padStart(2, "0")}`;
    }, [period]);

    const periodLabel = useMemo(() => {
        if (!period) return "";
        const [year, month] = period.split("-").map(Number);
        return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
        });
    }, [period]);

    const existingRun = useMemo(
        () => payrollRuns.find((run) => run.period === period),
        [payrollRuns, period]
    );

    const generatePayroll = () => {
        if (!periodEnd) {
            showNotification("Please select a valid payroll month.", "error");
            return;
        }

        setGenerating(true);

        try {
            const nextRows = employees.map((employee) => {
                const id = getEmployeeId(employee);
                const structure = getStructureForPeriod(structures, id, periodEnd);

                if (!structure) {
                    return {
                        employeeId: id,
                        employeeCode: employee.employee_code || employee.employeeCode || "—",
                        employeeName: getEmployeeName(employee),
                        department:
                            employee.department_name ||
                            employee.department?.name ||
                            employee.department ||
                            "—",
                        status: "Missing salary structure",
                        gross: 0,
                        totalDeductions: 0,
                        net: 0,
                    };
                }

                return calculateRow(employee, structure);
            });

            setRows(nextRows);
            setHasGenerated(true);

            const missing = nextRows.filter(
                (row) => row.status !== "Ready"
            ).length;

            showNotification(
                missing
                    ? `Payroll calculated. ${missing} employee(s) need a salary structure.`
                    : `Payroll calculated for ${periodLabel}.`,
                missing ? "warning" : "success"
            );
        } finally {
            setGenerating(false);
        }
    };

    const totals = useMemo(() => {
        const readyRows = rows.filter((row) => row.status === "Ready");

        return {
            employees: readyRows.length,
            missing: rows.length - readyRows.length,
            gross: readyRows.reduce((sum, row) => sum + row.gross, 0),
            deductions: readyRows.reduce(
                (sum, row) => sum + row.totalDeductions,
                0
            ),
            net: readyRows.reduce((sum, row) => sum + row.net, 0),
        };
    }, [rows]);

    const saveDraft = () => {
        if (!hasGenerated || rows.length === 0) {
            showNotification("Generate payroll before saving a draft.", "error");
            return;
        }

        if (totals.missing > 0) {
            showNotification(
                "Assign salary structures to all active employees before saving the payroll draft.",
                "error"
            );
            return;
        }

        if (existingRun && existingRun.status !== "Draft") {
            showNotification(
                "A non-draft payroll run already exists for this month. It cannot be overwritten.",
                "error"
            );
            return;
        }

        setSaving(true);

        try {
            const savedAt = new Date().toISOString();
            const run = {
                id: existingRun?.id || `payroll-${period}`,
                period,
                periodLabel,
                status: "Draft",
                createdAt: existingRun?.createdAt || savedAt,
                updatedAt: savedAt,
                employeeCount: totals.employees,
                gross: totals.gross,
                deductions: totals.deductions,
                net: totals.net,
                employees: rows,
            };

            const nextRuns = [
                ...payrollRuns.filter((item) => item.period !== period),
                run,
            ].sort((a, b) => b.period.localeCompare(a.period));

            localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(nextRuns));
            setPayrollRuns(nextRuns);
            showNotification("Payroll draft saved in this browser.", "success");
        } catch (error) {
            console.error("Failed to save payroll draft:", error);
            showNotification(
                "Could not save the draft. Check browser storage and try again.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const exportCSV = () => {
        if (!hasGenerated || rows.length === 0) {
            showNotification("Generate payroll before exporting.", "error");
            return;
        }

        const headers = [
            "Employee Code",
            "Employee Name",
            "Department",
            "Basic",
            "HRA",
            "Other Allowances",
            "Bonus",
            "Gross",
            "PF",
            "Insurance",
            "Other Deductions",
            "Total Deductions",
            "Net Pay",
            "Status",
        ];

        const escapeCSV = (value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;

        const csv = [
            headers.map(escapeCSV).join(","),
            ...rows.map((row) =>
                [
                    row.employeeCode,
                    row.employeeName,
                    row.department,
                    row.basic ?? "",
                    row.hra ?? "",
                    row.otherAllowances ?? "",
                    row.bonus ?? "",
                    row.gross,
                    row.pf ?? "",
                    row.insurance ?? "",
                    row.otherDeductions ?? "",
                    row.totalDeductions,
                    row.net,
                    row.status,
                ]
                    .map(escapeCSV)
                    .join(",")
            ),
        ].join("\r\n");

        const blob = new Blob(["\uFEFF", csv], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ignite-payroll-${period}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="process-payroll-page">
            <PageHeader
                eyebrow="ACCOUNT "
                title="Process Payroll"
                description="Calculate, review, and prepare employee payroll for a selected month."
            />

            <PayrollWorkflowNav />

            <div className="process-payroll-notice">
                <CircleAlert size={18} />
                <div>
                    <strong>Frontend demo mode</strong>
                    <p>
                        Payroll drafts are saved in this browser only. No salaries are
                        submitted to the backend, approved, or paid from this page.
                    </p>
                    <Link
                        className="payroll-workflow-cta"
                        to="/account/salary-structures"
                    >
                        Manage salary structures
                    </Link>
                </div>
            </div>

            <Card>
                <div className="process-payroll-toolbar">
                    <div className="process-payroll-period">
                        <label htmlFor="payroll-period">
                            <CalendarDays size={16} />
                            Payroll month
                        </label>
                        <input
                            id="payroll-period"
                            type="month"
                            value={period}
                            onChange={(event) => {
                                setPeriod(event.target.value);
                                setHasGenerated(false);
                                setRows([]);
                            }}
                        />
                    </div>

                    <div className="process-payroll-actions">
                        <Button
                            variant="secondary"
                            onClick={loadData}
                            disabled={loading}
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </Button>
                        <Button onClick={generatePayroll} disabled={loading || generating}>
                            <Calculator size={16} />
                            {generating ? "Calculating..." : "Generate Payroll"}
                        </Button>
                    </div>
                </div>

                {loading && (
                    <p className="process-payroll-message">Loading active employees...</p>
                )}

                {loadError && (
                    <div className="process-payroll-error">
                        {loadError}
                        <button type="button" onClick={loadData}>
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !loadError && (
                    <p className="process-payroll-helper">
                        {employees.length} active employee(s) found. Salary structures
                        effective on or before {formatDate(periodEnd)} are considered.
                    </p>
                )}
            </Card>

            {hasGenerated && (
                <>
                    <div className="process-payroll-summary">
                        <Card>
                            <div className="process-payroll-stat">
                                <span className="process-payroll-stat-icon">
                                    <FileCheck2 size={19} />
                                </span>
                                <div>
                                    <span>Employees included</span>
                                    <strong>{totals.employees}</strong>
                                    <small>{totals.missing} exception(s)</small>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="process-payroll-stat">
                                <span className="process-payroll-stat-icon">
                                    <Wallet size={19} />
                                </span>
                                <div>
                                    <span>Gross payroll</span>
                                    <strong>{money(totals.gross)}</strong>
                                    <small>Before deductions</small>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="process-payroll-stat">
                                <span className="process-payroll-stat-icon">
                                    <CircleAlert size={19} />
                                </span>
                                <div>
                                    <span>Total deductions</span>
                                    <strong>{money(totals.deductions)}</strong>
                                    <small>PF, insurance and other deductions</small>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="process-payroll-stat">
                                <span className="process-payroll-stat-icon">
                                    <Wallet size={19} />
                                </span>
                                <div>
                                    <span>Net payout</span>
                                    <strong>{money(totals.net)}</strong>
                                    <small>After listed deductions</small>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {totals.missing > 0 && (
                        <div className="process-payroll-warning">
                            <CircleAlert size={18} />
                            <div>
                                <strong>{totals.missing} employee(s) need attention</strong>
                                <p>
                                    Add an applicable salary structure in Salary Structures,
                                    then refresh and generate payroll again. Draft saving is
                                    disabled until all active employees have a structure.
                                </p>
                            </div>
                        </div>
                    )}

                    <Card>
                        <div className="process-payroll-table-heading">
                            <div>
                                <h2>Payroll review</h2>
                                <p>{periodLabel}</p>
                            </div>

                            <div className="process-payroll-actions">
                                <Button variant="secondary" onClick={exportCSV}>
                                    <Download size={16} />
                                    Export CSV
                                </Button>
                                <Button
                                    onClick={saveDraft}
                                    disabled={
                                        saving ||
                                        totals.missing > 0 ||
                                        rows.length === 0 ||
                                        (existingRun && existingRun.status !== "Draft")
                                    }
                                >
                                    <Save size={16} />
                                    {saving ? "Saving..." : "Save Draft"}
                                </Button>
                            </div>
                        </div>

                        {existingRun && (
                            <div className="process-payroll-existing-run">
                                Existing run for this month: <strong>{existingRun.status}</strong>
                                {existingRun.status !== "Draft" &&
                                    " — this run cannot be overwritten."}
                            </div>
                        )}

                        <div className="process-payroll-table-wrap">
                            <table className="process-payroll-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Department</th>
                                        <th>Structure effective</th>
                                        <th>Basic</th>
                                        <th>Gross</th>
                                        <th>Deductions</th>
                                        <th>Net pay</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.employeeId}>
                                            <td>
                                                <div className="process-payroll-employee">
                                                    <strong>{row.employeeName}</strong>
                                                    <span>{row.employeeCode}</span>
                                                </div>
                                            </td>
                                            <td>{row.department}</td>
                                            <td>{formatDate(row.effectiveDate)}</td>
                                            <td>{money(row.basic)}</td>
                                            <td>{money(row.gross)}</td>
                                            <td>{money(row.totalDeductions)}</td>
                                            <td className="process-payroll-net">{money(row.net)}</td>
                                            <td>
                                                <span
                                                    className={`process-payroll-status ${row.status === "Ready"
                                                        ? "is-ready"
                                                        : "is-missing"
                                                        }`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {rows.length > 0 && totals.missing === 0 && (
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3}>Total</td>
                                            <td>{money(rows.reduce((sum, row) => sum + row.basic, 0))}</td>
                                            <td>{money(totals.gross)}</td>
                                            <td>{money(totals.deductions)}</td>
                                            <td>{money(totals.net)}</td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {rows.length === 0 && (
                            <div className="process-payroll-empty">
                                No active employees found for payroll.
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
}
