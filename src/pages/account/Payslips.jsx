
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
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";
import PayrollWorkflowNav from "../../components/account/PayrollWorkflowNav";
import "./Payslips.css";

const STORAGE_KEY = "ignite_payroll_runs";

const readPayrollRuns = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
};

const isReleasedRun = (run) =>
    ["approved", "locked"].includes(
        String(run?.status || "").toLowerCase()
    );

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
    employee.name ||
    [employee.first_name, employee.middle_name, employee.last_name]
        .filter(Boolean)
        .join(" ") ||
    "Employee";

const getEmployeeCode = (employee) =>
    employee.employeeCode || employee.employeeId || "—";

const getGross = (employee) =>
    Number(
        employee.gross ??
        (
            Number(employee.basic || 0) +
            Number(employee.hra || 0) +
            Number(employee.otherAllowances || 0) +
            Number(employee.bonus || 0)
        )
    );

const getDeductions = (employee) =>
    Number(
        employee.totalDeductions ??
        (
            Number(employee.pf || 0) +
            Number(employee.insurance || 0) +
            Number(employee.otherDeductions || 0)
        )
    );

const getNetSalary = (employee) =>
    Number(employee.net ?? getGross(employee) - getDeductions(employee));

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
    const [company, setCompany] = useState(null);
    const [companyError, setCompanyError] = useState(false);
    const [runs, setRuns] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [search, setSearch] = useState("");
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    useEffect(() => {
        let mounted = true;


        const loadCompany = async () => {
            try {
                const response = await getCompany();

                // API response contains company details inside "data"
                const companyDetails = response?.data;

                console.log("Company details:", companyDetails);

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


        const loadRuns = () => {
            const storedRuns = readPayrollRuns();

            if (!mounted) return;

            setRuns(storedRuns);

            setSelectedMonth((currentMonth) => {
                if (currentMonth) return currentMonth;

                const availableRuns = storedRuns
                    .filter(isReleasedRun)
                    .sort((a, b) =>
                        String(b.period || "").localeCompare(
                            String(a.period || "")
                        )
                    );

                return availableRuns[0]?.period ||
                    new Date().toISOString().slice(0, 7);
            });
        };

        loadCompany();
        loadRuns();

        const handleStorage = (event) => {
            if (!event.key || event.key === STORAGE_KEY) loadRuns();
        };

        window.addEventListener("storage", handleStorage);

        return () => {
            mounted = false;
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    const currency = getCurrencyCode(company?.currency);

    const availableRuns = useMemo(
        () =>
            runs
                .filter(isReleasedRun)
                .sort((a, b) =>
                    String(b.period || "").localeCompare(
                        String(a.period || "")
                    )
                ),
        [runs]
    );

    const selectedRun = useMemo(
        () =>
            availableRuns.find(
                (run) => String(run.period) === String(selectedMonth)
            ) || null,
        [availableRuns, selectedMonth]
    );

    const monthLabel = getPeriodLabel(selectedMonth);

    const payslips = useMemo(() => {
        if (!selectedRun || !Array.isArray(selectedRun.employees)) return [];

        return selectedRun.employees
            .filter((employee) => employee.status === "Ready")
            .map((employee, index) => ({
                ...employee,
                _rowId: `${selectedRun.id || selectedRun.period}-${getEmployeeCode(employee)}-${index}`,
                employeeId: getEmployeeCode(employee),
                name: getEmployeeName(employee),
                department: employee.department || employee.departmentName || "—",
                basic: Number(employee.basic || 0),
                hra: Number(employee.hra || 0),
                otherAllowances: Number(employee.otherAllowances || 0),
                bonus: Number(employee.bonus || 0),
                pf: Number(employee.pf || 0),
                insurance: Number(employee.insurance || 0),
                otherDeductions: Number(employee.otherDeductions || 0),
                gross: getGross(employee),
                deductions: getDeductions(employee),
                net: getNetSalary(employee),
                payrollStatus: selectedRun.status,
                period: selectedRun.period,
            }));
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

    const exportPayslipCsv = () => {
        if (!selectedPayslip) return;

        const employee = selectedPayslip;
        const rows = [
            [company?.name || "Company", ""],
            ["Payslip period", getPeriodLabel(employee.period)],
            ["Payroll status", employee.payrollStatus],
            ["Employee name", employee.name],
            ["Employee ID", employee.employeeId],
            ["Department", employee.department],
            ["", ""],
            ["Earnings", "Amount"],
            ["Basic salary", employee.basic],
            ["HRA", employee.hra],
            ["Other allowances", employee.otherAllowances],
            ["Bonus", employee.bonus],
            ["Gross salary", employee.gross],
            ["", ""],
            ["Deductions", "Amount"],
            ["PF", employee.pf],
            ["Insurance", employee.insurance],
            ["Other deductions", employee.otherDeductions],
            ["Total deductions", employee.deductions],
            ["Net salary payable", employee.net],
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
        link.download = `${employee.employeeId}-${employee.period}-payslip.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="payslips-page">
            <PageHeader
                eyebrow="ACCOUNT · PAYROLL"
                title="Payslips"
                description="View and print payslips from approved payroll runs."
                action={
                    <label className="payslips-month-picker">
                        <CalendarDays size={16} />
                        <select
                            value={selectedMonth}
                            onChange={(event) => {
                                setSelectedMonth(event.target.value);
                                setSelectedPayslip(null);
                            }}
                            aria-label="Select payroll month"
                        >
                            {!availableRuns.length && (
                                <option value={selectedMonth}>
                                    {monthLabel}
                                </option>
                            )}
                            {availableRuns.map((run) => (
                                <option key={run.id || run.period} value={run.period}>
                                    {getPeriodLabel(run.period)}
                                </option>
                            ))}
                        </select>
                    </label>
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
                        Only approved or locked runs are shown
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
                        <h3>No approved payroll for this month</h3>
                        <p>
                            Save a payroll draft, then approve it in Payroll
                            History. Approved and locked runs will appear here.
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
                                                {employee.payrollStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="payslips-view-button"
                                                onClick={() => setSelectedPayslip(employee)}
                                            >
                                                <Eye size={16} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!filteredPayslips.length && (
                                    <tr>
                                        <td colSpan="7" className="payslips-empty">
                                            No employee records match your search.
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
                            : "No approved payroll"}
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
                                <h2 id="payslip-modal-title">{monthLabel}</h2>
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

                        <div className="payslips-document">
                            <div className="payslips-document-brand">
                                <div className="payslips-company-logo">
                                    {company?.logo_url ? (
                                        <img
                                            src={company.logo_url}
                                            alt={`${company.name || "Company"} logo`}
                                            onError={(event) => {
                                                event.currentTarget.style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <Building2 size={30} />
                                    )}
                                </div>
                                <div className="payslips-company-details">
                                    <strong>
                                        {company?.name || "Company name not configured"}
                                    </strong>
                                    {formatAddress(company) && (
                                        <small>{formatAddress(company)}</small>
                                    )}
                                    {(company?.company_email || company?.phone) && (
                                        <small>
                                            {[company.company_email, company.phone]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </small>
                                    )}
                                    {company?.website && (
                                        <small>{company.website}</small>
                                    )}
                                </div>
                            </div>

                            <div className="payslips-document-title">
                                <h3>Salary Slip</h3>
                                <span>{getPeriodLabel(selectedPayslip.period)}</span>
                            </div>

                            <div className="payslips-document-employee">
                                <div>
                                    <small>EMPLOYEE NAME</small>
                                    <strong>{selectedPayslip.name}</strong>
                                </div>
                                <div>
                                    <small>EMPLOYEE ID</small>
                                    <strong>{selectedPayslip.employeeId}</strong>
                                </div>
                                <div>
                                    <small>DEPARTMENT</small>
                                    <strong>{selectedPayslip.department}</strong>
                                </div>
                                <div>
                                    <small>PAYROLL STATUS</small>
                                    <strong>{selectedPayslip.payrollStatus}</strong>
                                </div>
                            </div>

                            <h3 className="payslips-breakdown-title">Earnings</h3>
                            {[
                                ["Basic salary", selectedPayslip.basic],
                                ["House rent allowance (HRA)", selectedPayslip.hra],
                                ["Other allowances", selectedPayslip.otherAllowances],
                                ["Bonus", selectedPayslip.bonus],
                            ].map(([label, amount]) => (
                                <div className="payslips-breakdown-row" key={label}>
                                    <span>{label}</span>
                                    <strong>{formatCurrency(amount, currency)}</strong>
                                </div>
                            ))}
                            <div className="payslips-breakdown-row payslips-total-row">
                                <span>Gross salary</span>
                                <strong>
                                    {formatCurrency(selectedPayslip.gross, currency)}
                                </strong>
                            </div>

                            <h3 className="payslips-breakdown-title">Deductions</h3>
                            {[
                                ["Provident fund (PF)", selectedPayslip.pf],
                                ["Insurance", selectedPayslip.insurance],
                                ["Other deductions", selectedPayslip.otherDeductions],
                            ].map(([label, amount]) => (
                                <div
                                    className="payslips-breakdown-row payslips-deduction"
                                    key={label}
                                >
                                    <span>{label}</span>
                                    <strong>{formatCurrency(amount, currency)}</strong>
                                </div>
                            ))}
                            <div className="payslips-breakdown-row payslips-total-row">
                                <span>Total deductions</span>
                                <strong>
                                    {formatCurrency(selectedPayslip.deductions, currency)}
                                </strong>
                            </div>

                            <div className="payslips-net-total">
                                <span>Net salary payable</span>
                                <strong>
                                    {formatCurrency(selectedPayslip.net, currency)}
                                </strong>
                            </div>

                            <p className="payslips-demo-note">
                                This payslip is generated from the selected payroll
                                run. Please verify company and payroll details before
                                distribution.
                            </p>
                        </div>

                        <div className="payslips-modal-actions">
                            <Button
                                variant="secondary"
                                onClick={exportPayslipCsv}
                            >
                                <Download size={16} />
                                Export CSV
                            </Button>
                            <Button
                                onClick={() => window.print()}
                            >
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
