
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    CalendarDays,
    CircleAlert,
    Eye,
    FileText,
    RefreshCw,
    Search,
    Wallet,
    X,
} from "lucide-react";

import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import PayrollWorkflowNav from "../../../components/account/PayrollWorkflowNav";
import { useNotification } from "../../../context/NotificationContext";

import "./PayrollHistory.css";

const STORAGE_KEY = "ignite_payroll_runs";

const readRuns = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
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
    Array.isArray(run?.employees) ? run.employees : [];

const getEmployeeName = (employee) =>
    employee.employeeName || employee.employee_name || employee.name || "Employee";

const getEmployeeCode = (employee) =>
    employee.employeeCode || employee.employee_code || "—";

const getGross = (run) =>
    run.gross ??
    getRunEmployees(run).reduce(
        (sum, employee) => sum + (Number(employee.gross) || 0),
        0
    );

const getDeductions = (run) =>
    run.deductions ??
    getRunEmployees(run).reduce(
        (sum, employee) => sum + (Number(employee.totalDeductions) || 0),
        0
    );

const getNet = (run) =>
    run.net ??
    getRunEmployees(run).reduce(
        (sum, employee) => sum + (Number(employee.net) || 0),
        0
    );

const getStatusClass = (status) => {
    const normalized = String(status || "Draft").toLowerCase();

    if (normalized === "approved") return "is-approved";
    if (normalized === "locked") return "is-locked";
    return "is-draft";
};

const getCurrentActor = () => {
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return (
            user.full_name ||
            user.name ||
            user.email ||
            user.username ||
            "Current user"
        );
    } catch {
        return "Current user";
    }
};

const validatePayrollRun = (run) => {
    const employees = getRunEmployees(run);

    if (employees.length === 0) {
        return "This payroll run has no employee records.";
    }

    if (employees.some((employee) => employee.status !== "Ready")) {
        return "Resolve all employee payroll exceptions before approval.";
    }

    for (const employee of employees) {
        const amounts = [
            employee.basic,
            employee.hra,
            employee.otherAllowances,
            employee.bonus,
            employee.gross,
            employee.pf,
            employee.insurance,
            employee.otherDeductions,
            employee.totalDeductions,
            employee.net,
        ];

        if (
            amounts.some(
                (amount) =>
                    amount === null ||
                    amount === undefined ||
                    amount === "" ||
                    !Number.isFinite(Number(amount)) ||
                    Number(amount) < 0
            )
        ) {
            return `Invalid or negative salary amount found for ${getEmployeeName(employee)}.`;
        }

        const expectedGross =
            Number(employee.basic) +
            Number(employee.hra) +
            Number(employee.otherAllowances) +
            Number(employee.bonus);

        const expectedDeductions =
            Number(employee.pf) +
            Number(employee.insurance) +
            Number(employee.otherDeductions);

        const expectedNet = expectedGross - expectedDeductions;

        if (
            Math.abs(expectedGross - Number(employee.gross)) > 0.01 ||
            Math.abs(expectedDeductions - Number(employee.totalDeductions)) > 0.01 ||
            Math.abs(expectedNet - Number(employee.net)) > 0.01
        ) {
            return `Salary totals do not match for ${getEmployeeName(employee)}. Regenerate and review payroll.`;
        }
    }

    const calculatedGross = employees.reduce(
        (sum, employee) => sum + Number(employee.gross),
        0
    );
    const calculatedDeductions = employees.reduce(
        (sum, employee) => sum + Number(employee.totalDeductions),
        0
    );
    const calculatedNet = employees.reduce(
        (sum, employee) => sum + Number(employee.net),
        0
    );

    if (
        Math.abs(calculatedGross - Number(getGross(run))) > 0.01 ||
        Math.abs(calculatedDeductions - Number(getDeductions(run))) > 0.01 ||
        Math.abs(calculatedNet - Number(getNet(run))) > 0.01
    ) {
        return "The payroll summary does not match its employee records.";
    }

    return null;
};


export default function PayrollHistory() {
    const { showNotification } = useNotification();

    const [runs, setRuns] = useState(readRuns);
    const [search, setSearch] = useState("");
    const [monthFilter, setMonthFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedRun, setSelectedRun] = useState(null);

    const refreshRuns = () => {
        const latest = readRuns();
        setRuns(latest);
        setSelectedRun((current) =>
            current ? latest.find((run) => run.id === current.id) || null : null
        );
    };

    const changeRunStatus = (run, nextStatus) => {
        const currentStatus = String(run.status || "Draft");

        if (nextStatus === "Approved") {
            if (currentStatus !== "Draft") {
                showNotification("Only draft payroll can be approved.", "error");
                return;
            }

            const validationError = validatePayrollRun(run);

            if (validationError) {
                showNotification(validationError, "error");
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
            if (currentStatus !== "Approved") {
                showNotification("Only approved payroll can be locked.", "error");
                return;
            }

            if (
                !window.confirm(
                    `Lock payroll for ${getPeriodLabel(run.period)}? This action cannot be undone from this demo interface.`
                )
            ) {
                return;
            }
        } else {
            return;
        }

        try {
            const latestRuns = readRuns();
            const targetRun = latestRuns.find(
                (item) => String(item.id) === String(run.id)
            );

            if (!targetRun) {
                showNotification("Payroll run not found. Refresh and try again.", "error");
                refreshRuns();
                return;
            }

            // Recheck the status against the latest browser-stored record.
            const latestStatus = String(targetRun.status || "Draft");

            if (
                (nextStatus === "Approved" && latestStatus !== "Draft") ||
                (nextStatus === "Locked" && latestStatus !== "Approved")
            ) {
                showNotification(
                    "The payroll status has changed. Refresh and try again.",
                    "error"
                );
                refreshRuns();
                return;
            }

            if (nextStatus === "Approved") {
                const validationError = validatePayrollRun(targetRun);

                if (validationError) {
                    showNotification(validationError, "error");
                    refreshRuns();
                    return;
                }
            }

            const now = new Date().toISOString();
            const actor = getCurrentActor();

            const auditEntry = {
                action: nextStatus,
                actor,
                timestamp: now,
            };

            const updatedRun = {
                ...targetRun,
                status: nextStatus,
                updatedAt: now,
                ...(nextStatus === "Approved"
                    ? { approvedAt: now, approvedBy: actor }
                    : { lockedAt: now, lockedBy: actor }),
                auditTrail: [
                    ...(Array.isArray(targetRun.auditTrail) ? targetRun.auditTrail : []),
                    auditEntry,
                ],
            };

            const updatedRuns = latestRuns.map((item) =>
                String(item.id) === String(run.id) ? updatedRun : item
            );

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRuns));
            setRuns(updatedRuns);
            setSelectedRun(updatedRun);

            showNotification(
                nextStatus === "Approved"
                    ? "Payroll approved successfully."
                    : "Payroll locked successfully.",
                "success"
            );
        } catch (error) {
            console.error("Failed to update payroll status:", error);
            showNotification(
                "Could not update payroll status. Please try again.",
                "error"
            );
        }
    };


    useEffect(() => {
        const handleStorage = (event) => {
            if (!event.key || event.key === STORAGE_KEY) {
                refreshRuns();
            }
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const sortedRuns = useMemo(
        () => [...runs].sort((a, b) => String(b.period).localeCompare(String(a.period))),
        [runs]
    );

    const filteredRuns = useMemo(() => {
        const term = search.trim().toLowerCase();

        return sortedRuns.filter((run) => {
            const matchesSearch =
                !term ||
                String(run.periodLabel || getPeriodLabel(run.period))
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

    const exportRun = (run) => {
        const employees = getRunEmployees(run);

        if (!employees.length) {
            showNotification("This payroll run has no employee details to export.", "error");
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
            ...employees.map((employee) =>
                [
                    getEmployeeCode(employee),
                    getEmployeeName(employee),
                    employee.department || "—",
                    employee.basic,
                    employee.hra,
                    employee.otherAllowances,
                    employee.bonus,
                    employee.gross,
                    employee.pf,
                    employee.insurance,
                    employee.otherDeductions,
                    employee.totalDeductions,
                    employee.net,
                    employee.status || "Ready",
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
        link.download = `ignite-payroll-${run.period || "history"}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="payroll-history-page">
            <PageHeader
                eyebrow="ACCOUNT"
                title="Payroll History"
                description="Review saved payroll runs and inspect employee-wise salary calculations."
            />

            <PayrollWorkflowNav />

            <div className="payroll-history-notice">
                <CircleAlert size={18} />
                <div>
                    <strong>Browser demo data</strong>
                    <p>
                        Payroll runs and their status changes are stored in this browser
                        only; they are not submitted to a payroll backend.
                    </p>
                </div>
            </div>

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
                        <option value="locked">Locked</option>
                    </select>

                    <Button variant="secondary" onClick={refreshRuns}>
                        <RefreshCw size={16} />
                        Refresh
                    </Button>
                </div>

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
                                        {run.employeeCount ?? getRunEmployees(run).length}
                                    </td>
                                    <td>{money(getGross(run))}</td>
                                    <td>{money(getDeductions(run))}</td>
                                    <td className="payroll-history-net">{money(getNet(run))}</td>
                                    <td>{formatDateTime(run.updatedAt || run.createdAt)}</td>
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
                                                onClick={() => setSelectedRun(run)}
                                                aria-label={`View ${getPeriodLabel(run.period)}`}
                                                title="View details"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => exportRun(run)}
                                                aria-label={`Export ${getPeriodLabel(run.period)}`}
                                                title="Export CSV"
                                            >
                                                <FileText size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredRuns.length === 0 && (
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
                                    {selectedRun.employeeCount ??
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
                                    Created: {formatDateTime(selectedRun.createdAt)}
                                </span>
                                <span>
                                    Updated: {formatDateTime(selectedRun.updatedAt)}
                                </span>

                                {selectedRun.approvedAt && (
                                    <span>
                                        Approved by {selectedRun.approvedBy || "Unknown"} on{" "}
                                        {formatDateTime(selectedRun.approvedAt)}
                                    </span>
                                )}

                                {selectedRun.lockedAt && (
                                    <span>
                                        Locked by {selectedRun.lockedBy || "Unknown"} on{" "}
                                        {formatDateTime(selectedRun.lockedAt)}
                                    </span>
                                )}
                            </div>

                            {Array.isArray(selectedRun.auditTrail) &&
                                selectedRun.auditTrail.length > 0 && (
                                    <div className="payroll-history-audit">
                                        <h3>Activity history</h3>

                                        {selectedRun.auditTrail.map((entry, index) => (
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getRunEmployees(selectedRun).map((employee, index) => (
                                            <tr
                                                key={
                                                    employee.employeeId ||
                                                    employee.employee_id ||
                                                    `${getEmployeeCode(employee)}-${index}`
                                                }
                                            >
                                                <td>
                                                    <div className="payroll-history-employee">
                                                        <strong>{getEmployeeName(employee)}</strong>
                                                        <span>{getEmployeeCode(employee)}</span>
                                                    </div>
                                                </td>
                                                <td>{money(employee.basic)}</td>
                                                <td>{money(employee.gross)}</td>
                                                <td>{money(employee.totalDeductions)}</td>
                                                <td className="payroll-history-net">
                                                    {money(employee.net)}
                                                </td>
                                                <td>{employee.status || "Ready"}</td>
                                            </tr>
                                        ))}

                                        {getRunEmployees(selectedRun).length === 0 && (
                                            <tr>
                                                <td colSpan={6}>
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
                                onClick={() => exportRun(selectedRun)}
                            >
                                <FileText size={16} />
                                Export CSV
                            </Button>

                            {(selectedRun.status || "Draft") === "Draft" && (
                                <Button
                                    onClick={() => changeRunStatus(selectedRun, "Approved")}
                                >
                                    <FileText size={16} />
                                    Approve Payroll
                                </Button>
                            )}

                            {selectedRun.status === "Approved" && (
                                <Button
                                    onClick={() => changeRunStatus(selectedRun, "Locked")}
                                >
                                    <Wallet size={16} />
                                    Lock Payroll
                                </Button>
                            )}

                            {selectedRun.status === "Locked" && (
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
