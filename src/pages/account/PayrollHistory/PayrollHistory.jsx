
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    CalendarDays,
    CircleAlert,
    Eye,
    FileText,
    Pencil,
    RefreshCw,
    Save,
    Search,
    Wallet,
    X,
} from "lucide-react";

import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import PayrollWorkflowNav from "../../../components/account/PayrollWorkflowNav";
import { useNotification } from "../../../context/NotificationContext";
import {
    getPayrollDrafts,
    getPayrollDraft,
    approvePayrollDraft,
    adjustPayrollRecord,
    cancelPayrollRun,
    finalizePayrollRun,
    lockPayrollRun,
    recalculatePayrollDraft,
    exportPayrollRun,
    unwrapList,
    triggerBlobDownload,
} from "../../../services/api/accountAPI";

import "./PayrollHistory.css";

const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

const getPeriodLabel = (period) => {
    if (!period || !/^\d{4}-\d{2}$/.test(period)) return period || "—";

    const [year, month] = period.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getRunEmployees = (run) =>
    Array.isArray(run?.employees)
        ? run.employees
        : Array.isArray(run?.records)
            ? run.records
            : Array.isArray(run?.payroll_records)
                ? run.payroll_records
                : [];

const getEmployeeName = (employee) =>
    employee.employeeName || employee.employee_name || employee.name || "Employee";

const getEmployeeCode = (employee) =>
    employee.employeeCode || employee.employee_code || "—";

const getGross = (run) =>
    run.gross ??
    run.total_gross ??
    run.gross_payroll ??
    getRunEmployees(run).reduce(
        (sum, employee) => sum + (Number(employee.gross) || 0),
        0
    );

const getDeductions = (run) =>
    run.deductions ??
    run.total_deductions ??
    getRunEmployees(run).reduce(
        (sum, employee) => sum + (Number(employee.totalDeductions ?? employee.total_deductions) || 0),
        0
    );

const getNet = (run) =>
    run.net ??
    run.total_net ??
    run.net_payout ??
    getRunEmployees(run).reduce(
        (sum, employee) => sum + (Number(employee.net ?? employee.net_pay) || 0),
        0
    );

const getStatusClass = (status) => {
    const normalized = String(status || "Draft").toLowerCase();

    if (normalized === "approved") return "is-approved";
    if (normalized === "locked") return "is-locked";
    if (normalized === "cancelled" || normalized === "canceled") return "is-cancelled";
    if (normalized === "finalized") return "is-locked";
    return "is-draft";
};


export default function PayrollHistory() {
    const { showNotification } = useNotification();
    const notify = useCallback(
        (type, message) => showNotification({ type, message }),
        [showNotification]
    );

    const [runs, setRuns] = useState([]);
    const [search, setSearch] = useState("");
    const [monthFilter, setMonthFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedRun, setSelectedRun] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState(null);
    const [recordForm, setRecordForm] = useState({});

    const fetchRuns = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getPayrollDrafts();
            const list = unwrapList(response);
            setRuns(list.map((run) => ({
                ...run,
                period: run.period ?? run.payroll_period ?? "",
                status: run.status ?? run.payroll_status ?? "Draft",
            })));
            setSelectedRun((current) =>
                current ? list.find((run) => String(run.id) === String(current.id)) || null : null
            );
        } catch (error) {
            console.error("Failed to load payroll history:", error);
            notify("error", "Could not load payroll history. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        void Promise.resolve().then(fetchRuns);
    }, [fetchRuns]);

    const openRun = async (run) => {
        if (!run?.id) {
            notify("error", "This payroll run does not include a backend ID.");
            return;
        }
        setActionLoading(true);
        try {
            const response = await getPayrollDraft(run.id);
            const detail = response?.data ?? response;
            setSelectedRun({
                ...detail,
                employees: detail.employees ?? detail.records ?? detail.payroll_records,
                period: detail.period ?? detail.payroll_period ?? run.period,
                status: detail.status ?? detail.payroll_status ?? run.status,
            });
        } catch (error) {
            console.error("Failed to load payroll details:", error);
            notify(
                "error",
                error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    "Could not load payroll details."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const changeRunStatus = async (run, nextStatus) => {
        const currentStatus = String(run.status || "Draft");

        if (nextStatus === "Approved") {
            if (currentStatus.toLowerCase() !== "draft") {
                notify("error", "Only draft payroll can be approved.");
                return;
            }

            if (
                !window.confirm(
                    `Approve payroll for ${getPeriodLabel(run.period)}? This will prevent the draft from being overwritten through Process Payroll.`
                )
            ) {
                return;
            }
        } else if (nextStatus === "Locked") {
            if (!["approved", "finalized"].includes(currentStatus.toLowerCase())) {
                notify("error", "Only approved or finalized payroll can be locked.");
                return;
            }

            if (
                !window.confirm(
                    `Lock payroll for ${getPeriodLabel(run.period)}? This action cannot be undone.`
                )
            ) {
                return;
            }
        } else if (nextStatus === "Cancelled") {
            if (!["draft", "approved"].includes(currentStatus.toLowerCase())) {
                notify("error", "Only draft or approved payroll can be cancelled.");
                return;
            }

            if (
                !window.confirm(
                    `Cancel payroll for ${getPeriodLabel(run.period)}? This action cannot be undone.`
                )
            ) {
                return;
            }
        } else if (nextStatus === "Finalized") {
            if (currentStatus.toLowerCase() !== "approved") {
                notify("error", "Only approved payroll can be finalized.");
                return;
            }
            if (!window.confirm(`Finalize payroll for ${getPeriodLabel(run.period)}?`)) return;
        } else if (nextStatus === "Recalculate") {
            if (currentStatus.toLowerCase() !== "draft") {
                notify("error", "Only draft payroll can be recalculated.");
                return;
            }
            if (!window.confirm(`Recalculate the draft for ${getPeriodLabel(run.period)}?`)) return;
        } else {
            return;
        }

        setActionLoading(true);

        try {
            if (nextStatus === "Approved") {
                await approvePayrollDraft(run.id);
            } else if (nextStatus === "Locked") {
                await lockPayrollRun(run.id);
            } else if (nextStatus === "Cancelled") {
                await cancelPayrollRun(run.id);
            } else if (nextStatus === "Finalized") {
                await finalizePayrollRun(run.id);
            } else if (nextStatus === "Recalculate") {
                await recalculatePayrollDraft(run.id);
            }

            notify(
                "success",
                nextStatus === "Approved"
                    ? "Payroll approved successfully."
                    : nextStatus === "Locked"
                        ? "Payroll locked successfully."
                        : nextStatus === "Finalized"
                            ? "Payroll finalized successfully."
                            : nextStatus === "Recalculate"
                                ? "Payroll draft recalculated successfully."
                                : "Payroll cancelled successfully."
            );

            // Refresh data from the backend
            await fetchRuns();
            await openRun(run);
        } catch (error) {
            console.error("Failed to update payroll status:", error);
            const message =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Could not update payroll status. Please try again.";
            notify("error", message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleExportRun = async (run) => {
        if (!run.id) {
            notify("error", "This payroll run does not include a backend ID.");
            return;
        }
        try {
            const blob = await exportPayrollRun(run.id);
            triggerBlobDownload(blob, `ignite-payroll-${run.period || "history"}.csv`);
            notify("success", "Payroll CSV exported.");
        } catch (error) {
            console.error("Failed to export payroll:", error);
            notify(
                "error",
                error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    "Unable to export this payroll run."
            );
        }
    };

    const saveRecordAdjustment = async (record) => {
        const recordId = record.id ?? record.record_id ?? record.payroll_record_id;
        if (!selectedRun?.id || !recordId) {
            notify("error", "This payroll record cannot be adjusted because its backend ID is missing.");
            return;
        }

        const amountFields = [
            "basic",
            "hra",
            "other_allowances",
            "bonus",
            "pf",
            "insurance",
            "other_deductions",
        ];
        if (
            amountFields.some(
                (field) =>
                    recordForm[field] === "" ||
                    !Number.isFinite(Number(recordForm[field])) ||
                    Number(recordForm[field]) < 0
            )
        ) {
            notify("error", "Enter a valid non-negative amount for every payroll component.");
            return;
        }

        setActionLoading(true);
        try {
            const payload = {
                basic: Number(recordForm.basic),
                hra: Number(recordForm.hra),
                other_allowances: Number(recordForm.other_allowances),
                bonus: Number(recordForm.bonus),
                pf: Number(recordForm.pf),
                insurance: Number(recordForm.insurance),
                other_deductions: Number(recordForm.other_deductions),
            };
            await adjustPayrollRecord(selectedRun.id, recordId, payload);
            setEditingRecordId(null);
            setRecordForm({});
            notify("success", "Payroll record adjusted.");
            await fetchRuns();
            await openRun(selectedRun);
        } catch (error) {
            console.error("Failed to adjust payroll record:", error);
            notify(
                "error",
                error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    "Unable to adjust the payroll record."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const sortedRuns = useMemo(
        () => [...runs].sort((a, b) => String(b.period).localeCompare(String(a.period))),
        [runs]
    );

    const filteredRuns = useMemo(() => {
        const term = search.trim().toLowerCase();

        return sortedRuns.filter((run) => {
            const matchesSearch =
                !term ||
                String(run.periodLabel || run.period_label || getPeriodLabel(run.period))
                    .toLowerCase()
                    .includes(term) ||
                String(run.period || "").toLowerCase().includes(term);

            const matchesMonth =
                monthFilter === "all" || run.period === monthFilter;

            const matchesStatus =
                statusFilter === "all" ||
                String(run.status || "Draft").toLowerCase() === statusFilter;

            return matchesSearch && matchesMonth && matchesStatus;
        });
    }, [sortedRuns, search, monthFilter, statusFilter]);

    const summary = useMemo(
        () => ({
            count: runs.length,
            drafts: runs.filter(
                (run) => String(run.status || "Draft").toLowerCase() === "draft"
            ).length,
            gross: runs.reduce((sum, run) => sum + (Number(getGross(run)) || 0), 0),
            net: runs.reduce((sum, run) => sum + (Number(getNet(run)) || 0), 0),
        }),
        [runs]
    );

    return (
        <div className="payroll-history-page">
            <PageHeader
                eyebrow="ACCOUNT"
                title="Payroll History"
                description="Review saved payroll runs and inspect employee-wise salary calculations."
            />

            <PayrollWorkflowNav />

            <div className="payroll-history-summary">
                <Card>
                    <div className="payroll-history-stat">
                        <span className="payroll-history-stat-icon">
                            <FileText size={19} />
                        </span>
                        <div>
                            <span>Total payroll runs</span>
                            <strong>{summary.count}</strong>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="payroll-history-stat">
                        <span className="payroll-history-stat-icon">
                            <CalendarDays size={19} />
                        </span>
                        <div>
                            <span>Draft runs</span>
                            <strong>{summary.drafts}</strong>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="payroll-history-stat">
                        <span className="payroll-history-stat-icon">
                            <Wallet size={19} />
                        </span>
                        <div>
                            <span>Combined gross</span>
                            <strong>{money(summary.gross)}</strong>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="payroll-history-stat">
                        <span className="payroll-history-stat-icon">
                            <Wallet size={19} />
                        </span>
                        <div>
                            <span>Combined net</span>
                            <strong>{money(summary.net)}</strong>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="payroll-history-filters">
                    <div className="payroll-history-search">
                        <Search size={17} />
                        <input
                            type="search"
                            placeholder="Search payroll month..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Search payroll month"
                        />
                    </div>

                    <select
                        value={monthFilter}
                        onChange={(event) => setMonthFilter(event.target.value)}
                        aria-label="Filter by month"
                    >
                        <option value="all">All months</option>
                        {sortedRuns.map((run) => (
                            <option key={run.id || run.period} value={run.period}>
                                {getPeriodLabel(run.period)}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        aria-label="Filter by status"
                    >
                        <option value="all">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="finalized">Finalized</option>
                        <option value="locked">Locked</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <Button variant="secondary" onClick={fetchRuns} disabled={loading}>
                        <RefreshCw size={16} />
                        {loading ? "Loading..." : "Refresh"}
                    </Button>
                </div>

                {loading && runs.length === 0 && (
                    <p className="payroll-history-loading">Loading payroll history...</p>
                )}

                <div className="payroll-history-table-wrap">
                    <table className="payroll-history-table">
                        <thead>
                            <tr>
                                <th>Payroll month</th>
                                <th>Employees</th>
                                <th>Gross payroll</th>
                                <th>Deductions</th>
                                <th>Net payout</th>
                                <th>Last updated</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRuns.map((run) => (
                                <tr key={run.id || run.period}>
                                    <td>
                                        <strong className="payroll-history-period">
                                            {getPeriodLabel(run.period)}
                                        </strong>
                                    </td>
                                    <td>
                                        {run.employeeCount ?? run.employee_count ?? getRunEmployees(run).length}
                                    </td>
                                    <td>{money(getGross(run))}</td>
                                    <td>{money(getDeductions(run))}</td>
                                    <td className="payroll-history-net">{money(getNet(run))}</td>
                                    <td>{formatDateTime(run.updatedAt || run.updated_at || run.createdAt || run.created_at)}</td>
                                    <td>
                                        <span
                                            className={`payroll-history-status ${getStatusClass(run.status)}`}
                                        >
                                            {run.status || "Draft"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="payroll-history-row-actions">
                                            <button
                                                type="button"
                                                onClick={() => openRun(run)}
                                                aria-label={`View ${getPeriodLabel(run.period)}`}
                                                title="View details"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleExportRun(run)}
                                                aria-label={`Export ${getPeriodLabel(run.period)}`}
                                                title="Export CSV"
                                            >
                                                <FileText size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredRuns.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="payroll-history-empty">
                                            <FileText size={28} />
                                            <strong>No payroll runs found</strong>
                                            <p>
                                                Save a payroll draft from Process Payroll, or change
                                                your filters.
                                            </p>
                                            <Link
                                                className="payroll-history-empty__link"
                                                to="/account/process-payroll"
                                            >
                                                Process payroll
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {selectedRun && (
                <div
                    className="payroll-history-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setSelectedRun(null);
                    }}
                >
                    <section
                        className="payroll-history-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payroll-history-modal-title"
                    >
                        <div className="payroll-history-modal-header">
                            <div>
                                <span className="payroll-history-modal-eyebrow">
                                    PAYROLL DETAILS
                                </span>
                                <h2 id="payroll-history-modal-title">
                                    {getPeriodLabel(selectedRun.period)}
                                </h2>
                                <span
                                    className={`payroll-history-status ${getStatusClass(selectedRun.status)}`}
                                >
                                    {selectedRun.status || "Draft"}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="payroll-history-close"
                                onClick={() => setSelectedRun(null)}
                                aria-label="Close details"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="payroll-history-modal-summary">
                            <div>
                                <span>Employees</span>
                                <strong>
                                    {selectedRun.employeeCount ?? selectedRun.employee_count ??
                                        getRunEmployees(selectedRun).length}
                                </strong>
                            </div>
                            <div>
                                <span>Gross</span>
                                <strong>{money(getGross(selectedRun))}</strong>
                            </div>
                            <div>
                                <span>Deductions</span>
                                <strong>{money(getDeductions(selectedRun))}</strong>
                            </div>
                            <div>
                                <span>Net payout</span>
                                <strong>{money(getNet(selectedRun))}</strong>
                            </div>
                        </div>

                        <div className="payroll-history-modal-body">

                            <div className="payroll-history-run-meta">
                                <span>
                                    Created: {formatDateTime(selectedRun.createdAt || selectedRun.created_at)}
                                </span>
                                <span>
                                    Updated: {formatDateTime(selectedRun.updatedAt || selectedRun.updated_at)}
                                </span>

                                {(selectedRun.approvedAt || selectedRun.approved_at) && (
                                    <span>
                                        Approved by {selectedRun.approvedBy || selectedRun.approved_by || "Unknown"} on{" "}
                                        {formatDateTime(selectedRun.approvedAt || selectedRun.approved_at)}
                                    </span>
                                )}

                                {(selectedRun.lockedAt || selectedRun.locked_at) && (
                                    <span>
                                        Locked by {selectedRun.lockedBy || selectedRun.locked_by || "Unknown"} on{" "}
                                        {formatDateTime(selectedRun.lockedAt || selectedRun.locked_at)}
                                    </span>
                                )}
                            </div>

                            {Array.isArray(selectedRun.auditTrail || selectedRun.audit_trail) &&
                                (selectedRun.auditTrail || selectedRun.audit_trail).length > 0 && (
                                    <div className="payroll-history-audit">
                                        <h3>Activity history</h3>

                                        {(selectedRun.auditTrail || selectedRun.audit_trail).map((entry, index) => (
                                            <div
                                                className="payroll-history-audit-entry"
                                                key={`${entry.timestamp}-${index}`}
                                            >
                                                <div>
                                                    <strong>{entry.action}</strong>
                                                    <span> by {entry.actor}</span>
                                                </div>
                                                <time>{formatDateTime(entry.timestamp)}</time>
                                            </div>
                                        ))}
                                    </div>
                                )}


                            <div className="payroll-history-table-wrap">
                                <table className="payroll-history-table payroll-history-detail-table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Basic</th>
                                            <th>Gross</th>
                                            <th>Deductions</th>
                                            <th>Net pay</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getRunEmployees(selectedRun).map((employee, index) => (
                                            <Fragment                                             key={employee.id ?? employee.record_id ?? employee.payroll_record_id ?? `${getEmployeeCode(employee)}-${index}`}>
                                                <tr>
                                                    <td>
                                                        <div className="payroll-history-employee">
                                                            <strong>{getEmployeeName(employee)}</strong>
                                                            <span>{getEmployeeCode(employee)}</span>
                                                        </div>
                                                    </td>
                                                    <td>{money(employee.basic)}</td>
                                                    <td>{money(employee.gross)}</td>
                                                    <td>{money(employee.totalDeductions ?? employee.total_deductions)}</td>
                                                    <td className="payroll-history-net">
                                                        {money(employee.net ?? employee.net_pay)}
                                                    </td>
                                                    <td>{employee.status || "—"}</td>
                                                    <td>
                                                        {String(selectedRun.status).toLowerCase() === "draft" &&
                                                            (employee.id ?? employee.record_id ?? employee.payroll_record_id) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const id = employee.id ?? employee.record_id ?? employee.payroll_record_id;
                                                                        setEditingRecordId(id);
                                                                        setRecordForm({
                                                                            basic: String(employee.basic ?? ""),
                                                                            hra: String(employee.hra ?? ""),
                                                                            other_allowances: String(employee.other_allowances ?? employee.otherAllowances ?? ""),
                                                                            bonus: String(employee.bonus ?? ""),
                                                                            pf: String(employee.pf ?? ""),
                                                                            insurance: String(employee.insurance ?? ""),
                                                                            other_deductions: String(employee.other_deductions ?? employee.otherDeductions ?? ""),
                                                                        });
                                                                    }}
                                                                    aria-label={`Adjust ${getEmployeeName(employee)} payroll`}
                                                                    title="Adjust record"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                            )}
                                                    </td>
                                                </tr>
                                                {editingRecordId === (employee.id ?? employee.record_id ?? employee.payroll_record_id) && (
                                                    <tr>
                                                        <td colSpan={7}>
                                                            <form
                                                                className="payroll-history-record-editor"
                                                                onSubmit={(event) => {
                                                                    event.preventDefault();
                                                                    saveRecordAdjustment(employee);
                                                                }}
                                                            >
                                                                {[
                                                                    ["basic", "Basic"],
                                                                    ["hra", "HRA"],
                                                                    ["other_allowances", "Other allowances"],
                                                                    ["bonus", "Bonus"],
                                                                    ["pf", "PF"],
                                                                    ["insurance", "Insurance"],
                                                                    ["other_deductions", "Other deductions"],
                                                                ].map(([field, label]) => (
                                                                    <label key={field}>
                                                                        {label}
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={recordForm[field] ?? ""}
                                                                            onChange={(event) =>
                                                                                setRecordForm((current) => ({
                                                                                    ...current,
                                                                                    [field]: event.target.value,
                                                                                }))
                                                                            }
                                                                        />
                                                                    </label>
                                                                ))}
                                                                <Button type="submit" disabled={actionLoading}>
                                                                    <Save size={15} /> Save adjustment
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    onClick={() => setEditingRecordId(null)}
                                                                    disabled={actionLoading}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </form>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        ))}

                                        {getRunEmployees(selectedRun).length === 0 && (
                                            <tr>
                                                <td colSpan={7}>
                                                    No employee details were stored in this run.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                        <div className="payroll-history-modal-footer">
                            <Button
                                variant="secondary"
                                onClick={() => setSelectedRun(null)}
                            >
                                Close
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => handleExportRun(selectedRun)}
                            >
                                <FileText size={16} />
                                Export CSV
                            </Button>

                            {String(selectedRun.status || "Draft").toLowerCase() === "draft" && (
                                <Button
                                    onClick={() => changeRunStatus(selectedRun, "Approved")}
                                    disabled={actionLoading}
                                >
                                    <FileText size={16} />
                                    {actionLoading ? "Processing..." : "Approve Payroll"}
                                </Button>
                            )}

                            {["approved", "finalized"].includes(
                                String(selectedRun.status || "").toLowerCase()
                            ) && (
                                <>
                                    {String(selectedRun.status || "").toLowerCase() === "approved" && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => changeRunStatus(selectedRun, "Finalized")}
                                            disabled={actionLoading}
                                        >
                                            <FileText size={16} />
                                            {actionLoading ? "Processing..." : "Finalize Payroll"}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => changeRunStatus(selectedRun, "Locked")}
                                        disabled={actionLoading}
                                    >
                                        <Wallet size={16} />
                                        {actionLoading ? "Processing..." : "Lock Payroll"}
                                    </Button>
                                    {String(selectedRun.status || "").toLowerCase() === "approved" && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => changeRunStatus(selectedRun, "Cancelled")}
                                            disabled={actionLoading}
                                        >
                                            Cancel Payroll
                                        </Button>
                                    )}
                                </>
                            )}

                            {String(selectedRun.status || "Draft").toLowerCase() === "draft" && (
                                <>
                                    <Button
                                        variant="secondary"
                                        onClick={() => changeRunStatus(selectedRun, "Recalculate")}
                                        disabled={actionLoading}
                                    >
                                        <RefreshCw size={16} />
                                        Recalculate
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => changeRunStatus(selectedRun, "Cancelled")}
                                        disabled={actionLoading}
                                    >
                                        Cancel Draft
                                    </Button>
                                </>
                            )}

                            {String(selectedRun.status || "").toLowerCase() === "locked" && (
                                <span className="payroll-history-locked-label">
                                    <CircleAlert size={16} />
                                    Payroll Locked
                                </span>
                            )}
                        </div>

                    </section>
                </div>
            )}
        </div>
    );
}
