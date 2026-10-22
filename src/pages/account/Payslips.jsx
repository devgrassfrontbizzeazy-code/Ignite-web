
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    Banknote,
    Building2,
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
    getPayrollDrafts,
    getPayrollDraft,
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
    if (!period) return "Payroll period";
    const match = String(period).match(/^(\d{4})-(\d{2})/);
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) return String(period);
    return new Date(Number(match[1]), Number(match[2]) - 1, 1).toLocaleDateString(
        "en-IN",
        { month: "long", year: "numeric" }
    );
};

const flattenPayslip = (response) => {
    const layers = [];
    const visited = new Set();
    const nestedKeys = [
        "payslip",
        "data",
        "employee",
        "employee_snapshot",
        "employeeSnapshot",
        "employee_details",
        "employeeDetails",
        "employee_profile",
        "employeeProfile",
        "bank_details",
        "bankDetails",
        "bank",
        "salary_details",
        "salaryDetails",
        "attendance_summary",
        "attendanceSummary",
        "attendance",
        "attendance_details",
        "attendanceDetails",
        "payroll_record",
        "payrollRecord",
        "company",
    ];

    const visit = (value) => {
        if (!value || typeof value !== "object" || Array.isArray(value) || visited.has(value)) {
            return;
        }
        visited.add(value);
        nestedKeys.forEach((key) => visit(value[key]));
        layers.push(value);
    };

    visit(response);
    return Object.assign({}, ...layers);
};

const firstValue = (...values) =>
    values.find((value) => value !== undefined && value !== null && value !== "");

const toNumber = (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string" || !value.trim()) return null;
    const normalized = value.trim().replace(/,/g, "").replace(/^[^\d.-]+/, "");
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
};

const getNumber = (record, keys) => {
    let zeroValue = null;
    for (const key of keys) {
        const value = toNumber(record?.[key]);
        if (value === null) continue;
        if (value !== 0) return value;
        zeroValue = value;
    }
    return zeroValue;
};

const getEmployeeName = (employee) =>
    firstValue(
        employee.employee_name,
        employee.employeeName,
        employee.name,
        employee.full_name,
        employee.fullName,
        employee.employee?.full_name,
        employee.employee_snapshot?.full_name,
        employee.employeeSnapshot?.full_name
    ) ||
    [employee.first_name, employee.middle_name, employee.last_name]
        .filter(Boolean)
        .join(" ") ||
    "Employee";

const getEmployeeCode = (employee) =>
    firstValue(
        employee.employee_code,
        employee.employeeCode,
        employee.employee_id,
        employee.employeeId,
        employee.employee_snapshot?.employee_code,
        employee.employee_snapshot?.employee_id,
        employee.employeeSnapshot?.employee_code,
        employee.employeeSnapshot?.employee_id
    ) || "—";

const toComponentList = (value) => {
    if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object");
    if (value && typeof value === "object") {
        const nested = firstValue(value.items, value.components, value.breakdown, value.results);
        if (nested) return toComponentList(nested);
        return Object.entries(value).map(([name, item]) =>
            item && typeof item === "object"
                ? { name, ...item }
                : { name, amount: item }
        );
    }
    return [];
};

const componentAmount = (component) =>
    getNumber(component, [
        "amount",
        "value",
        "calculated_amount",
        "calculatedAmount",
        "calculated_value",
        "computed_amount",
        "earning_amount",
        "deduction_amount",
        "salary_amount",
        "total",
        "payable_amount",
        "payableAmount",
    ]);

const componentLabel = (component) =>
    firstValue(
        component.component_name,
        component.componentName,
        component.salary_component_name,
        component.earning_name,
        component.deduction_name,
        typeof component.component === "string" ? component.component : component.component?.name,
        component.name,
        component.label,
        component.title,
        component.code
    ) || "Salary component";

const isComponentTotal = (label) =>
    /^(total|gross(?: salary)?|gross earnings|total earnings|total additions|total deductions|net(?: salary| payable)?)$/i.test(
        String(label).trim()
    );

const getScalarBreakdown = (record, category) => {
    const earningPattern = /^(basic(?:_salary)?|hra|.*(?:earning|allowance|bonus|incentive|commission|reimbursement|overtime|gratuity|benefit).*)$/i;
    const deductionPattern = /.*(?:deduct|provident|\\bpf\\b|insurance|\\besi\\b|tax|\\btds\\b|professional|\\blop\\b|\\blwop\\b|withhold|leave_deduction).*/i;
    const pattern = category === "earning" ? earningPattern : deductionPattern;
    const ignored = /^(total|gross|gross_salary|gross_pay|total_earnings|total_additions|total_deductions|net|net_salary|net_pay|salary|salary_amount)$/i;

    return Object.entries(record || {})
        .filter(([key]) => pattern.test(key) && !ignored.test(key))
        .map(([key, value]) => ({
            label: formatFieldLabel(key),
            amount: toNumber(value),
        }))
        .filter((component) => component.amount !== null);
};

const getBreakdown = (record, category) => {
    const keys = category === "earning"
        ? ["earnings_breakdown", "earningsBreakdown", "earning_breakdown", "earnings", "additions", "earning_components", "earningComponents"]
        : ["deductions_breakdown", "deductionsBreakdown", "deduction_breakdown", "deductions", "deduction_components", "deductionComponents"];
    const nestedKeys = category === "earning"
        ? ["earnings", "earning", "additions", "addition", "earning_components", "earning_breakdown"]
        : ["deductions", "deduction", "withholdings", "deduction_components", "deduction_breakdown"];

    for (const key of keys) {
        if (record?.[key] !== undefined && record?.[key] !== null) {
            const components = toComponentList(record[key])
                .map((component) => ({
                    label: componentLabel(component),
                    amount: componentAmount(component),
                }))
                .filter((component) => component.amount !== null && !isComponentTotal(component.label));
            if (components.length) return components;
        }
    }

    const containers = [
        record?.breakdown,
        record?.salary_breakdown,
        record?.salaryBreakdown,
        record?.payroll_breakdown,
        record?.payrollBreakdown,
    ];
    for (const container of containers) {
        if (!container || typeof container !== "object" || Array.isArray(container)) continue;
        for (const key of nestedKeys) {
            const components = toComponentList(container[key])
                .map((component) => ({
                    label: componentLabel(component),
                    amount: componentAmount(component),
                }))
                .filter((component) => component.amount !== null && !isComponentTotal(component.label));
            if (components.length) return components;
        }
    }

    const combined = firstValue(
        record?.salary_components,
        record?.salaryComponents,
        record?.components,
        ...containers
    );
    const combinedItems = toComponentList(combined)
        .filter((component) => {
            const type = String(
                firstValue(
                    component.component_type,
                    component.componentType,
                    component.type,
                    component.category,
                    component.is_deduction === true ? "deduction" : ""
                ) || ""
            ).toLowerCase();
            return category === "deduction"
                ? type.includes("deduct") || type.includes("withhold")
                : !type.includes("deduct") && !type.includes("withhold");
        })
        .map((component) => ({
            label: componentLabel(component),
            amount: componentAmount(component),
        }))
        .filter((component) => component.amount !== null && !isComponentTotal(component.label));
    return combinedItems.length ? combinedItems : getScalarBreakdown(record, category);
};

const sumComponents = (components) =>
    components.length
        ? components.reduce((sum, component) => sum + component.amount, 0)
        : null;

const getGross = (record) =>
    getNumber(record, [
        "gross_salary",
        "gross",
        "gross_pay",
        "gross_amount",
        "total_gross",
        "total_additions",
        "totalAdditions",
        "total_earnings",
        "totalEarnings",
    ]) ?? sumComponents(getBreakdown(record, "earning"));

const getDeductions = (record) =>
    getNumber(record, [
        "total_deductions",
        "totalDeductions",
        "total_deductions_amount",
        "deductions_total",
        "deduction_amount",
        "deductions",
    ]) ?? sumComponents(getBreakdown(record, "deduction"));

const getNetSalary = (record) => {
    const authoritative = getNumber(record, ["net_salary", "net_pay", "net", "take_home_pay", "take_home_salary"]);
    if (authoritative !== null) return authoritative;
    const gross = getGross(record);
    const deductions = getDeductions(record);
    return gross !== null && deductions !== null ? gross - deductions : null;
};

const sumAmounts = (records, getAmount) => {
    if (!records.length) return null;
    const amounts = records.map(getAmount);
    return amounts.every((amount) => amount !== null)
        ? amounts.reduce((sum, amount) => sum + amount, 0)
        : null;
};

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
    const numericAmount = toNumber(amount);
    if (numericAmount === null) return "—";
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(numericAmount);
    } catch {
        return `₹${numericAmount.toLocaleString("en-IN")}`;
    }
};

const amountInIndianWords = (amount) => {
    const number = toNumber(amount);
    if (number === null || number < 0) return "";

    const belowTwenty = [
        "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const underThousand = (value) => {
        const words = [];
        if (value >= 100) {
            words.push(`${belowTwenty[Math.floor(value / 100)]} Hundred`);
            value %= 100;
        }
        if (value >= 20) {
            words.push(tens[Math.floor(value / 10)]);
            value %= 10;
        }
        if (value > 0) words.push(belowTwenty[value]);
        return words.join(" ");
    };

    let remaining = Math.round(number);
    const groups = [
        [10000000, "Crore"],
        [100000, "Lakh"],
        [1000, "Thousand"],
        [1, ""],
    ];
    const words = [];
    groups.forEach(([size, label]) => {
        const value = Math.floor(remaining / size);
        if (value > 0) words.push(`${underThousand(value)}${label ? ` ${label}` : ""}`);
        remaining %= size;
    });
    return `Rupees ${words.join(" ") || "Zero"} Only`;
};

const formatAddress = (company) => {
    const address = firstValue(company?.full_address, company?.address, company?.registered_address);
    if (typeof address === "string") return address;
    return [
        address?.address_line_1,
        address?.address_line_2,
        address?.street,
        address?.city,
        address?.state,
        address?.pincode,
        address?.country,
        company?.address_line_1,
        company?.address_line_2,
        company?.street,
        company?.city,
        company?.state,
        company?.pincode,
        company?.country,
    ]
        .filter(Boolean)
        .join(", ");
};

const getDisplayValue = (record, keys) => {
    const value = firstValue(...keys.map((key) => record?.[key]));
    if (!value || typeof value !== "object") return value;
    return firstValue(value.name, value.full_name, value.label, value.title, value.code) || "—";
};

const formatFieldLabel = (key) =>
    key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDocumentDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getCompanyDetails = (response) => {
    const company = flattenPayslip(response);
    const logo = firstValue(company.logo_url, company.logo, company.company_logo);
    return {
        ...company,
        name: firstValue(company.name, company.company_name, company.business_name),
        logo_url: typeof logo === "string" ? logo : firstValue(logo?.url, logo?.href),
    };
};

const getPayrollRecordForPayslip = async (payslip) => {
    const period = payslip.period ?? payslip.payroll_period ?? payslip.payroll_month;
    if (!period) return null;

    const runs = await getPayrollDrafts();
    const matchingRuns = runs
        .filter((run) => String(run.period) === String(period))
        .sort((left, right) => {
            const finalizedStatus = (run) =>
                /final|lock|approv|complete|paid/i.test(String(run.status || ""));
            const statusOrder = Number(finalizedStatus(right)) - Number(finalizedStatus(left));
            if (statusOrder) return statusOrder;
            const leftDate = Date.parse(left.finalized_at || left.updated_at || left.created_at || "") || 0;
            const rightDate = Date.parse(right.finalized_at || right.updated_at || right.created_at || "") || 0;
            return rightDate - leftDate;
        });

    const payslipEmployeeId = payslip.employee ?? payslip.employee_id;
    const payslipEmployeeCode = getEmployeeCode(payslip);
    for (const run of matchingRuns) {
        const response = await getPayrollDraft(run.id);
        const payrollRun = response?.data ?? response;
        const records = payrollRun.records ?? payrollRun.employees ?? payrollRun.payroll_records ?? [];
        if (!Array.isArray(records)) continue;
        const record = records.find((item) =>
            (payslipEmployeeCode !== "—" && getEmployeeCode(item) === payslipEmployeeCode) ||
            (payslipEmployeeId != null && String(item.employee ?? item.employeeId) === String(payslipEmployeeId))
        );
        if (record) return flattenPayslip(record);
    }
    return null;
};

const PayslipDocument = ({ payslip, company, currency }) => {
    const earnings = getBreakdown(payslip, "earning");
    const deductions = getBreakdown(payslip, "deduction");
    const companyLogo = firstValue(company?.logo_url, company?.logo, company?.company_logo);
    const employeeFields = [
        ["Employee Code", getDisplayValue(payslip, ["employee_code", "employeeCode", "employee_id", "employeeId"])],
        ["Employee Name", getEmployeeName(payslip)],
        ["Department", getDisplayValue(payslip, ["department", "department_name"])],
        ["Designation", getDisplayValue(payslip, ["designation", "designation_name"])],
        ["Date of Joining", getDisplayValue(payslip, ["date_of_joining", "dateOfJoining", "joining_date", "date_joined"])],
    ];
    const bankFields = [
        ["Bank Name", getDisplayValue(payslip, ["bank_name", "bankName"])],
        ["Account No.", getDisplayValue(payslip, ["account_number", "accountNumber", "bank_account_number", "bank_account"])],
        ["IFSC Code", getDisplayValue(payslip, ["ifsc_code", "ifscCode", "ifsc"])],
        ["PAN Number", getDisplayValue(payslip, ["pan_number", "panNumber", "pan"])],
        ["UAN Number", getDisplayValue(payslip, ["uan_number", "uanNumber", "uan"])],
    ];
    const attendanceSummary = payslip.attendance_summary || payslip.attendanceSummary ||
        payslip.attendance_details || payslip.attendanceDetails || payslip.attendance;
    const attendanceFieldDefinitions = [
        ["Calendar Days", ["total_calendar_days", "calendar_days", "calendarDays"]],
        ["Working Days", ["working_days", "total_working_days", "workingDays"]],
        ["Days Present", ["present_days", "days_present", "days_worked"]],
        ["Paid Leaves", ["approved_paid_leave_days", "paid_leave_days", "paid_leaves", "paid_leave"]],
        ["Unpaid (LWOP)", ["unpaid_leave_days", "total_unpaid_days", "unpaid_days", "lwop_days", "lop_days"]],
        ["Payable Days", ["payable_days", "paid_days", "days_paid"]],
    ];
    const attendanceFields = attendanceFieldDefinitions.map(([label, keys]) => [
        label,
        getDisplayValue({ ...payslip, ...(attendanceSummary || {}) }, keys),
    ]);
    const showAttendance = attendanceFields.some(([, value]) => value !== undefined && value !== null && value !== "");
    
    const amountInWords = getDisplayValue(payslip, [
        "amount_in_words",
        "net_salary_in_words",
        "net_pay_in_words",
        "net_salary_words",
        "net_payable_in_words",
    ]) || amountInIndianWords(getNetSalary(payslip));
    const companyContact = [
        getDisplayValue(company, ["company_email", "email"]),
        getDisplayValue(company, ["phone", "phone_number", "contact_number"]),
        getDisplayValue(company, ["website"]),
    ].filter(Boolean).join(" · ");
    const gross = getGross(payslip);
    const totalDeductions = getDeductions(payslip);
    const net = getNetSalary(payslip);
    const earningsSum = sumComponents(earnings);
    const deductionsSum = sumComponents(deductions);
    const discrepancies = [
        ["gross_salary", earningsSum, gross],
        ["total_deductions", deductionsSum, totalDeductions],
    ].filter(([, sum, total]) =>
        sum !== null && total !== null && Math.abs(sum - total) > 0.01
    );
    if (
        gross !== null &&
        totalDeductions !== null &&
        net !== null &&
        Math.abs(gross - totalDeductions - net) > 0.01
    ) {
        discrepancies.push(["net_salary", gross - totalDeductions, net]);
    }
    

    return (
        <div className="payslips-document payslips-template">
            <header className="payslip-template-header">
                <div className="payslip-template-brand">
                    {companyLogo && (
                        <img
                            className="payslip-template-logo"
                            src={companyLogo}
                            alt={`${company.name || "Company"} logo`}
                            onError={(event) => {
                                event.currentTarget.style.display = "none";
                                const fallback = event.currentTarget.nextElementSibling;
                                if (fallback) fallback.style.display = "flex";
                            }}
                        />
                    )}
                    <div
                        className="payslip-template-logo-fallback"
                        aria-hidden="true"
                        style={{ display: companyLogo ? "none" : "flex" }}
                    >
                        <Building2 size={30} />
                    </div>
                    <div>
                        <h1>{company?.name || "Company name not configured"}</h1>
                        {formatAddress(company) && <p>{formatAddress(company)}</p>}
                    </div>
                </div>
            </header>

            <div className="payslip-template-title">
                <h2>
                    Payslip for the month of{" "}
                    {getPeriodLabel(payslip.period ?? payslip.payroll_period ?? payslip.payroll_month)}
                </h2>
                <p>
                    Payslip : {getDisplayValue(payslip, ["payslip_number", "payslipNumber", "reference_number", "payslip_reference"]) || "—"}
                    {" · "}
                    Generated on: {formatDocumentDate(getDisplayValue(payslip, ["generated_at", "created_at"]))}
                </p>
            </div>

            <section className="payslip-template-section">
                <div className="payslip-template-info-grid payslip-template-info-grid--reference">
                    {employeeFields.map(([label, value], index) => {
                        const [bankLabel, bankValue] = bankFields[index];
                        return (
                            <div className="payslip-template-info-row" key={label}>
                                <strong>{label}:</strong>
                                <span>{value ?? "—"}</span>
                                <strong>{bankLabel}:</strong>
                                <span>{bankValue ?? "—"}</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {showAttendance && (
                <section className="payslip-template-attendance">
                    <table className="payslip-template-attendance-table">
                        <thead>
                            <tr>{attendanceFields.map(([label]) => <th key={label}>{label}</th>)}</tr>
                        </thead>
                        <tbody>
                            <tr>{attendanceFields.map(([label, value]) => <td key={label}>{value ?? "—"}</td>)}</tr>
                        </tbody>
                    </table>
                </section>
            )}

            

            <section className="payslip-template-section payslip-template-breakdown">
                <table className="payslip-template-table payslip-template-combined-table">
                    <thead>
                        <tr>
                            <th>Earnings</th>
                            <th>Amount ({currency})</th>
                            <th>Deductions</th>
                            <th>Amount ({currency})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: Math.max(earnings.length, deductions.length, 1) }, (_, index) => (
                            <tr key={index}>
                                <td>{earnings[index]?.label || ""}</td>
                                <td>{earnings[index] ? formatCurrency(earnings[index].amount, currency) : ""}</td>
                                <td>{deductions[index]?.label || ""}</td>
                                <td>{deductions[index] ? formatCurrency(deductions[index].amount, currency) : ""}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Gross Earnings</th>
                            <th>{formatCurrency(gross, currency)}</th>
                            <th>Total Deductions</th>
                            <th>{formatCurrency(totalDeductions, currency)}</th>
                        </tr>
                    </tfoot>
                </table>
            </section>
            {discrepancies.length > 0 && (
                <p className="payslip-template-data-warning" role="status">
                    Backend payroll totals do not reconcile with the returned component breakdown
                    ({discrepancies.map(([field]) => field).join(", ")}). The displayed totals use
                    the authoritative payroll values.
                </p>
            )}

            <div className="payslip-template-net">
                <div>
                    <span>Net Salary Payable:</span>
                    {amountInWords && <small>Amount in Words: {amountInWords}</small>}
                </div>
                <strong>{formatCurrency(net, currency)}</strong>
            </div>

            {/* <footer className="payslip-template-footer payslip-template-signatures">
                <div className="payslip-template-signature">
                    <div />
                    <strong>{getDisplayValue(payslip, ["authorized_signatory", "authorised_signatory", "employer_name"]) || "Employer Signature / Authorized Signatory"}</strong>
                    {payslip.signature_url && <img src={payslip.signature_url} alt="Authorised signature" />}
                </div>
                <div className="payslip-template-signature payslip-template-employee-signature">
                    <div />
                    <strong>Employee Signature</strong>
                </div>
            </footer> */}
            <p className="payslip-template-system-note">
                {getDisplayValue(payslip, ["document_note", "system_generated_note"]) ||
                    "This is a system-generated document from Ignite HRMS and does not require a physical signature."}
            </p>
            <div className="payslip-template-generated">
                {getDisplayValue(payslip, ["declaration", "payslip_declaration"]) || ""}
            </div>
        </div>
    );
};


const Payslips = () => {
    const { showNotification } = useNotification();
    const notify = (type, message) => showNotification({ type, message });

    const [company, setCompany] = useState(null);
    const [companyError, setCompanyError] = useState(false);
    const [payslipData, setPayslipData] = useState([]);
    const [payrollRuns, setPayrollRuns] = useState([]);
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
                const companyDetails = getCompanyDetails(response);

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

        const loadPayrollRuns = async () => {
            try {
                const response = await getPayrollDrafts();
                if (mounted) setPayrollRuns(unwrapList(response));
            } catch (error) {
                console.error("Failed to load payroll run statuses:", error);
                if (mounted) setPayrollRuns([]);
            }
        };

        loadCompany();
        loadPayslipData();
        loadPayrollRuns();

        return () => {
            mounted = false;
        };
    }, []);

    const availablePeriods = useMemo(
        () =>
            [...new Set(
                payslipData
                    .map((slip) => getDisplayValue(flattenPayslip(slip), ["period", "payroll_period", "payroll_month"]))
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
                (slip) => String(getDisplayValue(flattenPayslip(slip), ["period", "payroll_period", "payroll_month"])) === String(activeMonth)
            );
            const firstSlip = slips.length ? flattenPayslip(slips[0]) : {};
            const payrollRun = payrollRuns
                .filter((run) =>
                    String(getDisplayValue(run, ["period", "payroll_period", "payroll_month"])) === String(activeMonth)
                )
                .sort((left, right) => {
                    const finalizedStatus = (run) =>
                        /final|lock|approv|complete|paid/i.test(
                            String(getDisplayValue(run, ["status", "payroll_status", "payrollStatus"]) || "")
                        );
                    const statusOrder = Number(finalizedStatus(right)) - Number(finalizedStatus(left));
                    if (statusOrder) return statusOrder;
                    const leftDate = Date.parse(left.finalized_at || left.updated_at || left.created_at || "") || 0;
                    const rightDate = Date.parse(right.finalized_at || right.updated_at || right.created_at || "") || 0;
                    return rightDate - leftDate;
                })[0];
            return slips.length
                ? {
                    period: activeMonth,
                    status: getDisplayValue(payrollRun, ["status", "payroll_status", "payrollStatus"]) ??
                        getDisplayValue(firstSlip, ["payroll_status", "payslip_status", "status"]) ??
                        "Unavailable",
                    payslips: slips,
                }
                : null;
        },
        [payslipData, payrollRuns, activeMonth]
    );

    const monthLabel = getPeriodLabel(activeMonth);

    const payslips = useMemo(() => {
        if (!selectedRun || !Array.isArray(selectedRun.payslips)) return [];

        return selectedRun.payslips
            .map((slip, index) => {
                const normalized = flattenPayslip(slip);
                const employee = flattenPayslip(normalized.employee || normalized.employee_snapshot || normalized);
                const record = { ...employee, ...normalized };
                return {
                    ...record,
                    _rowId: String(record.id ?? record.payslip_id ?? `${selectedRun.period}-${index}`),
                    _payslipId: record.id ?? record.payslip_id,
                    employeeId: getEmployeeCode(record),
                    name: getEmployeeName(record),
                    department: getDisplayValue(record, ["department", "department_name"]) ??
                        record.employee_snapshot?.department_name ?? "—",
                    gross: getGross(record),
                    deductions: getDeductions(record),
                    net: getNetSalary(record),
                    payrollStatus: record.payroll_status ?? record.status ?? selectedRun.status,
                    period: record.period ?? record.payroll_period ?? record.payroll_month ?? selectedRun.period,
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
            payroll: sumAmounts(payslips, (employee) => employee.net),
            gross: sumAmounts(payslips, (employee) => employee.gross),
            deductions: sumAmounts(payslips, (employee) => employee.deductions),
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
            const detail = flattenPayslip(response);
            let payrollRecord = null;
            try {
                payrollRecord = await getPayrollRecordForPayslip({ ...employee, ...detail });
            } catch (error) {
                console.error("Failed to load full payroll record for payslip:", error);
                notify(
                    "error",
                    error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    "Payslip summary loaded, but complete payroll details could not be retrieved."
                );
            }
            const listFallback = { ...employee };
            delete listFallback.gross;
            delete listFallback.deductions;
            delete listFallback.net;
            const hasCompleteDetails = Boolean(
                detail.employee_snapshot ||
                detail.earnings_breakdown ||
                detail.deductions_breakdown ||
                detail.attendance_summary
            );
            if (!payrollRecord && !hasCompleteDetails) {
                notify(
                    "error",
                    "The payslip detail response does not include the full payroll breakdown or employee snapshot."
                );
            }
            const normalized = {
                ...listFallback,
                ...detail,
                ...(payrollRecord || {}),
            };
            setSelectedPayslip({
                ...normalized,
                employeeId: getEmployeeCode(normalized),
                name: getEmployeeName(normalized),
                department: getDisplayValue(normalized, ["department", "department_name"]) ?? employee.department,
                deductions: getDeductions(normalized),
                gross: getGross(normalized),
                net: getNetSalary(normalized),
                _payslipId: employee._payslipId,
                period: normalized.period ?? normalized.payroll_period ?? normalized.payroll_month ?? employee.period,
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
        const earnings = getBreakdown(target, "earning");
        const deductions = getBreakdown(target, "deduction");
        const attendance = target.attendance_summary || target.attendanceSummary || {};

        const rows = [
            [company?.name || "Company", ""],
            ["Payslip period", getPeriodLabel(target.period)],
            ["Payslip number", target.payslip_number ?? target.payslipNumber],
            ["Generated date", target.generated_at ?? target.created_at],
            ["Payroll status", target.payrollStatus ?? target.payroll_status ?? target.status],
            ["Employee name", target.name],
            ["Employee ID", target.employeeId],
            ["Department", target.department],
            ["Designation", target.designation_name ?? target.designation],
            ["Date of joining", target.date_of_joining ?? target.dateOfJoining],
            ["Bank name", target.bank_name ?? target.bankName],
            ["Bank account", target.account_number ?? target.accountNumber],
            ["IFSC", target.ifsc_code ?? target.ifscCode],
            ["PAN", target.pan_number ?? target.panNumber],
            ["UAN", target.uan_number ?? target.uanNumber],
            ["Calendar days", attendance.total_calendar_days ?? attendance.calendar_days],
            ["Working days", attendance.working_days],
            ["Days present", attendance.present_days],
            ["Paid leaves", attendance.approved_paid_leave_days],
            ["Unpaid leave / LWOP", attendance.unpaid_leave_days ?? attendance.total_unpaid_days],
            ["Payable days", attendance.payable_days],
            ["", ""],
            ["Earnings", "Amount"],
            ...earnings.map((item) => [item.label, item.amount]),
            ["Gross salary", target.gross],
            ["", ""],
            ["Deductions", "Amount"],
            ...deductions.map((item) => [item.label, item.amount]),
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

                        <PayslipDocument
                            payslip={selectedPayslip}
                            company={company}
                            currency={currency}
                        />

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
