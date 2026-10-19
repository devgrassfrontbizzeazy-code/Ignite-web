
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    Banknote,
    Building2,
    CalendarDays,
    CheckCircle2,
    Download,
    Eye,
    FileText,
    IndianRupee,
    Search,
    Users,
    X,
} from "lucide-react";

import { getCompany } from "../../services/api/companyAPI";
import { useNotification } from "../../context/NotificationContext";
import {
    getPayslips,
    getPayslip,
    downloadPayslip,
    unwrapList,
    triggerBlobDownload,
} from "../../services/api/accountAPI";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";
import DatePicker from "../../components/common/DatePicker/DatePicker";
import PayrollWorkflowNav from "../../components/account/PayrollWorkflowNav";
import "./Payslips.css";

const getPeriodLabel = (period) => {
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
        return "Payroll period";
    }

    const [year, month] = period.split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
        "en-IN",
        { month: "long", year: "numeric" }
    );
};

const getEmployeeName = (employee) =>
    employee.employeeName ||
    employee.employee_name ||
    employee.name ||
    [employee.first_name, employee.middle_name, employee.last_name]
        .filter(Boolean)
        .join(" ") ||
    "Employee";

const getEmployeeCode = (employee) =>
    employee.employeeCode || employee.employee_code || employee.employeeId || employee.employee_id || "—";

const getGross = (employee) =>
    Number(
        employee.gross ??
        employee.gross_salary ??
        (
            Number(employee.basic || 0) +
            Number(employee.hra || 0) +
            Number(employee.otherAllowances ?? employee.other_allowances ?? 0) +
            Number(employee.bonus || 0)
        )
    );

const getDeductions = (employee) =>
    Number(
        employee.totalDeductions ?? employee.total_deductions ??
        (
            Number(employee.pf || 0) +
            Number(employee.insurance || 0) +
            Number(employee.otherDeductions ?? employee.other_deductions ?? 0)
        )
    );

const getNetSalary = (employee) =>
    Number(
        employee.net ??
        employee.net_salary ??
        employee.net_pay ??
        getGross(employee) - getDeductions(employee)
    );

const getInitials = (name) =>
    String(name || "Employee")
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

const getCurrencyCode = (currency) => {
    const match = String(currency || "").match(/\b([A-Z]{3})\b/);
    return match?.[1] || "INR";
};

const formatCurrency = (amount, currency = "INR") => {
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(Number(amount || 0));
    } catch {
        return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
    }
};

const formatAddress = (company) =>
    company?.full_address ||
    [
        company?.city,
        company?.state,
        company?.pincode,
        company?.country,
    ]
        .filter(Boolean)
        .join(", ");

const Payslips = () => {
    const { showNotification } = useNotification();
    const notify = (type, message) => showNotification({ type, message });

    const [company, setCompany] = useState(null);
    const [companyError, setCompanyError] = useState(false);
    const [payslipData, setPayslipData] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [search, setSearch] = useState("");
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [viewingPayslipId, setViewingPayslipId] = useState(null);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let mounted = true;

        const loadCompany = async () => {
            try {
                const response = await getCompany();
                const companyDetails = response?.data;

                if (!companyDetails || !companyDetails.name) {
                    throw new Error("Company details are missing from the API response.");
                }

                if (mounted) {
                    setCompany(companyDetails);
                    setCompanyError(false);
                }
            } catch (error) {
                console.error("Failed to load company details:", error);
                if (mounted) {
                    setCompanyError(true);
                }
            }
        };

        const loadPayslipData = async () => {
            setLoading(true);
            setLoadError("");
            try {
                const response = await getPayslips();
                if (mounted) setPayslipData(unwrapList(response));
            } catch (error) {
                console.error("Failed to load payslip data:", error);
                if (mounted) {
                    setPayslipData([]);
                    setLoadError(
                        error?.response?.data?.detail ||
                        error?.response?.data?.message ||
                        "Could not load payslips from the server."
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadCompany();
        loadPayslipData();

        return () => {
            mounted = false;
        };
    }, []);

    const availablePeriods = useMemo(
        () =>
            [...new Set(
                payslipData
                    .map((slip) => slip.period ?? slip.payroll_period)
                    .filter(Boolean)
            )].sort((a, b) => String(b).localeCompare(String(a))),
        [payslipData]
    );

    const activeMonth = availablePeriods.includes(selectedMonth)
        ? selectedMonth
        : availablePeriods[0] || "";

    const currency = getCurrencyCode(company?.currency);

    const selectedRun = useMemo(
        () => {
            const slips = payslipData.filter(
                (slip) => String(slip.period ?? slip.payroll_period) === String(activeMonth)
            );
            return slips.length
                ? {
                    period: activeMonth,
                    status: slips[0].payroll_status ?? slips[0].status ?? "—",
                    payslips: slips,
                }
                : null;
        },
        [payslipData, activeMonth]
    );

    const monthLabel = getPeriodLabel(activeMonth);

    const payslips = useMemo(() => {
        if (!selectedRun || !Array.isArray(selectedRun.payslips)) return [];

        return selectedRun.payslips
            .map((slip, index) => {
                const employee =
                    slip.employee && typeof slip.employee === "object"
                        ? slip.employee
                        : slip;
                return {
                    ...slip,
                    _rowId: String(slip.id ?? slip.payslip_id ?? `${selectedRun.period}-${index}`),
                    _payslipId: slip.id ?? slip.payslip_id,
                    employeeId: getEmployeeCode({ ...employee, ...slip }),
                    name: getEmployeeName({ ...employee, ...slip }),
                    department: slip.department ?? slip.department_name ?? employee.department_name ?? "—",
                    basic: Number(slip.basic || 0),
                    hra: Number(slip.hra || 0),
                    otherAllowances: Number(slip.other_allowances ?? slip.otherAllowances ?? 0),
                    bonus: Number(slip.bonus || 0),
                    pf: Number(slip.pf || 0),
                    insurance: Number(slip.insurance || 0),
                    otherDeductions: Number(slip.other_deductions ?? slip.otherDeductions ?? 0),
                    gross: getGross(slip),
                    deductions: getDeductions(slip),
                    net: getNetSalary(slip),
                    payrollStatus: slip.payroll_status ?? slip.status ?? selectedRun.status,
                    period: slip.period ?? slip.payroll_period ?? selectedRun.period,
                };
            });
    }, [selectedRun]);

    const filteredPayslips = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return payslips;

        return payslips.filter((employee) =>
            [
                employee.name,
                employee.employeeId,
                employee.department,
            ].some((value) =>
                String(value || "").toLowerCase().includes(query)
            )
        );
    }, [payslips, search]);

    const stats = useMemo(
        () => ({
            employees: payslips.length,
            payroll: payslips.reduce((sum, employee) => sum + employee.net, 0),
            gross: payslips.reduce((sum, employee) => sum + employee.gross, 0),
            deductions: payslips.reduce(
                (sum, employee) => sum + employee.deductions,
                0
            ),
        }),
        [payslips]
    );

    const handleDownloadPayslip = async (employee) => {
        const payslipId = employee._payslipId;
        if (!payslipId) {
            notify("error", "This payslip does not include a backend ID for PDF download.");
            return;
        }

        setDownloading(true);
        try {
            const blob = await downloadPayslip(payslipId);
            triggerBlobDownload(
                blob,
                `${employee.employeeId}-${employee.period}-payslip.pdf`
            );
            notify("success", "Payslip PDF downloaded.");
        } catch (error) {
            console.error("Failed to download payslip PDF:", error);
            notify(
                "error",
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Unable to download the payslip PDF."
            );
        } finally {
            setDownloading(false);
        }
    };

    const viewPayslip = async (employee) => {
        if (!employee._payslipId) {
            notify("error", "This payslip does not include a backend ID for details.");
            return;
        }
        setViewingPayslipId(employee._payslipId);
        try {
            const response = await getPayslip(employee._payslipId);
            const detail = response?.payslip ?? response?.data ?? response;
            setSelectedPayslip({
                ...employee,
                ...detail,
                employeeId: getEmployeeCode({ ...employee, ...detail }),
                name: getEmployeeName({ ...employee, ...detail }),
                department:
                    detail.department ??
                    detail.department_name ??
                    employee.department,
                otherAllowances:
                    detail.other_allowances ?? detail.otherAllowances ?? employee.otherAllowances,
                otherDeductions:
                    detail.other_deductions ?? detail.otherDeductions ?? employee.otherDeductions,
                deductions: getDeductions(detail),
                gross: getGross(detail),
                net: getNetSalary(detail),
                _payslipId: employee._payslipId,
                period: detail.period ?? detail.payroll_period ?? employee.period,
            });
        } catch (error) {
            console.error("Failed to load payslip details:", error);
            notify(
                "error",
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Unable to load payslip details."
            );
        } finally {
            setViewingPayslipId(null);
        }
    };

    const exportPayslipCsv = (employee) => {
        const target = employee || selectedPayslip;
        if (!target) return;

        const rows = [
            [company?.name || "Company", ""],
            ["Payslip period", getPeriodLabel(target.period)],
            ["Payroll status", target.payrollStatus],
            ["Employee name", target.name],
            ["Employee ID", target.employeeId],
            ["Department", target.department],
            ["", ""],
            ["Earnings", "Amount"],
            ["Basic salary", target.basic],
            ["HRA", target.hra],
            ["Other allowances", target.otherAllowances],
            ["Bonus", target.bonus],
            ["Gross salary", target.gross],
            ["", ""],
            ["Deductions", "Amount"],
            ["PF", target.pf],
            ["Insurance", target.insurance],
            ["Other deductions", target.otherDeductions],
            ["Total deductions", target.deductions],
            ["Net salary payable", target.net],
        ];

        const csv = rows
            .map((row) =>
                row
                    .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `${target.employeeId}-${target.period}-payslip.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="payslips-page">
            <PageHeader
                eyebrow="ACCOUNT"
                title="Payslips"
                description="View and print payslips from approved payroll runs."
                action={
                    <div className="payslips-header-actions">
                        <DatePicker
                            mode="month"
                            value={activeMonth}
                            onChange={(val) => {
                                setSelectedMonth(val);
                                setSelectedPayslip(null);
                            }}
                            placeholder="Select payroll month"
                            className="payslips-header-datepicker"
                        />
                    </div>
                }
            />

            <PayrollWorkflowNav />

            {companyError && (
                <div className="payslips-notice payslips-notice-warning">
                    <AlertCircle size={18} />
                    Company details could not be loaded. Payslips can still be
                    previewed, but company information may be incomplete.
                </div>
            )}
            {loadError && (
                <div className="payslips-notice payslips-notice-warning" role="alert">
                    <AlertCircle size={18} />
                    {loadError}
                </div>
            )}

            {loading && (
                <div className="payslips-notice">
                    <AlertCircle size={18} />
                    Loading payslip data...
                </div>
            )}

            <div className="payslips-stat-grid">
                <div className="payslips-stat-card">
                    <div className="payslips-stat-icon">
                        <IndianRupee size={20} />
                    </div>
                    <div className="payslips-stat-label">Net payroll</div>
                    <div className="payslips-stat-value">
                        {formatCurrency(stats.payroll, currency)}
                    </div>
                    <div className="payslips-stat-note">{monthLabel}</div>
                </div>

                <div className="payslips-stat-card">
                    <div className="payslips-stat-icon">
                        <Users size={20} />
                    </div>
                    <div className="payslips-stat-label">Eligible employees</div>
                    <div className="payslips-stat-value">{stats.employees}</div>
                    <div className="payslips-stat-note">
                        From the selected payroll run
                    </div>
                </div>

                <div className="payslips-stat-card">
                    <div className="payslips-stat-icon">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="payslips-stat-label">Payroll status</div>
                    <div className="payslips-stat-value payslips-stat-value-status">
                        {selectedRun?.status || "Unavailable"}
                    </div>
                    <div className="payslips-stat-note">
                        Backend payslip status
                    </div>
                </div>

                <div className="payslips-stat-card">
                    <div className="payslips-stat-icon">
                        <Banknote size={20} />
                    </div>
                    <div className="payslips-stat-label">Total deductions</div>
                    <div className="payslips-stat-value">
                        {formatCurrency(stats.deductions, currency)}
                    </div>
                    <div className="payslips-stat-note">
                        All eligible employees
                    </div>
                </div>
            </div>

            <section className="payslips-table-card">
                <div className="payslips-table-heading">
                    <div>
                        <h2>Employee payslips</h2>
                        <p>{monthLabel} · Approved payroll records</p>
                    </div>
                    <span className="payslips-record-count">
                        {filteredPayslips.length} records
                    </span>
                </div>

                <div className="payslips-toolbar">
                    <label className="payslips-search">
                        <Search size={18} />
                        <input
                            type="search"
                            placeholder="Search employee, ID or department"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>
                </div>

                {!selectedRun ? (
                    <div className="payslips-empty-state">
                        <FileText size={32} />
                        <h3>No payslips for this month</h3>
                        <p>
                            Payslips appear here when the backend makes them available.
                        </p>
                        <Link
                            className="payslips-empty-state__link"
                            to="/account/payroll-history"
                        >
                            Go to Payroll History
                        </Link>
                    </div>
                ) : (
                    <div className="payslips-table-scroll">
                        <table className="payslips-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Gross salary</th>
                                    <th>Deductions</th>
                                    <th>Net salary</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayslips.map((employee) => (
                                    <tr key={employee._rowId}>
                                        <td>
                                            <div className="payslips-employee">
                                                <span className="payslips-avatar">
                                                    {getInitials(employee.name)}
                                                </span>
                                                <span>
                                                    <strong>{employee.name}</strong>
                                                    <small>{employee.employeeId}</small>
                                                </span>
                                            </div>
                                        </td>
                                        <td>{employee.department}</td>
                                        <td>
                                            {formatCurrency(employee.gross, currency)}
                                        </td>
                                        <td>
                                            {formatCurrency(employee.deductions, currency)}
                                        </td>
                                        <td className="payslips-salary">
                                            {formatCurrency(employee.net, currency)}
                                        </td>
                                        <td>
                                            <span
                                                className={`payslips-status payslips-status-${String(employee.payrollStatus).toLowerCase()}`}
                                            >
                                                <span className="badge-dot" />
                                                {employee.payrollStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="payslips-row-actions">
                                                <button
                                                    type="button"
                                                    className="payslips-action-btn payslips-action-btn--view"
                                                    onClick={() => viewPayslip(employee)}
                                                    disabled={viewingPayslipId === employee._payslipId}
                                                    title="View payslip details"
                                                    aria-label={`View payslip for ${employee.name}`}
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="payslips-action-btn payslips-action-btn--download"
                                                    onClick={() => handleDownloadPayslip(employee)}
                                                    disabled={downloading}
                                                    title="Download PDF"
                                                    aria-label={`Download payslip PDF for ${employee.name}`}
                                                >
                                                    <Download size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!filteredPayslips.length && (
                                    <tr>
                                        <td colSpan="7" className="payslips-empty">
                                            {payslips.length ? "No employee records match your search." : "There are no payslips for this month."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="payslips-table-footer">
                    <span>
                        Showing {filteredPayslips.length} of {payslips.length} records
                    </span>
                    <span>
                        {selectedRun
                            ? `Payroll ${selectedRun.status}`
                            : "No payslips"}
                    </span>
                </div>
            </section>


            {selectedPayslip && (
                <div
                    className="payslips-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedPayslip(null);
                        }
                    }}
                >
                    <section
                        className="payslips-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payslip-modal-title"
                    >
                        <div className="payslips-modal-header">
                            <div>
                                <span className="payslips-eyebrow">
                                    OFFICIAL PAYSLIP PREVIEW
                                </span>
                                <h2 id="payslip-modal-title">
                                    {getPeriodLabel(selectedPayslip.period)}
                                </h2>
                            </div>
                            <button
                                type="button"
                                className="payslips-close-button"
                                onClick={() => setSelectedPayslip(null)}
                                aria-label="Close payslip preview"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="payslips-document payslips-template">
                            {/* Company identity comes from the company-level API */}
                            <header className="payslip-template-header">
                                <div className="payslip-template-brand">
                                    {company?.logo_url && (
                                        <img
                                            className="payslip-template-logo"
                                            src={company.logo_url}
                                            alt={`${company.name || "Company"} logo`}
                                            onError={(event) => {
                                                event.currentTarget.style.display = "none";
                                            }}
                                        />
                                    )}
                                    <div>
                                        <h1>
                                            {company?.name || "Company details unavailable"}
                                        </h1>
                                        {formatAddress(company) && (
                                            <p>{formatAddress(company)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="payslip-template-title">
                                    <h2>Salary Slip</h2>
                                    <p>{getPeriodLabel(selectedPayslip.period)}</p>
                                    <small>
                                        Payslip No.: {selectedPayslip.payslip_number || "—"}
                                    </small>
                                </div>
                            </header>

                            {/* Employee and bank details */}
                            <section className="payslip-template-section">
                                <h3>Employee Details</h3>
                                <div className="payslip-template-info-grid">
                                    <div>
                                        <span>Employee ID</span>
                                        <strong>
                                            {selectedPayslip.employee_code ||
                                                selectedPayslip.employeeId ||
                                                selectedPayslip.employee_id ||
                                                "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Bank A/C No.</span>
                                        <strong>
                                            {selectedPayslip.bank_account_number ||
                                                selectedPayslip.account_number ||
                                                selectedPayslip.bank_account ||
                                                "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Employee Name</span>
                                        <strong>
                                            {selectedPayslip.employee_name ||
                                                selectedPayslip.name ||
                                                "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>IFSC Code</span>
                                        <strong>
                                            {selectedPayslip.ifsc_code ||
                                                selectedPayslip.ifsc ||
                                                "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Designation</span>
                                        <strong>
                                            {selectedPayslip.designation || "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Bank Name</span>
                                        <strong>
                                            {selectedPayslip.bank_name || "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Department</span>
                                        <strong>
                                            {selectedPayslip.department || "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>UAN No.</span>
                                        <strong>
                                            {selectedPayslip.uan_number ||
                                                selectedPayslip.uan ||
                                                "—"}
                                        </strong>
                                    </div>
                                </div>
                            </section>

                            {/* Attendance information */}
                            <section className="payslip-template-section">
                                <h3>Attendance Summary</h3>
                                <div className="payslip-template-info-grid">
                                    <div>
                                        <span>Total Working Days</span>
                                        <strong>
                                            {selectedPayslip.total_working_days ??
                                                selectedPayslip.totalWorkingDays ??
                                                "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Absent Days</span>
                                        <strong>
                                            {selectedPayslip.absent_days ??
                                                selectedPayslip.absentDays ??
                                                "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Paid Leave</span>
                                        <strong>
                                            {selectedPayslip.paid_leave ??
                                                selectedPayslip.paidLeave ??
                                                "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Present Days</span>
                                        <strong>
                                            {selectedPayslip.present_days ??
                                                selectedPayslip.presentDays ??
                                                "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>LWOP Days</span>
                                        <strong>
                                            {selectedPayslip.lwop_days ??
                                                selectedPayslip.lwopDays ??
                                                "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>One Day Salary</span>
                                        <strong>
                                            {selectedPayslip.one_day_salary != null ||
                                                selectedPayslip.oneDaySalary != null
                                                ? formatCurrency(
                                                    selectedPayslip.one_day_salary ??
                                                    selectedPayslip.oneDaySalary,
                                                    currency
                                                )
                                                : "—"}
                                        </strong>
                                    </div>
                                </div>
                            </section>

                            {/* Earnings and deductions */}
                            <div className="payslip-template-breakdown">
                                <section className="payslip-template-section">
                                    <h3>Additions</h3>
                                    <table className="payslip-template-table">
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                ["Basic Salary", selectedPayslip.basic ?? selectedPayslip.basic_salary],
                                                ["HRA", selectedPayslip.hra],
                                                [
                                                    "Software Allowance",
                                                    selectedPayslip.software_allowance ??
                                                    selectedPayslip.softwareAllowance,
                                                ],
                                                [
                                                    "Conveyance/Other Allowance",
                                                    selectedPayslip.other_allowances ??
                                                    selectedPayslip.otherAllowances,
                                                ],
                                                [
                                                    "Incentive",
                                                    selectedPayslip.incentive ??
                                                    selectedPayslip.bonus,
                                                ],
                                            ]
                                                .filter(([, value]) => value != null && value !== "")
                                                .map(([label, value]) => (
                                                    <tr key={label}>
                                                        <td>{label}</td>
                                                        <td>{formatCurrency(value, currency)}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th>Total Additions</th>
                                                <th>
                                                    {formatCurrency(
                                                        selectedPayslip.total_additions ??
                                                        selectedPayslip.totalAdditions ??
                                                        selectedPayslip.gross_salary ??
                                                        selectedPayslip.gross,
                                                        currency
                                                    )}
                                                </th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </section>

                                <section className="payslip-template-section">
                                    <h3>Deductions</h3>
                                    <table className="payslip-template-table">
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                [
                                                    "Provident Fund",
                                                    selectedPayslip.pf ??
                                                    selectedPayslip.provident_fund,
                                                ],
                                                [
                                                    "Leave Deduction",
                                                    selectedPayslip.leave_deduction ??
                                                    selectedPayslip.leaveDeduction,
                                                ],
                                                [
                                                    "Professional Tax",
                                                    selectedPayslip.professional_tax ??
                                                    selectedPayslip.professionalTax,
                                                ],
                                                [
                                                    "Other Deduction",
                                                    selectedPayslip.other_deductions ??
                                                    selectedPayslip.otherDeductions,
                                                ],
                                            ]
                                                .filter(([, value]) => value != null && value !== "")
                                                .map(([label, value]) => (
                                                    <tr key={label}>
                                                        <td>{label}</td>
                                                        <td>{formatCurrency(value, currency)}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th>Total Deductions</th>
                                                <th>
                                                    {formatCurrency(
                                                        selectedPayslip.total_deductions ??
                                                        selectedPayslip.totalDeductions ??
                                                        selectedPayslip.deductions,
                                                        currency
                                                    )}
                                                </th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </section>
                            </div>

                            {/* Net salary */}
                            <section className="payslip-template-net">
                                <span>Net Salary</span>
                                <strong>
                                    {formatCurrency(
                                        selectedPayslip.net_salary ??
                                        selectedPayslip.net ??
                                        selectedPayslip.net_pay,
                                        currency
                                    )}
                                </strong>
                            </section>

                            {/* Company footer and HR signature */}
                            <footer className="payslip-template-footer">
                                <div>
                                    <strong>
                                        {company?.name || "Company details unavailable"}
                                    </strong>
                                    <span>Company Address</span>
                                    <p>{formatAddress(company) || "—"}</p>
                                </div>
                                <div className="payslip-template-signature">
                                    <div />
                                    <span>HR Signature</span>
                                </div>
                            </footer>

                            {selectedPayslip.generated_at && (
                                <div className="payslip-template-generated">
                                    Generated on{" "}
                                    {new Date(
                                        selectedPayslip.generated_at
                                    ).toLocaleDateString("en-IN")}
                                </div>
                            )}
                        </div>

                        <div className="payslips-modal-actions">
                            <Button
                                variant="secondary"
                                onClick={() => exportPayslipCsv(selectedPayslip)}
                            >
                                <Download size={16} />
                                Export CSV
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleDownloadPayslip(selectedPayslip)}
                                disabled={downloading}
                            >
                                <Download size={16} />
                                {downloading ? "Downloading..." : "Download PDF"}
                            </Button>
                            <Button onClick={() => window.print()}>
                                <FileText size={16} />
                                Print / Save as PDF
                            </Button>
                        </div>
                    </section>
                </div>
            )}

        </div>
    );
};

export default Payslips;
