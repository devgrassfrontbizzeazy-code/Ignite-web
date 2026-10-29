import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Download,
    Eye,
    FileText,
    IndianRupee,
    RefreshCw,
    Wallet,
    Banknote,
    Building2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

import { useNotification } from "../../../context/NotificationContext";
import {
    getMyPayslips,
    getMyPayslip,
    downloadMyPayslip,
    unwrapList,
    triggerBlobDownload,
} from "../../../services/api/accountAPI";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import Button from "../../../components/common/Button/Button";
import Modal from "../../../components/common/Modal/Modal";
import DatePicker from "../../../components/common/DatePicker/DatePicker";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import IgniteLoader from "../../../components/common/IgniteLoader/IgniteLoader";

import "./MyPayslips.css";

const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getPeriod = (slip) =>
    slip.period ?? slip.payroll_period ?? slip.payroll_month ?? "";

const getPeriodLabel = (period) => {
    if (!period || !/^\d{4}-\d{2}$/.test(String(period))) {
        return period || "Payroll period";
    }

    const [year, month] = String(period).split("-");

    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
        "en-IN",
        { month: "long", year: "numeric" }
    );
};

const getSlipId = (slip) => slip.id ?? slip.payslip_id;

const firstValue = (...values) =>
    values.find((value) => value !== undefined && value !== null && value !== "");

const toNumber = (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string" || !value.trim()) return null;
    const parsed = Number(value.trim().replace(/,/g, "").replace(/^[^\d.-]+/, ""));
    return Number.isFinite(parsed) ? parsed : null;
};

const getAmount = (...values) => {
    return toNumber(firstValue(...values)) ?? 0;
};

const getGross = (slip) =>
    getAmount(
        slip.gross_salary,
        slip.gross,
        slip.total_additions,
        slip.totalAdditions
    );

const getDeductions = (slip) =>
    getAmount(
        slip.total_deductions,
        slip.totalDeductions,
        slip.total_deductions_amount,
        slip.deductions
    );

const getNet = (slip) =>
    getAmount(
        slip.net_salary,
        slip.net_pay,
        slip.net
    );

const formatCurrency = (amount, currency = "INR") => {
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(Number(amount ?? 0));
    } catch {
        return `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
    }
};

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    fallback;

const flattenPayslip = (record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return {};
    const nestedKeys = [
        "payslip", "data", "employee", "employee_snapshot", "employeeSnapshot",
        "employee_details", "employeeDetails", "bank_details", "bankDetails", "bank",
        "salary_details", "salaryDetails", "attendance_summary", "attendanceSummary",
        "attendance", "attendance_details", "attendanceDetails", "payroll_record",
        "payrollRecord",
    ];
    const nested = nestedKeys
        .map((key) => record[key])
        .filter((value) => value && typeof value === "object" && !Array.isArray(value))
        .reduce((result, value) => ({ ...result, ...flattenPayslip(value) }), {});
    return { ...nested, ...record };
};

const getEmployeeCode = (record) =>
    firstValue(
        record?.employee_code,
        record?.employeeCode,
        typeof record?.employee_id === "string" ? record.employee_id : undefined,
        typeof record?.employeeId === "string" ? record.employeeId : undefined
    );

const getComponentLabel = (component) =>
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

const getComponentAmount = (component) =>
    toNumber(firstValue(
        component.amount,
        component.value,
        component.calculated_amount,
        component.calculatedAmount,
        component.calculated_value,
        component.computed_amount,
        component.earning_amount,
        component.deduction_amount,
        component.salary_amount,
        component.payable_amount,
        component.total
    ));

const getBreakdown = (record, category) => {
    const arrayKeys = category === "earning"
        ? ["earnings_breakdown", "earningsBreakdown", "earning_breakdown", "earnings", "additions", "earning_components", "earningComponents"]
        : ["deductions_breakdown", "deductionsBreakdown", "deduction_breakdown", "deductions", "withholdings", "deduction_components", "deductionComponents"];
    const nestedKeys = category === "earning"
        ? ["earnings", "earning", "additions", "addition", "earning_components", "earning_breakdown"]
        : ["deductions", "deduction", "withholdings", "deduction_components", "deduction_breakdown"];
    const scalarPattern = category === "earning"
        ? /^(basic(?:_salary)?|hra|.*(?:earning|allowance|bonus|incentive|commission|reimbursement|overtime|gratuity|benefit).*)$/i
        : /.*(?:deduct|provident|\bpf\b|insurance|\besi\b|tax|\btds\b|professional|\blop\b|\blwop\b|withhold|leave_deduction).*/i;
    const ignored = /^(total|gross|gross_salary|gross_pay|total_earnings|total_additions|total_deductions|deductions|deduction_amount|net|net_salary|net_pay|salary|salary_amount)$/i;
    const mapComponents = (value) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            const nested = firstValue(value.items, value.components, value.breakdown, value.results);
            if (nested) return mapComponents(nested);
        }
        const entries = Array.isArray(value)
            ? value
            : value && typeof value === "object"
                ? Object.entries(value).map(([name, item]) =>
                    item && typeof item === "object" ? { name, ...item } : { name, amount: item }
                )
                : [];
        return entries
            .filter((item) => item && typeof item === "object")
            .map((item) => ({ label: getComponentLabel(item), amount: getComponentAmount(item) }))
            .filter((item) => item.amount !== null && !/^(total|gross|net)(\b|\s)/i.test(item.label));
    };
    let components = [];

    for (const key of arrayKeys) {
        components = mapComponents(record?.[key]);
        if (components.length) break;
    }

    const breakdownContainers = [
        record?.breakdown,
        record?.salary_breakdown,
        record?.salaryBreakdown,
        record?.payroll_breakdown,
        record?.payrollBreakdown,
    ];
    if (!components.length) {
        for (const container of breakdownContainers) {
            if (!container || typeof container !== "object" || Array.isArray(container)) continue;
            for (const key of nestedKeys) {
                components = mapComponents(container[key]);
                if (components.length) break;
            }
            if (components.length) break;
        }
    }

    if (!components.length) {
        const combined = firstValue(
            record?.salary_components,
            record?.salaryComponents,
            record?.components,
            ...breakdownContainers
        );
        const combinedEntries = Array.isArray(combined)
            ? combined
            : combined && typeof combined === "object"
                ? Object.entries(combined).map(([name, item]) =>
                    item && typeof item === "object" ? { name, ...item } : { name, amount: item }
                )
                : [];
        components = combinedEntries
            .filter((component) => {
                const type = String(firstValue(
                    component.component_type,
                    component.componentType,
                    component.type,
                    component.category,
                    component.is_deduction === true ? "deduction" : ""
                ) || "").toLowerCase();
                return category === "deduction"
                    ? type.includes("deduct") || type.includes("withhold")
                    : !type.includes("deduct") && !type.includes("withhold");
            })
            .map((component) => ({
                label: getComponentLabel(component),
                amount: getComponentAmount(component),
            }))
            .filter((item) => item.amount !== null && !/^(total|gross|net)(\b|\s)/i.test(item.label));
    }

    const scalarComponents = Object.entries(record || {})
        .filter(([key]) => scalarPattern.test(key) && !ignored.test(key))
        .map(([key, amount]) => ({
            label: key
                .replace(/([a-z])([A-Z])/g, "$1 $2")
                .replace(/[_-]+/g, " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase()),
            amount: toNumber(amount),
        }))
        .filter((item) => item.amount !== null);
    const normalizeLabel = (label) => {
        const normalized = label.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalized === "basicsalary") return "basic";
        if (normalized === "houserentallowance") return "hra";
        return normalized;
    };
    const knownLabels = new Set(components.map((item) => normalizeLabel(item.label)));
    scalarComponents.forEach((item) => {
        const normalizedLabel = normalizeLabel(item.label);
        if (!knownLabels.has(normalizedLabel)) {
            components.push(item);
            knownLabels.add(normalizedLabel);
        }
    });
    return components;
};

const getDisplayValue = (record, keys) => {
    const value = firstValue(...keys.map((key) => record?.[key]));
    if (value && typeof value === "object") {
        return firstValue(value.name, value.full_name, value.label, value.title, value.code) || "—";
    }
    return value;
};

const normalizeStatusKey = (status) => {
    const norm = String(status || "").toLowerCase();
    if (norm.includes("paid") || norm.includes("approv") || norm.includes("success")) return "approved";
    if (norm.includes("pend") || norm.includes("draft")) return "pending";
    if (norm.includes("reject") || norm.includes("cancel")) return "rejected";
    if (norm.includes("process") || norm.includes("work")) return "working";
    return "approved";
};

const MyPayslips = () => {
    const { showNotification } = useNotification();

    const [payslips, setPayslips] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [viewingId, setViewingId] = useState(null);
    const [error, setError] = useState("");

    const notify = (type, message) =>
        showNotification({ type, message });

    const loadPayslips = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const response = await getMyPayslips();
            const records = unwrapList(response);

            setPayslips(
                Array.isArray(records)
                    ? records.filter((slip) => getSlipId(slip) != null)
                    : []
            );
        } catch (err) {
            console.error("Failed to load employee payslips:", err);
            setError(
                getErrorMessage(err, "Unable to load your payslips.")
            );
            setPayslips([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadPayslips();
    }, []);

    const availablePeriods = useMemo(
        () =>
            [...new Set(payslips.map(getPeriod).filter(Boolean))]
                .sort((a, b) => String(b).localeCompare(String(a))),
        [payslips]
    );

    // Active period resolution
    const activePeriod = useMemo(() => {
        if (selectedPeriod === "ALL") return "ALL";
        if (selectedPeriod) return selectedPeriod;
        if (availablePeriods.length > 0) return availablePeriods[0];
        return getCurrentMonth();
    }, [selectedPeriod, availablePeriods]);

    const filteredPayslips = useMemo(() => {
        if (activePeriod === "ALL") return payslips;
        return payslips.filter(
            (slip) => String(getPeriod(slip)) === String(activePeriod)
        );
    }, [payslips, activePeriod]);

    const totals = useMemo(
        () => ({
            count: filteredPayslips.length,
            gross: filteredPayslips.reduce(
                (sum, slip) => sum + getGross(slip),
                0
            ),
            deductions: filteredPayslips.reduce(
                (sum, slip) => sum + getDeductions(slip),
                0
            ),
            net: filteredPayslips.reduce(
                (sum, slip) => sum + getNet(slip),
                0
            ),
        }),
        [filteredPayslips]
    );

    const handleView = async (slip) => {
        const id = getSlipId(slip);

        if (id == null) {
            notify("error", "This payslip has no valid record ID.");
            return;
        }

        setViewingId(id);

        try {
            const response = await getMyPayslip(id);
            const detail = flattenPayslip(response);
            const hasCompleteDetail = Boolean(
                detail.employee_snapshot ||
                detail.employeeSnapshot ||
                detail.earnings_breakdown ||
                detail.earningsBreakdown ||
                detail.deductions_breakdown ||
                detail.deductionsBreakdown ||
                detail.attendance_summary
            );

            setSelectedPayslip({
                ...flattenPayslip(slip),
                ...detail,
                period: getPeriod(detail) || getPeriod(slip),
                _payslipId: id,
                _payrollDetailsUnavailable: !hasCompleteDetail,
            });
        } catch (err) {
            console.error("Failed to load payslip details:", err);
            notify(
                "error",
                getErrorMessage(err, "Unable to load payslip details.")
            );
        } finally {
            setViewingId(null);
        }
    };

    const handleDownload = async (slip) => {
        const id = slip?._payslipId ?? getSlipId(slip);

        if (id == null) {
            notify("error", "This payslip has no valid record ID.");
            return;
        }

        setDownloadingId(id);

        try {
            const file = await downloadMyPayslip(id);
            const period = getPeriod(slip) || "payslip";

            triggerBlobDownload(file, `payslip-${period}.pdf`);

            notify("success", "Payslip PDF downloaded.");
        } catch (err) {
            console.error("Failed to download payslip:", err);
            notify(
                "error",
                getErrorMessage(err, "Unable to download your payslip.")
            );
        } finally {
            setDownloadingId(null);
        }
    };

    const currency = selectedPayslip?.currency || "INR";
    const earnings = selectedPayslip ? getBreakdown(selectedPayslip, "earning") : [];
    const deductions = selectedPayslip ? getBreakdown(selectedPayslip, "deduction") : [];
    const attendance = selectedPayslip
        ? selectedPayslip.attendance_summary ||
            selectedPayslip.attendanceSummary ||
            selectedPayslip.attendance_details ||
            selectedPayslip.attendanceDetails ||
            selectedPayslip.attendance ||
            {}
        : {};
    const attendanceFields = [
        ["Calendar Days", ["total_calendar_days", "calendar_days", "calendarDays"]],
        ["Working Days", ["working_days", "total_working_days", "workingDays"]],
        ["Days Present", ["present_days", "days_present", "days_worked"]],
        ["Paid Leaves", ["approved_paid_leave_days", "paid_leave_days", "paid_leaves"]],
        ["Unpaid Leave / LWOP", ["unpaid_leave_days", "total_unpaid_days", "unpaid_days", "lwop_days", "lop_days"]],
        ["Payable Days", ["payable_days", "paid_days", "days_paid"]],
    ].map(([label, keys]) => [
        label,
        getDisplayValue({ ...selectedPayslip, ...attendance }, keys),
    ]).filter(([, value]) => value !== undefined && value !== null && value !== "");
    const employeeDetails = selectedPayslip ? [
        ["Employee ID", getDisplayValue(selectedPayslip, ["employee_code", "employeeCode", "employee_id", "employeeId"])],
        ["Department", getDisplayValue(selectedPayslip, ["department", "department_name"])],
        ["Designation", getDisplayValue(selectedPayslip, ["designation", "designation_name"])],
        ["Date of Joining", getDisplayValue(selectedPayslip, ["date_of_joining", "dateOfJoining", "joining_date"])],
        ["Bank Name", getDisplayValue(selectedPayslip, ["bank_name", "bankName"])],
        ["Account Number", getDisplayValue(selectedPayslip, ["account_number", "accountNumber", "bank_account_number", "bank_account"])],
        ["IFSC Code", getDisplayValue(selectedPayslip, ["ifsc_code", "ifscCode", "ifsc"])],
        ["PAN Number", getDisplayValue(selectedPayslip, ["pan_number", "panNumber", "pan"])],
        ["UAN Number", getDisplayValue(selectedPayslip, ["uan_number", "uanNumber", "uan"])],
    ].filter(([, value]) => value !== undefined && value !== null && value !== "") : [];
    const paymentDetails = selectedPayslip ? [
        ["Payment Date", getDisplayValue(selectedPayslip, ["payment_date", "paid_at", "processed_at"])],
        ["Payment Method", getDisplayValue(selectedPayslip, ["payment_method", "payment_mode"])],
        ["Payroll Status", getDisplayValue(selectedPayslip, ["payroll_status", "payrollStatus", "status"])],
    ].filter(([, value]) => value !== undefined && value !== null && value !== "") : [];
    const logoValue = selectedPayslip
        ? firstValue(
            selectedPayslip.company_logo_url,
            selectedPayslip.company_logo,
            selectedPayslip.company?.logo_url,
            selectedPayslip.company?.logo
        )
        : null;
    const companyLogo = typeof logoValue === "string"
        ? logoValue
        : firstValue(logoValue?.url, logoValue?.href);
    const companyRecord = selectedPayslip?.company &&
        typeof selectedPayslip.company === "object"
        ? selectedPayslip.company
        : selectedPayslip;
    const companyAddress = selectedPayslip
        ? getDisplayValue(companyRecord, [
            "full_address",
            "address",
            "registered_address",
        ])
        : null;

    return (
        <div className="attendance-page my-payslips-page">
            <PageHeader
                eyebrow="EMPLOYEE ACCOUNT"
                title="My Payslips"
                description="View your salary records, inspect earnings breakdown, and download monthly payslips."
                action={
                    <div className="attendance-page__header-actions">
                        <span className="attendance-page__date">
                            <CalendarDays size={15} />
                            {activePeriod === "ALL"
                                ? "All Records"
                                : getPeriodLabel(activePeriod)}
                        </span>
                        <Button
                            variant="secondary"
                            onClick={() => loadPayslips(true)}
                            disabled={loading || refreshing}
                        >
                            <RefreshCw
                                size={15}
                                className={refreshing ? "is-spinning" : ""}
                            />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>
                }
            />

            {/* Attendance-style Filter Toolbar */}
            <div className="employee-attendance__toolbar my-payslips-toolbar">
                <div className="my-payslips-toolbar__left">
                    <div className="my-payslips-date-wrapper">
                        <DatePicker
                            mode="month"
                            value={activePeriod === "ALL" ? "" : activePeriod}
                            onChange={(val) => setSelectedPeriod(val)}
                            placeholder="Select month"
                        />
                    </div>

                    <div className="employee-attendance__date-shortcuts">
                        <button
                            type="button"
                            className={activePeriod === "ALL" ? "active" : ""}
                            onClick={() => setSelectedPeriod("ALL")}
                        >
                            All Payslips
                        </button>
                        {availablePeriods.slice(0, 4).map((p) => (
                            <button
                                key={p}
                                type="button"
                                className={activePeriod === p ? "active" : ""}
                                onClick={() => setSelectedPeriod(p)}
                            >
                                {getPeriodLabel(p)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="my-payslips-toolbar__right">
                    <span className="my-payslips-period-badge">
                        <CheckCircle2 size={14} />
                        {activePeriod === "ALL"
                            ? `${payslips.length} Total Records`
                            : getPeriodLabel(activePeriod)}
                    </span>
                </div>
            </div>

            {error && (
                <div className="my-payslips-notice" role="alert">
                    <div className="my-payslips-notice__content">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => loadPayslips(true)}
                    >
                        Try again
                    </Button>
                </div>
            )}

            {/* Attendance-style Stat Cards (4-column grid) */}
            <div className="attendance-stats my-payslips-stats-grid">
                {/* 1. Payslips Count (Teal / Rate card) */}
                <div className="attendance-stat-card attendance-stat-card--rate">
                    <div className="attendance-stat-card__icon">
                        <FileText size={20} />
                    </div>
                    <div className="attendance-stat-card__label">Payslips Available</div>
                    <div className="attendance-stat-card__value">
                        {loading ? "0" : totals.count}
                    </div>
                    <div className="attendance-stat-card__description">
                        {activePeriod === "ALL"
                            ? "All released payslips"
                            : `${getPeriodLabel(activePeriod)} record`}
                    </div>
                </div>

                {/* 2. Gross Earnings (Present / Emerald card) */}
                <div className="attendance-stat-card attendance-stat-card--present">
                    <div className="attendance-stat-card__icon">
                        <Wallet size={20} />
                    </div>
                    <div className="attendance-stat-card__label">Gross Earnings</div>
                    <div className="attendance-stat-card__value">
                        {loading ? "₹0.00" : formatCurrency(totals.gross, currency)}
                    </div>
                    <div className="attendance-stat-card__description">
                        Before deductions & tax
                    </div>
                </div>

                {/* 3. Total Deductions (Late / Gold card) */}
                <div className="attendance-stat-card attendance-stat-card--late">
                    <div className="attendance-stat-card__icon">
                        <Banknote size={20} />
                    </div>
                    <div className="attendance-stat-card__label">Total Deductions</div>
                    <div className="attendance-stat-card__value">
                        {loading ? "₹0.00" : formatCurrency(totals.deductions, currency)}
                    </div>
                    <div className="attendance-stat-card__description">
                        PF, taxes & deductions
                    </div>
                </div>

                {/* 4. Net Take-Home Salary (Hours / Teal-Emerald card) */}
                <div className="attendance-stat-card attendance-stat-card--hours">
                    <div className="attendance-stat-card__icon">
                        <IndianRupee size={20} />
                    </div>
                    <div className="attendance-stat-card__label">Net Take-Home</div>
                    <div className="attendance-stat-card__value">
                        {loading ? "₹0.00" : formatCurrency(totals.net, currency)}
                    </div>
                    <div className="attendance-stat-card__description">
                        Disbursed to bank account
                    </div>
                </div>
            </div>

            {/* Payslip History Panel / Table Card */}
            <div className="employee-attendance__table-card my-payslips-table-card">
                <div className="my-payslips-card-header">
                    <div className="my-payslips-card-header__info">
                        <h2>Salary Records</h2>
                        <p>
                            {activePeriod === "ALL"
                                ? "Complete history of your released payslips"
                                : `Released records for ${getPeriodLabel(activePeriod)}`}
                        </p>
                    </div>

                    <span className="my-payslips-record-badge">
                        {loading
                            ? "Loading..."
                            : `${filteredPayslips.length} ${filteredPayslips.length === 1 ? "record" : "records"}`}
                    </span>
                </div>

                {loading ? (
                    <div className="my-payslips-loader-wrap">
                        <IgniteLoader text="Loading your payslips..." />
                    </div>
                ) : !filteredPayslips.length ? (
                    <EmptyState
                        icon={<FileText size={40} />}
                        title="No payslips available"
                        description={
                            activePeriod === "ALL"
                                ? "You do not have any released payslips yet. Payslips appear here once generated and published by your company's payroll department."
                                : `No payslips have been released for ${getPeriodLabel(activePeriod)}. Select another month from the calendar above or view all records.`
                        }
                        action={
                            availablePeriods.length > 0 && activePeriod !== "ALL" ? (
                                <Button
                                    variant="secondary"
                                    onClick={() => setSelectedPeriod("ALL")}
                                >
                                    View All Released Payslips
                                </Button>
                            ) : null
                        }
                    />
                ) : (
                    <div className="employee-attendance__table-responsive">
                        <table className="employee-attendance__table">
                            <thead>
                                <tr>
                                    <th>Payroll Month</th>
                                    <th>Gross Salary</th>
                                    <th>Deductions</th>
                                    <th>Net Salary</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPayslips.map((slip) => {
                                    const id = getSlipId(slip);
                                    const status =
                                        slip.payslip_status ??
                                        slip.payroll_status ??
                                        slip.status ??
                                        "Released";
                                    const statusKey = normalizeStatusKey(status);

                                    return (
                                        <tr key={id}>
                                            <td>
                                                <div className="my-payslips-period-cell">
                                                    <div className="my-payslips-cell-icon">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div className="my-payslips-cell-meta">
                                                        <strong className="my-payslips-cell-title">
                                                            {getPeriodLabel(getPeriod(slip))}
                                                        </strong>
                                                        <span className="my-payslips-cell-sub">
                                                            {slip.payslip_number ||
                                                                slip.payslip_no ||
                                                                `Payslip #${id}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="my-payslips-amount">
                                                    {formatCurrency(
                                                        getGross(slip),
                                                        slip.currency || "INR"
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="my-payslips-amount my-payslips-amount--deduction">
                                                    {formatCurrency(
                                                        getDeductions(slip),
                                                        slip.currency || "INR"
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="my-payslips-amount my-payslips-amount--net">
                                                    {formatCurrency(
                                                        getNet(slip),
                                                        slip.currency || "INR"
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`employee-att-badge employee-att-badge--${statusKey}`}
                                                >
                                                    <span className="badge-dot" />
                                                    {status}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="employee-att-actions">
                                                    <button
                                                        type="button"
                                                        className="employee-att-action-btn employee-att-action-btn--view"
                                                        onClick={() => handleView(slip)}
                                                        disabled={viewingId === id}
                                                        title="View payslip details"
                                                        aria-label={`View ${getPeriodLabel(getPeriod(slip))} payslip`}
                                                    >
                                                        {viewingId === id ? (
                                                            <RefreshCw
                                                                size={14}
                                                                className="is-spinning"
                                                            />
                                                        ) : (
                                                            <Eye size={15} />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="employee-att-action-btn employee-att-action-btn--download"
                                                        onClick={() => handleDownload(slip)}
                                                        disabled={downloadingId === id}
                                                        title="Download PDF"
                                                        aria-label={`Download ${getPeriodLabel(getPeriod(slip))} PDF`}
                                                    >
                                                        {downloadingId === id ? (
                                                            <RefreshCw
                                                                size={14}
                                                                className="is-spinning"
                                                            />
                                                        ) : (
                                                            <Download size={15} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Attendance-consistent Modal for Payslip Details */}
            <Modal
                open={Boolean(selectedPayslip)}
                onClose={() => setSelectedPayslip(null)}
                title={
                    selectedPayslip
                        ? `Payslip — ${getPeriodLabel(getPeriod(selectedPayslip))}`
                        : "Payslip Details"
                }
                description={
                    selectedPayslip
                        ? `${selectedPayslip.payslip_number || `Payslip #${getSlipId(selectedPayslip)}`} · Released record`
                        : ""
                }
                size="large"
                footer={
                    selectedPayslip ? (
                        <div className="my-payslips-modal-actions">
                            <Button
                                variant="secondary"
                                onClick={() => setSelectedPayslip(null)}
                            >
                                Close
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleDownload(selectedPayslip)}
                                disabled={downloadingId === selectedPayslip._payslipId}
                                loading={downloadingId === selectedPayslip._payslipId}
                            >
                                <Download size={16} />
                                Download PDF
                            </Button>
                        </div>
                    ) : null
                }
            >
                {selectedPayslip && (
                    <div className="my-payslips-modal-content">
                        {/* Net Pay Hero Card */}
                        <div className="my-payslips-net-hero">
                            <div className="my-payslips-net-hero__main">
                                <div className="my-payslips-net-hero__topline">
                                    <span className="my-payslips-net-hero__label">
                                        Net pay · Take-home salary
                                    </span>
                                    {getDisplayValue(selectedPayslip, [
                                        "payroll_status",
                                        "payrollStatus",
                                        "status",
                                    ]) && (
                                        <span className="my-payslips-net-hero__status">
                                            <CheckCircle2 size={13} />
                                            {getDisplayValue(selectedPayslip, [
                                                "payroll_status",
                                                "payrollStatus",
                                                "status",
                                            ])}
                                        </span>
                                    )}
                                </div>
                                <div className="my-payslips-net-hero__amount-row">
                                    <span className="my-payslips-net-hero__currency-mark" aria-hidden="true">
                                        <IndianRupee size={23} />
                                    </span>
                                    <strong className="my-payslips-net-hero__amount">
                                        {formatCurrency(getNet(selectedPayslip), currency)}
                                    </strong>
                                </div>
                                <span className="my-payslips-net-hero__period">
                                    <CalendarDays size={14} />
                                    {getPeriodLabel(getPeriod(selectedPayslip))}
                                </span>
                            </div>

                            <div className="my-payslips-net-hero__stats">
                                <div className="my-payslips-net-hero__stat">
                                    <span>Gross Earnings</span>
                                    <strong>
                                        {formatCurrency(
                                            getGross(selectedPayslip),
                                            currency
                                        )}
                                    </strong>
                                </div>
                                <div className="my-payslips-net-hero__stat">
                                    <span>Total Deductions</span>
                                    <strong className="my-payslips-text-danger">
                                        -
                                        {formatCurrency(
                                            getDeductions(selectedPayslip),
                                            currency
                                        )}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {selectedPayslip._payrollDetailsUnavailable && (
                            <div className="my-payslips-details-warning" role="status">
                                The payslip summary loaded, but the complete payroll breakdown could not be retrieved.
                                The amounts below reflect only the available payslip data.
                            </div>
                        )}

                        <section className="my-payslips-document-details">
                            <div className="my-payslips-document-heading">
                                <div className="my-payslips-company-mark" aria-hidden="true">
                                    {companyLogo
                                        ? <img src={companyLogo} alt="" />
                                        : <Building2 size={20} />}
                                </div>
                                <div>
                                    <h3>
                                        {getDisplayValue(selectedPayslip, [
                                            "company_name",
                                            "business_name",
                                        ]) || selectedPayslip.company?.name || "Payslip"}
                                    </h3>
                                    <p>
                                        {selectedPayslip.payslip_number || `Payslip #${getSlipId(selectedPayslip)}`}
                                        {" · "}
                                        {getPeriodLabel(getPeriod(selectedPayslip))}
                                        {selectedPayslip.generated_at
                                            ? ` · Generated ${new Date(selectedPayslip.generated_at).toLocaleDateString("en-IN")}`
                                            : ""}
                                    </p>
                                    {companyAddress && <p>{companyAddress}</p>}
                                </div>
                            </div>
                            {(employeeDetails.length > 0 ||
                                selectedPayslip.employee_name ||
                                selectedPayslip.name ||
                                selectedPayslip.full_name ||
                                selectedPayslip.fullName) && (
                                <div className="my-payslips-detail-grid">
                                    <div className="my-payslips-detail-item">
                                        <span>Employee Name</span>
                                        <strong>
                                            {getDisplayValue(selectedPayslip, ["employee_name", "employeeName", "name", "full_name", "fullName"]) || "—"}
                                        </strong>
                                    </div>
                                    {employeeDetails.map(([label, value]) => (
                                        <div className="my-payslips-detail-item" key={label}>
                                            <span>{label}</span>
                                            <strong>{value}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {attendanceFields.length > 0 && (
                                <div className="my-payslips-attendance-details">
                                    <h4>Attendance & Payable Days</h4>
                                    <div className="my-payslips-attendance-grid">
                                        {attendanceFields.map(([label, value]) => (
                                            <div key={label}>
                                                <span>{label}</span>
                                                <strong>{value}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {paymentDetails.length > 0 && (
                                <div className="my-payslips-payment-details">
                                    {paymentDetails.map(([label, value]) => (
                                        <div className="my-payslips-detail-item" key={label}>
                                            <span>{label}</span>
                                            <strong>{value}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                        {/* {componentTotalsMismatch && (
                            <div className="my-payslips-details-warning" role="status">
                                One or more component breakdowns do not add up to the backend payroll totals.
                                Gross, deduction, and net summary values remain the authoritative payroll amounts.
                            </div>
                        )} */}

                        {/* Breakdown 2-Column Grid */}
                        <div className="my-payslips-breakdown-grid">
                            {/* Earnings column */}
                            <div className="my-payslips-breakdown-col">
                                <h3 className="my-payslips-breakdown-title my-payslips-breakdown-title--earnings">
                                    <Wallet size={16} />
                                    Earnings
                                </h3>

                                <div className="my-payslips-breakdown-list">
                                    {earnings.map(({ label, amount }) => (
                                        <div className="my-payslips-breakdown-item" key={label}>
                                            <span>{label}</span>
                                            <strong>{formatCurrency(amount, currency)}</strong>
                                        </div>
                                    ))}
                                    {earnings.length === 0 && (
                                        <p className="my-payslips-breakdown-empty">
                                            No earning components were returned for this payslip.
                                        </p>
                                    )}

                                    <div className="my-payslips-breakdown-total">
                                        <span>Total Gross Salary</span>
                                        <strong>
                                            {formatCurrency(
                                                getGross(selectedPayslip),
                                                currency
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions column */}
                            <div className="my-payslips-breakdown-col">
                                <h3 className="my-payslips-breakdown-title my-payslips-breakdown-title--deductions">
                                    <Banknote size={16} />
                                    Deductions
                                </h3>

                                <div className="my-payslips-breakdown-list">
                                    {deductions.map(({ label, amount }) => (
                                        <div className="my-payslips-breakdown-item" key={label}>
                                            <span>{label}</span>
                                            <strong className="my-payslips-text-danger">
                                                {formatCurrency(amount, currency)}
                                            </strong>
                                        </div>
                                    ))}
                                    {deductions.length === 0 && (
                                        <p className="my-payslips-breakdown-empty">
                                            No deduction components were returned for this payslip.
                                        </p>
                                    )}

                                    <div className="my-payslips-breakdown-total">
                                        <span>Total Deductions</span>
                                        <strong className="my-payslips-text-danger">
                                            {formatCurrency(
                                                getDeductions(selectedPayslip),
                                                currency
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyPayslips;