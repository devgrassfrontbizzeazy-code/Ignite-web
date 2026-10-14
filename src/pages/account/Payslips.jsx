
import { useMemo, useState } from "react";
import {
    Banknote,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Download,
    Eye,
    FileText,
    IndianRupee,
    Search,
    Users,
    X,
} from "lucide-react";

import "./Payslips.css";

const INITIAL_PAYSLIPS = [
    {
        id: 1,
        employeeId: "EMP001",
        name: "Aarav Sharma",
        department: "Engineering",
        designation: "Software Engineer",
        basic: 30000,
        allowances: 8000,
        deductions: 2500,
        paidDays: 30,
        status: "Published",
    },
    {
        id: 2,
        employeeId: "EMP002",
        name: "Priya Verma",
        department: "Human Resources",
        designation: "HR Executive",
        basic: 25000,
        allowances: 6000,
        deductions: 1800,
        paidDays: 30,
        status: "Published",
    },
    {
        id: 3,
        employeeId: "EMP003",
        name: "Rohan Mehta",
        department: "Sales",
        designation: "Sales Executive",
        basic: 22000,
        allowances: 5000,
        deductions: 1500,
        paidDays: 28,
        status: "Pending",
    },
    {
        id: 4,
        employeeId: "EMP004",
        name: "Neha Gupta",
        department: "Design",
        designation: "UI/UX Designer",
        basic: 28000,
        allowances: 7000,
        deductions: 2200,
        paidDays: 30,
        status: "Draft",
    },
    {
        id: 5,
        employeeId: "EMP005",
        name: "Kabir Singh",
        department: "Engineering",
        designation: "Frontend Developer",
        basic: 32000,
        allowances: 9000,
        deductions: 2800,
        paidDays: 30,
        status: "Published",
    },
];

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);

const getNetSalary = (employee) =>
    employee.basic + employee.allowances - employee.deductions;

const getInitials = (name) =>
    name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

const Payslips = () => {
    const [payslips, setPayslips] = useState(INITIAL_PAYSLIPS);
    const [selectedMonth, setSelectedMonth] = useState("2026-09");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    const monthLabel = useMemo(() => {
        const [year, month] = selectedMonth.split("-");
        return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
            "en-IN",
            { month: "long", year: "numeric" }
        );
    }, [selectedMonth]);

    const filteredPayslips = useMemo(() => {
        const query = search.trim().toLowerCase();

        return payslips.filter((employee) => {
            const matchesSearch =
                employee.name.toLowerCase().includes(query) ||
                employee.employeeId.toLowerCase().includes(query) ||
                employee.department.toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === "All" || employee.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [payslips, search, statusFilter]);

    const stats = useMemo(() => {
        const published = payslips.filter(
            (employee) => employee.status === "Published"
        );

        return {
            employees: payslips.length,
            payroll: published.reduce(
                (total, employee) => total + getNetSalary(employee),
                0
            ),
            published: published.length,
            pending: payslips.filter(
                (employee) =>
                    employee.status === "Pending" || employee.status === "Draft"
            ).length,
        };
    }, [payslips]);

    const publishPayslip = (employeeId) => {
        setPayslips((current) =>
            current.map((employee) =>
                employee.employeeId === employeeId
                    ? { ...employee, status: "Published" }
                    : employee
            )
        );

        setSelectedPayslip((current) =>
            current?.employeeId === employeeId
                ? { ...current, status: "Published" }
                : current
        );
    };

    const downloadPayslip = () => {
        if (!selectedPayslip) return;

        const employee = selectedPayslip;
        const rows = [
            ["Payslip", monthLabel],
            ["Employee ID", employee.employeeId],
            ["Employee Name", employee.name],
            ["Department", employee.department],
            ["Designation", employee.designation],
            ["Paid Days", employee.paidDays],
            ["Basic Salary", employee.basic],
            ["Allowances", employee.allowances],
            ["Deductions", employee.deductions],
            ["Net Salary", getNetSalary(employee)],
            ["Status", employee.status],
        ];

        const csv = rows
            .map((row) =>
                row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
            )
            .join("\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `${employee.employeeId}-${selectedMonth}-payslip.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="payslips-page">
            <div className="payslips-heading">
                <div>
                    <div className="payslips-eyebrow">ACCOUNT MANAGEMENT</div>
                    <h1>Payslips</h1>
                    <p>Manage employee payroll records and monthly payslips.</p>
                </div>

                <label className="payslips-month-picker">
                    <CalendarDays size={18} />
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(event) => setSelectedMonth(event.target.value)}
                        aria-label="Select payroll month"
                    />
                </label>
            </div>

            <div className="payslips-stat-grid">
                <div className="payslips-stat-card">
                    <div className="payslips-stat-icon">
                        <IndianRupee size={20} />
                    </div>
                    <div className="payslips-stat-label">Published payroll</div>
                    <div className="payslips-stat-value">
                        {formatCurrency(stats.payroll)}
                    </div>
                    <div className="payslips-stat-note">{monthLabel}</div>
                </div>

                <div className="payslips-stat-card">
                    <div className="payslips-stat-icon">
                        <Users size={20} />
                    </div>
                    <div className="payslips-stat-label">Employees</div>
                    <div className="payslips-stat-value">{stats.employees}</div>
                    <div className="payslips-stat-note">Sample employee records</div>
                </div>

                <div className="payslips-stat-card">
                    <div className="payslips-stat-icon">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="payslips-stat-label">Published payslips</div>
                    <div className="payslips-stat-value">{stats.published}</div>
                    <div className="payslips-stat-note">Ready for employees</div>
                </div>

                <div className="payslips-stat-card">
                    <div className="payslips-stat-icon">
                        <Clock3 size={20} />
                    </div>
                    <div className="payslips-stat-label">Awaiting action</div>
                    <div className="payslips-stat-value">{stats.pending}</div>
                    <div className="payslips-stat-note">Draft or pending</div>
                </div>
            </div>

            <section className="payslips-table-card">
                <div className="payslips-table-heading">
                    <div>
                        <h2>Employee payslips</h2>
                        <p>{monthLabel} payroll records</p>
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

                    <select
                        className="payslips-status-filter"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        aria-label="Filter by payslip status"
                    >
                        <option value="All">All statuses</option>
                        <option value="Published">Published</option>
                        <option value="Pending">Pending</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>

                <div className="payslips-table-scroll">
                    <table className="payslips-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Department</th>
                                <th>Paid days</th>
                                <th>Net salary</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredPayslips.map((employee) => (
                                <tr key={employee.employeeId}>
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
                                    <td>
                                        <div className="payslips-department">
                                            {employee.department}
                                            <small>{employee.designation}</small>
                                        </div>
                                    </td>
                                    <td>{employee.paidDays}</td>
                                    <td className="payslips-salary">
                                        {formatCurrency(getNetSalary(employee))}
                                    </td>
                                    <td>
                                        <span
                                            className={`payslips-status payslips-status-${employee.status.toLowerCase()}`}
                                        >
                                            {employee.status}
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

                            {filteredPayslips.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="payslips-empty">
                                        No payslips match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="payslips-table-footer">
                    <span>Showing {filteredPayslips.length} of {payslips.length} records</span>
                    <span>Demo data · API integration pending</span>
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
                                <span className="payslips-eyebrow">PAYSLIP PREVIEW</span>
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
                                <span className="payslips-document-logo">
                                    <Banknote size={22} />
                                </span>
                                <div>
                                    <strong>IGNITE</strong>
                                    <small>Employee salary statement</small>
                                </div>
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
                                    <small>PAID DAYS</small>
                                    <strong>{selectedPayslip.paidDays}</strong>
                                </div>
                            </div>

                            <h3 className="payslips-breakdown-title">Earnings & deductions</h3>

                            <div className="payslips-breakdown-row">
                                <span>Basic salary</span>
                                <strong>{formatCurrency(selectedPayslip.basic)}</strong>
                            </div>
                            <div className="payslips-breakdown-row">
                                <span>Allowances</span>
                                <strong>{formatCurrency(selectedPayslip.allowances)}</strong>
                            </div>
                            <div className="payslips-breakdown-row payslips-deduction">
                                <span>Deductions</span>
                                <strong>− {formatCurrency(selectedPayslip.deductions)}</strong>
                            </div>
                            <div className="payslips-net-total">
                                <span>Net salary</span>
                                <strong>{formatCurrency(getNetSalary(selectedPayslip))}</strong>
                            </div>

                            <p className="payslips-demo-note">
                                Illustrative preview only. This is not an official salary slip.
                            </p>
                        </div>

                        <div className="payslips-modal-actions">
                            {selectedPayslip.status !== "Published" && (
                                <button
                                    type="button"
                                    className="payslips-primary-button"
                                    onClick={() => publishPayslip(selectedPayslip.employeeId)}
                                >
                                    <CheckCircle2 size={17} />
                                    Mark as published
                                </button>
                            )}

                            <button
                                type="button"
                                className="payslips-secondary-button"
                                onClick={downloadPayslip}
                            >
                                <Download size={17} />
                                Export CSV
                            </button>

                            <button
                                type="button"
                                className="payslips-secondary-button"
                                onClick={() => window.print()}
                            >
                                <FileText size={17} />
                                Print
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default Payslips;
