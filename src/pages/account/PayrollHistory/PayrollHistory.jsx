import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    CalendarDays,
    Calendar,
    CircleAlert,
    CheckCircle2,
    Eye,
    FileText,
    Download,
    RefreshCw,
    Search,
    Wallet,
    X,
    Lock,
    TrendingUp,
    TrendingDown,
    Building2,
    AlertTriangle,
    Users,
    History,
    ChevronDown,
} from "lucide-react";

import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import DatePicker from "../../../components/common/DatePicker/DatePicker";
import ConfirmModal from "../../../components/common/ConfirmModal/ConfirmModal";
import PayrollWorkflowNav from "../../../components/account/PayrollWorkflowNav";
import EmployeePayrollDetailDrawer from "../../../components/account/EmployeePayrollDetailDrawer/EmployeePayrollDetailDrawer";
import { useNotification } from "../../../context/NotificationContext";
import {
    getPayrollDrafts,
    getPayrollDraft,
    approvePayrollDraft,
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
    employee.employeeName ||
    employee.employee_name ||
    employee.name ||
    employee.employee_snapshot?.full_name ||
    "Employee";

const getEmployeeCode = (employee) =>
    employee.employeeCode ||
    employee.employee_code ||
    employee.employee_snapshot?.employee_code ||
    "—";

const getGross = (run) =>
    run.gross ??
    run.total_gross ??
    run.gross_payroll ??
    getRunEmployees(run).reduce(
        (sum, employee) => sum + (Number(employee.gross ?? employee.gross_salary) || 0),
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
        (sum, employee) => sum + (Number(employee.net ?? employee.net_salary ?? employee.net_pay) || 0),
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
    const [recalculatingModal, setRecalculatingModal] = useState(false);

    // Modal employee search filter
    const [modalSearch, setModalSearch] = useState("");

    // Detailed employee calculation drawer state
    const [selectedDrawerRecord, setSelectedDrawerRecord] = useState(null);

    // ConfirmModal state (replaces native window.confirm)
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        title: "",
        description: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        variant: "primary",
        onConfirm: null,
    });

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
            setModalSearch("");
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

    // Close confirm modal
    const closeConfirm = () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
    };

    // Trigger status transition with Ignite ConfirmModal
    const requestStatusChange = (run, nextStatus) => {
        const currentStatus = String(run.status || "Draft").toUpperCase();
        const periodStr = getPeriodLabel(run.period);

        if (nextStatus === "Approved") {
            if (currentStatus !== "DRAFT") {
                notify("error", "Only DRAFT payroll runs can be approved.");
                return;
            }
            setConfirmModal({
                open: true,
                title: "Approve Payroll Draft",
                description: `Approve payroll draft for ${periodStr}? This indicates the draft has been reviewed by the accountant.`,
                confirmText: "Approve Payroll",
                cancelText: "Cancel",
                variant: "primary",
                onConfirm: async () => executeStatusChange(run, "Approved"),
            });
        } else if (nextStatus === "Finalized") {
            if (!["DRAFT", "APPROVED"].includes(currentStatus)) {
                notify("error", `Cannot finalize a payroll run with status '${currentStatus}'.`);
                return;
            }
            setConfirmModal({
                open: true,
                title: "Finalize Payroll Run",
                description: `Finalize payroll for ${periodStr}? This permanently freezes calculations and generates official payslips for all included employees.`,
                confirmText: "Finalize Payroll",
                cancelText: "Cancel",
                variant: "primary",
                onConfirm: async () => executeStatusChange(run, "Finalized"),
            });
        } else if (nextStatus === "Locked") {
            if (["LOCKED", "CANCELLED"].includes(currentStatus)) {
                notify("error", `Cannot lock a payroll run with status '${currentStatus}'.`);
                return;
            }
            setConfirmModal({
                open: true,
                title: "Lock Payroll Run",
                description: `Lock payroll for ${periodStr}? This freezes all records and closes the payroll period. This action cannot be undone.`,
                confirmText: "Lock Payroll",
                cancelText: "Cancel",
                variant: "danger",
                onConfirm: async () => executeStatusChange(run, "Locked"),
            });
        } else if (nextStatus === "Cancelled") {
            if (!["DRAFT", "APPROVED"].includes(currentStatus)) {
                notify("error", "Only DRAFT or APPROVED payroll runs can be cancelled.");
                return;
            }
            setConfirmModal({
                open: true,
                title: "Cancel Payroll Run",
                description: `Cancel payroll run for ${periodStr}? This action cannot be undone.`,
                confirmText: "Cancel Run",
                cancelText: "Keep Run",
                variant: "danger",
                onConfirm: async () => executeStatusChange(run, "Cancelled"),
            });
        } else if (nextStatus === "Recalculate") {
            if (currentStatus !== "DRAFT") {
                notify("error", "Only DRAFT payroll runs can be recalculated.");
                return;
            }
            setConfirmModal({
                open: true,
                title: "Recalculate Draft Payroll",
                description: `Re-evaluate attendance and salary formulas for ${periodStr}? Any manual adjustments will be preserved.`,
                confirmText: "Recalculate Now",
                cancelText: "Cancel",
                variant: "primary",
                onConfirm: async () => handleRecalculateDraft(run.id),
            });
        }
    };

    const executeStatusChange = async (run, nextStatus) => {
        setActionLoading(true);
        try {
            if (nextStatus === "Approved") {
                await approvePayrollDraft(run.id);
            } else if (nextStatus === "Finalized") {
                await finalizePayrollRun(run.id);
            } else if (nextStatus === "Locked") {
                await lockPayrollRun(run.id);
            } else if (nextStatus === "Cancelled") {
                await cancelPayrollRun(run.id, { reason: "Cancelled by authorized accountant" });
            }

            notify(
                "success",
                nextStatus === "Approved"
                    ? "Payroll approved successfully."
                    : nextStatus === "Finalized"
                        ? "Payroll finalized and payslips generated successfully."
                        : nextStatus === "Locked"
                            ? "Payroll locked and frozen successfully."
                            : "Payroll run cancelled successfully."
            );

            closeConfirm();
            await fetchRuns();
            await openRun(run);
        } catch (error) {
            console.error("Failed to update payroll status:", error);
            notify(
                "error",
                error?.response?.data?.error ||
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Could not update payroll status. Please try again."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // Recalculate draft action
    const handleRecalculateDraft = async (runId) => {
        setRecalculatingModal(true);
        closeConfirm();
        try {
            const updated = await recalculatePayrollDraft(runId);
            notify("success", "Payroll draft recalculated and formulas refreshed.");
            const detail = updated?.data ?? updated;
            setSelectedRun({
                ...detail,
                employees: detail.employees ?? detail.records ?? detail.payroll_records,
                period: detail.period ?? selectedRun?.period,
                status: detail.status ?? selectedRun?.status,
            });
            await fetchRuns();
        } catch (error) {
            console.error("Failed to recalculate draft:", error);
            notify(
                "error",
                error?.response?.data?.error ||
                error?.response?.data?.detail ||
                "Failed to recalculate payroll draft."
            );
        } finally {
            setRecalculatingModal(false);
        }
    };

    // CSV export connected to GET /api/account/payroll/drafts/{id}/export/
    const handleExportRun = async (run) => {
        if (!run?.id) {
            notify("error", "This payroll run does not include a backend ID.");
            return;
        }
        setActionLoading(true);
        try {
            const blob = await exportPayrollRun(run.id);
            triggerBlobDownload(blob, `payroll_${run.period}_${String(run.status || "draft").toLowerCase()}.csv`);
            notify("success", "Payroll CSV exported successfully.");
        } catch (error) {
            console.error("Failed to export payroll:", error);
            notify(
                "error",
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Unable to export this payroll run."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // Handle record updated inside EmployeePayrollDetailDrawer
    const handleRecordUpdated = (updatedRecord, updatedRun) => {
        if (updatedRun) {
            setSelectedRun({
                ...updatedRun,
                employees: updatedRun.employees ?? updatedRun.records,
                period: updatedRun.period,
                status: updatedRun.status,
            });
            fetchRuns();
        } else if (selectedRun && updatedRecord) {
            const currentEmployees = getRunEmployees(selectedRun);
            const nextEmployees = currentEmployees.map((emp) =>
                String(emp.id) === String(updatedRecord.id) ? { ...emp, ...updatedRecord } : emp
            );
            setSelectedRun((prev) => ({
                ...prev,
                employees: nextEmployees,
            }));
            fetchRuns();
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
                String(run.period).toLowerCase().includes(term) ||
                getPeriodLabel(run.period).toLowerCase().includes(term);

            const matchesMonth =
                monthFilter === "all" ||
                !monthFilter ||
                String(run.period) === String(monthFilter);

            const matchesStatus =
                statusFilter === "all" ||
                !statusFilter ||
                String(run.status || "Draft").toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesMonth && matchesStatus;
        });
    }, [sortedRuns, search, monthFilter, statusFilter]);

    const summary = useMemo(() => {
        return runs.reduce(
            (acc, run) => ({
                gross: acc.gross + getGross(run),
                deductions: acc.deductions + getDeductions(run),
                net: acc.net + getNet(run),
            }),
            { gross: 0, deductions: 0, net: 0 }
        );
    }, [runs]);

    // Modal employee list filtered by modalSearch
    const modalEmployees = useMemo(() => {
        const list = getRunEmployees(selectedRun);
        if (!modalSearch.trim()) return list;
        const q = modalSearch.trim().toLowerCase();
        return list.filter((emp) => {
            const name = getEmployeeName(emp).toLowerCase();
            const code = getEmployeeCode(emp).toLowerCase();
            const dept = String(emp.department || emp.department_name || "").toLowerCase();
            return name.includes(q) || code.includes(q) || dept.includes(q);
        });
    }, [selectedRun, modalSearch]);

    return (
        <div className="payroll-history-page">
            <PageHeader
                title="Payroll History & Drafts"
                subtitle="Review, adjust, recalculate, finalize and export historical or draft payroll periods."
            />

            <PayrollWorkflowNav />

            {/* KPI STAT CARDS */}
            <div className="payroll-history-summary">
                <Card>
                    <div className="payroll-history-stat">
                        <span className="payroll-history-stat-icon">
                            <CalendarDays size={19} />
                        </span>
                        <div>
                            <span>Total payroll runs</span>
                            <strong>{runs.length}</strong>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="payroll-history-stat">
                        <span className="payroll-history-stat-icon">
                            <TrendingUp size={19} />
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
                            <TrendingDown size={19} />
                        </span>
                        <div>
                            <span>Combined deductions</span>
                            <strong>{money(summary.deductions)}</strong>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="payroll-history-stat">
                        <span className="payroll-history-stat-icon">
                            <Wallet size={19} />
                        </span>
                        <div>
                            <span>Combined net payout</span>
                            <strong>{money(summary.net)}</strong>
                        </div>
                    </div>
                </Card>
            </div>

            {/* MAIN HISTORY TABLE */}
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

                    <div className="payroll-history-datepicker-wrap">
                        <DatePicker
                            mode="month"
                            value={monthFilter === "all" ? "" : monthFilter}
                            onChange={(val) => setMonthFilter(val)}
                            placeholder="Filter by month"
                        />
                    </div>

                    {monthFilter !== "all" && (
                        <Button
                            variant="secondary"
                            onClick={() => setMonthFilter("all")}
                        >
                            All Months
                        </Button>
                    )}

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
                                            <span className="badge-dot" />
                                            {run.status || "Draft"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="payroll-history-row-actions">
                                            <button
                                                type="button"
                                                onClick={() => openRun(run)}
                                                aria-label={`View ${getPeriodLabel(run.period)}`}
                                                title="View details & employees"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleExportRun(run)}
                                                aria-label={`Export ${getPeriodLabel(run.period)}`}
                                                title="Export CSV"
                                            >
                                                <Download size={17} />
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
                                                Process a payroll month or change your filters.
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

            {/* DRAFT PAYROLL VIEWING MODAL */}
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
                        {/* 1. Modal Header */}
                        <div className="payroll-history-modal-header">
                            <div>
                                <span className="payroll-history-modal-eyebrow">
                                    PAYROLL DRAFT REVIEW &amp; PROCESSING
                                </span>
                                <div className="payroll-modal-title-row">
                                    <h2 id="payroll-history-modal-title">
                                        {getPeriodLabel(selectedRun.period)}
                                    </h2>
                                    <span
                                        className={`payroll-history-status ${getStatusClass(selectedRun.status)}`}
                                    >
                                        <span className="badge-dot" />
                                        {selectedRun.status || "Draft"}
                                    </span>
                                </div>
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

                        {/* 2. Executive Summary Hero Banner */}
                        <div className="payroll-modal-summary-banner">
                            <div className="payroll-modal-hero-left">
                                <div className="payroll-modal-hero-top-row">
                                    <div className="payroll-modal-period-badge">
                                        <Calendar size={14} />
                                        <span>{selectedRun.period}</span>
                                    </div>
                                    <div className="payroll-modal-emp-badge">
                                        <Users size={14} />
                                        <span>
                                            {selectedRun.employeeCount ?? selectedRun.employee_count ?? getRunEmployees(selectedRun).length} Employees Enrolled
                                        </span>
                                    </div>
                                </div>
                                <div className="payroll-modal-meta-chips">
                                    <span>Created {formatDateTime(selectedRun.createdAt || selectedRun.created_at)}</span>
                                    <span>•</span>
                                    <span>Updated {formatDateTime(selectedRun.updatedAt || selectedRun.updated_at)}</span>
                                    {(selectedRun.approvedAt || selectedRun.approved_at) && (
                                        <>
                                            <span>•</span>
                                            <span className="meta-highlight">
                                                Approved by {selectedRun.approvedBy || selectedRun.approved_by || "Accountant"} on {formatDateTime(selectedRun.approvedAt || selectedRun.approved_at)}
                                            </span>
                                        </>
                                    )}
                                    {(selectedRun.finalizedAt || selectedRun.finalized_at) && (
                                        <>
                                            <span>•</span>
                                            <span className="meta-highlight">
                                                Finalized by {selectedRun.finalizedBy || selectedRun.finalized_by || "Accountant"} on {formatDateTime(selectedRun.finalizedAt || selectedRun.finalized_at)}
                                            </span>
                                        </>
                                    )}
                                    {(selectedRun.lockedAt || selectedRun.locked_at) && (
                                        <>
                                            <span>•</span>
                                            <span className="meta-highlight">
                                                Locked by {selectedRun.lockedBy || selectedRun.locked_by || "Accountant"} on {formatDateTime(selectedRun.lockedAt || selectedRun.locked_at)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="payroll-modal-hero-kpis">
                                <div className="payroll-modal-kpi-card gross">
                                    <div className="kpi-icon-wrap">
                                        <TrendingUp size={16} />
                                    </div>
                                    <div className="kpi-content">
                                        <span className="kpi-label">Total Gross</span>
                                        <strong className="kpi-value">{money(getGross(selectedRun))}</strong>
                                    </div>
                                </div>

                                <div className="payroll-modal-kpi-card deductions">
                                    <div className="kpi-icon-wrap">
                                        <TrendingDown size={16} />
                                    </div>
                                    <div className="kpi-content">
                                        <span className="kpi-label">Total Deductions</span>
                                        <strong className="kpi-value">{money(getDeductions(selectedRun))}</strong>
                                    </div>
                                </div>

                                <div className="payroll-modal-kpi-card net">
                                    <div className="kpi-icon-wrap">
                                        <Wallet size={16} />
                                    </div>
                                    <div className="kpi-content">
                                        <span className="kpi-label">Net Payable Amount</span>
                                        <strong className="kpi-value">{money(getNet(selectedRun))}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Modal Body */}
                        <div className="payroll-history-modal-body">
                            {/* Recalculating Overlay */}
                            {recalculatingModal && (
                                <div className="payroll-modal-recalculating-overlay">
                                    <RefreshCw size={18} className="animate-spin" />
                                    <span>Recalculating formulas and updating attendance for this draft...</span>
                                </div>
                            )}

                            {/* Searchable Employee Table Toolbar */}
                            <div className="payroll-modal-table-header">
                                <div className="payroll-modal-table-title">
                                    <h3>Included Employees &amp; Calculations</h3>
                                    <span className="payroll-modal-count-badge">
                                        {modalEmployees.length} of {getRunEmployees(selectedRun).length} employees
                                    </span>
                                </div>

                                <div className="payroll-modal-search-box">
                                    <Search size={15} />
                                    <input
                                        type="search"
                                        placeholder="Search employee by name, code or department..."
                                        value={modalSearch}
                                        onChange={(e) => setModalSearch(e.target.value)}
                                    />
                                    {modalSearch && (
                                        <button
                                            type="button"
                                            className="search-clear-btn"
                                            onClick={() => setModalSearch("")}
                                            title="Clear search"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Searchable Employee Table */}
                            <div className="payroll-history-table-wrap">
                                <table className="payroll-history-table payroll-history-detail-table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Department</th>
                                            <th>Gross Salary</th>
                                            <th>Deductions</th>
                                            <th>Net Salary</th>
                                            <th>Status</th>
                                            <th>Exceptions</th>
                                            <th className="text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalEmployees.map((employee, index) => {
                                            const excList = Array.isArray(employee.exceptions) ? employee.exceptions : [];
                                            const rowGross = Number(employee.gross ?? employee.gross_salary ?? 0);
                                            const rowDeductions = Number(employee.totalDeductions ?? employee.total_deductions ?? 0);
                                            const rowNet = Number(employee.net ?? employee.net_salary ?? employee.net_pay ?? 0);
                                            const rowDept = employee.department || employee.employee_snapshot?.department_name || "—";

                                            return (
                                                <tr
                                                    key={employee.id ?? `${getEmployeeCode(employee)}-${index}`}
                                                    className="payroll-modal-clickable-row"
                                                    onClick={() => setSelectedDrawerRecord(employee)}
                                                    title="Click to view full salary calculation and adjustments"
                                                >
                                                    <td>
                                                        <div className="payroll-history-employee">
                                                            <strong>{getEmployeeName(employee)}</strong>
                                                            <span>{getEmployeeCode(employee)}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="payroll-emp-dept">{rowDept}</span>
                                                    </td>
                                                    <td className="font-medium">{money(rowGross)}</td>
                                                    <td className="font-medium text-danger">{money(rowDeductions)}</td>
                                                    <td className="payroll-history-net font-bold">{money(rowNet)}</td>
                                                    <td>
                                                        <span className="payroll-emp-status-badge">
                                                            {employee.status || "Ready"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {excList.length > 0 ? (
                                                            <span className="payroll-exc-badge" title={excList.join(" • ")}>
                                                                <AlertTriangle size={12} />
                                                                {excList.length} warning{excList.length > 1 ? "s" : ""}
                                                            </span>
                                                        ) : (
                                                            <span className="payroll-no-exc">—</span>
                                                        )}
                                                    </td>
                                                    <td className="text-right payroll-modal-action-cell" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            className="payroll-modal-view-btn"
                                                            onClick={() => setSelectedDrawerRecord(employee)}
                                                            title="View detailed calculation & adjustments"
                                                        >
                                                            <Eye size={13} />
                                                            <span>View</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {modalEmployees.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="text-center py-6 text-muted">
                                                    {modalSearch
                                                        ? `No employees match "${modalSearch}".`
                                                        : "No employee records found in this run."}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Activity History Audit Trail */}
                            {Array.isArray(selectedRun.auditTrail || selectedRun.audit_trail) &&
                                (selectedRun.auditTrail || selectedRun.audit_trail).length > 0 && (
                                    <details className="payroll-modal-audit-accordion">
                                        <summary className="payroll-modal-audit-summary">
                                            <div className="audit-summary-title">
                                                <History size={15} />
                                                <span>Audit Trail &amp; Activity Log ({(selectedRun.auditTrail || selectedRun.audit_trail).length})</span>
                                            </div>
                                            <ChevronDown size={15} className="audit-accordion-chevron" />
                                        </summary>
                                        <div className="payroll-audit-trail-list">
                                            {(selectedRun.auditTrail || selectedRun.audit_trail).map((entry, index) => (
                                                <div
                                                    className="payroll-history-audit-entry"
                                                    key={`${entry.timestamp}-${index}`}
                                                >
                                                    <div className="audit-entry-main">
                                                        <span className="audit-dot" />
                                                        <strong>{entry.action}</strong>
                                                        <span> by {entry.actor}</span>
                                                    </div>
                                                    <time>{formatDateTime(entry.timestamp)}</time>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                        </div>

                        {/* 4. Modal Action Footer */}
                        <div className="payroll-history-modal-footer">
                            <div className="payroll-modal-footer-left">
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedRun(null)}
                                >
                                    Close
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={() => handleExportRun(selectedRun)}
                                    disabled={actionLoading}
                                    title="Export payroll register as CSV"
                                >
                                    <Download size={14} />
                                    Export CSV
                                </Button>
                            </div>

                            <div className="payroll-modal-footer-right">
                                {/* Draft specific actions */}
                                {String(selectedRun.status || "Draft").toLowerCase() === "draft" && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            onClick={() => requestStatusChange(selectedRun, "Recalculate")}
                                            disabled={actionLoading || recalculatingModal}
                                        >
                                            <RefreshCw size={14} />
                                            Recalculate
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            onClick={() => requestStatusChange(selectedRun, "Approved")}
                                            disabled={actionLoading}
                                        >
                                            <CheckCircle2 size={14} />
                                            Approve Draft
                                        </Button>

                                        <Button
                                            onClick={() => requestStatusChange(selectedRun, "Finalized")}
                                            disabled={actionLoading}
                                        >
                                            <FileText size={14} />
                                            Finalize Payroll
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            onClick={() => requestStatusChange(selectedRun, "Cancelled")}
                                            disabled={actionLoading}
                                        >
                                            Cancel Draft
                                        </Button>
                                    </>
                                )}

                                {/* Approved specific actions */}
                                {String(selectedRun.status || "").toLowerCase() === "approved" && (
                                    <>
                                        <Button
                                            onClick={() => requestStatusChange(selectedRun, "Finalized")}
                                            disabled={actionLoading}
                                        >
                                            <FileText size={14} />
                                            Finalize Payroll
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            onClick={() => requestStatusChange(selectedRun, "Locked")}
                                            disabled={actionLoading}
                                        >
                                            <Lock size={14} />
                                            Lock Payroll
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            onClick={() => requestStatusChange(selectedRun, "Cancelled")}
                                            disabled={actionLoading}
                                        >
                                            Cancel Run
                                        </Button>
                                    </>
                                )}

                                {/* Finalized specific actions */}
                                {String(selectedRun.status || "").toLowerCase() === "finalized" && (
                                    <Button
                                        onClick={() => requestStatusChange(selectedRun, "Locked")}
                                        disabled={actionLoading}
                                    >
                                        <Lock size={14} />
                                        Lock Payroll
                                    </Button>
                                )}

                                {/* Locked status label */}
                                {String(selectedRun.status || "").toLowerCase() === "locked" && (
                                    <span className="payroll-history-locked-label">
                                        <Lock size={14} />
                                        Payroll Locked (Frozen)
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* EMPLOYEE PAYROLL DETAILED CALCULATION DRAWER */}
            {selectedDrawerRecord && (
                <EmployeePayrollDetailDrawer
                    open={Boolean(selectedDrawerRecord)}
                    onClose={() => setSelectedDrawerRecord(null)}
                    record={selectedDrawerRecord}
                    runId={selectedRun?.id}
                    runStatus={selectedRun?.status || "DRAFT"}
                    period={selectedRun?.period}
                    onRecordUpdated={handleRecordUpdated}
                    onRecalculateDraft={() => handleRecalculateDraft(selectedRun.id)}
                />
            )}

            {/* CONFIRM MODAL (NO WINDOW.CONFIRM) */}
            <ConfirmModal
                open={confirmModal.open}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                variant={confirmModal.variant}
                loading={actionLoading}
            />
        </div>
    );
}
