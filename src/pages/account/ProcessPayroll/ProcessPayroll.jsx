
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useNotification } from "../../../context/NotificationContext";
import {
    calculatePayroll,
    createPayrollDraft,
    patchPayrollDraft,
    getPayrollDrafts,
    exportPayrollRun,
    unwrapList,
    triggerBlobDownload,
} from "../../../services/api/accountAPI";

import "./ProcessPayroll.css";

const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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
    employee?.employeeName ||
    "Unnamed employee";

export default function ProcessPayroll() {
    const { showNotification } = useNotification();
    const notify = useCallback(
        (type, message) => showNotification({ type, message }),
        [showNotification]
    );

    const [period, setPeriod] = useState(getCurrentPeriod);
    const [existingDrafts, setExistingDrafts] = useState([]);
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
            const draftsResult = await getPayrollDrafts();
            setExistingDrafts(unwrapList(draftsResult));
        } catch (error) {
            console.error("Failed to load payroll data:", error);
            setLoadError("Data could not be loaded. Please try again.");
            setExistingDrafts([]);
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
        () =>
            existingDrafts.find(
                (run) => (run.period ?? run.payroll_period) === period
            ),
        [existingDrafts, period]
    );

    const generatePayroll = async () => {
        if (!periodEnd) {
            notify("error", "Please select a valid payroll month.");
            return;
        }

        setGenerating(true);

        try {
            const response = await calculatePayroll({ period });
            const data = response?.data ?? response;
            const calcRows = unwrapList(data);
            const rowsFromObject =
                data?.records ?? data?.employees ?? data?.payroll_records;
            const backendRows = calcRows.length
                ? calcRows
                : Array.isArray(rowsFromObject)
                    ? rowsFromObject
                    : [];
            const mappedRows = backendRows.map((row) => ({
                ...row,
                employeeId: String(row.employee_id ?? row.employeeId ?? row.employee?.id ?? ""),
                employeeCode: row.employee_code ?? row.employeeCode ?? "—",
                employeeName: row.employee_name ?? row.employeeName ?? getEmployeeName(row.employee || row),
                department: row.department_name ?? row.department?.name ?? row.department ?? "—",
                structureId: row.structure_id ?? row.structureId,
                effectiveDate: row.effective_date ?? row.effectiveDate,
                basic: Number(row.basic) || 0,
                hra: Number(row.hra) || 0,
                otherAllowances: Number(row.other_allowances ?? row.otherAllowances) || 0,
                bonus: Number(row.bonus) || 0,
                pf: Number(row.pf) || 0,
                insurance: Number(row.insurance) || 0,
                otherDeductions: Number(row.other_deductions ?? row.otherDeductions) || 0,
                gross: Number(row.gross ?? row.gross_salary) || 0,
                totalDeductions: Number(row.total_deductions ?? row.totalDeductions) || 0,
                net: Number(row.net ?? row.net_pay) || 0,
                status: row.status ?? "—",
                recordId: row.id ?? row.record_id,
            }));

            setRows(mappedRows);
            setHasGenerated(true);

            const missing = mappedRows.filter((row) => row.status !== "Ready").length;
            notify(
                missing ? "warning" : "success",
                missing
                    ? `Payroll calculated. ${missing} employee(s) need attention.`
                    : `Payroll calculated for ${periodLabel}.`
            );
        } catch (error) {
            console.error("Payroll generation failed:", error);
            notify(
                "error",
                error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    "Payroll calculation failed. Please try again."
            );
        } finally {
            setGenerating(false);
        }
    };

    const totals = useMemo(() => {
        const readyRows = rows.filter(
            (row) =>
                !["missing", "missing salary structure", "error", "exception", "failed", "blocked"]
                    .some((status) => String(row.status || "").toLowerCase().includes(status))
        );

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

    const saveDraft = async () => {
        if (!hasGenerated || rows.length === 0) {
            notify("error", "Generate payroll before saving a draft.");
            return;
        }

        if (totals.missing > 0) {
            notify("error", "Resolve all payroll exceptions before saving the draft.");
            return;
        }

        if (existingRun && String(existingRun.status || "Draft").toLowerCase() !== "draft") {
            notify("error", "A non-draft payroll run already exists for this month. It cannot be overwritten.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                period,
                period_label: periodLabel,
                status: "Draft",
                employee_count: totals.employees,
                gross: totals.gross,
                deductions: totals.deductions,
                net: totals.net,
                employees: rows.map((row) => ({
                    employee_id: row.employeeId,
                    employee_code: row.employeeCode,
                    employee_name: row.employeeName,
                    department: row.department,
                    structure_id: row.structureId,
                    effective_date: row.effectiveDate,
                    basic: row.basic,
                    hra: row.hra,
                    other_allowances: row.otherAllowances,
                    bonus: row.bonus,
                    pf: row.pf,
                    insurance: row.insurance,
                    other_deductions: row.otherDeductions,
                    gross: row.gross,
                    total_deductions: row.totalDeductions,
                    net: row.net,
                    ...(row.status !== "—" ? { status: row.status } : {}),
                    record_id: row.recordId,
                })),
            };

            if (existingRun?.id) {
                await patchPayrollDraft(existingRun.id, payload);
            } else {
                await createPayrollDraft(payload);
            }

            // Refresh drafts from backend
            const refreshedDrafts = await getPayrollDrafts();
            setExistingDrafts(unwrapList(refreshedDrafts));

            notify("success", existingRun ? "Payroll draft updated successfully." : "Payroll draft saved successfully.");
        } catch (error) {
            console.error("Failed to save payroll draft:", error);
            const message =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Could not save the draft. Please try again.";
            notify("error", message);
        } finally {
            setSaving(false);
        }
    };

    const exportCSV = async () => {
        if (!hasGenerated || rows.length === 0) {
            notify("error", "Generate payroll before exporting.");
            return;
        }

        if (existingRun?.id) {
            try {
                const blob = await exportPayrollRun(existingRun.id);
                triggerBlobDownload(blob, `ignite-payroll-${period}.csv`);
                return;
            } catch (error) {
                console.error("Failed to export payroll:", error);
                notify("error", "Unable to export this payroll run.");
                return;
            }
        }
        notify("error", "Save a payroll draft before exporting it.");
    };

    return (
        <div className="process-payroll-page">
            <PageHeader
                eyebrow="ACCOUNT "
                title="Process Payroll"
                description="Calculate, review, and prepare employee payroll for a selected month."
            />

            <PayrollWorkflowNav />

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
                    <p className="process-payroll-message">Loading payroll drafts...</p>
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
                        Payroll calculations use salary structures effective on or before{" "}
                        {formatDate(periodEnd)}.
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
                                        (existingRun && String(existingRun.status || "Draft").toLowerCase() !== "draft")
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
                                {String(existingRun.status || "Draft").toLowerCase() !== "draft" &&
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
                                No payroll records were returned for this period.
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
}
