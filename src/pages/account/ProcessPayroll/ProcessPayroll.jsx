
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Calculator,
    CalendarDays,
    CircleAlert,
    Download,
    Eye,
    FileCheck2,
    RefreshCw,
    Save,
    Wallet,
} from "lucide-react";

import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import DatePicker from "../../../components/common/DatePicker/DatePicker";
import PayrollWorkflowNav from "../../../components/account/PayrollWorkflowNav";
import EmployeePayrollDetailDrawer from "../../../components/account/EmployeePayrollDetailDrawer/EmployeePayrollDetailDrawer";
import { useNotification } from "../../../context/NotificationContext";
import {
    calculatePayroll,
    createPayrollDraft,
    recalculatePayrollDraft,
    getPayrollDrafts,
    getPayrollDraft,
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

    const value = String(date);
    const parsed = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? `${value}T00:00:00`
            : value
    );

    return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
};

const TruncatedDescription = ({
    text,
    maxWords = 5,
    maxChars = 34,
    type = "issue",
}) => {
    if (!text) return null;
    const str = String(text).trim();
    if (!str || str === "—") return <span>{str || "—"}</span>;

    const words = str.split(/\s+/);
    const isLong = words.length > maxWords || str.length > maxChars;

    if (!isLong) {
        return (
            <span className={`process-payroll-inline-note type-${type}`}>
                {str}
            </span>
        );
    }

    const shortText = words.slice(0, maxWords).join(" ") + "...";

    return (
        <div className={`process-payroll-popover-wrap type-${type}`}>
            <span className="process-payroll-truncated-badge">
                {shortText}
            </span>
            <div className="process-payroll-tooltip-popover" role="tooltip">
                <div className="process-payroll-tooltip-arrow" />
                <div className="process-payroll-tooltip-header">
                    <CircleAlert size={12} />
                    <span>Complete Details</span>
                </div>
                <div className="process-payroll-tooltip-body">
                    {str}
                </div>
            </div>
        </div>
    );
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

const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const normalizeText = (value) =>
    String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, " ");

const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.values(value).flat();
    return value ? [value] : [];
};

const getComponentAmount = (components, match) => {
    const component = components.find((item) => match(item));
    return toNumber(
        component?.amount ??
        component?.calculated_amount ??
        component?.value ??
        component?.total
    );
};

const isBasicComponent = (item) => {
    const code = normalizeText(item?.code);
    const name = normalizeText(item?.name ?? item?.component_name);

    return (
        code === "bs" ||
        code === "basic" ||
        name === "basic salary" ||
        name === "basic"
    );
};

const isHraComponent = (item) => {
    const code = normalizeText(item?.code);
    const name = normalizeText(item?.name ?? item?.component_name);

    return (
        code === "hra" ||
        name === "hra" ||
        name === "house rent allowance"
    );
};

const isBonusComponent = (item) => {
    const code = normalizeText(item?.code);
    const name = normalizeText(item?.name ?? item?.component_name);

    return code === "bonus" || name.includes("bonus");
};

const isLopComponent = (item) => {
    const code = normalizeText(item?.code);
    const name = normalizeText(item?.name ?? item?.component_name);
    const type = normalizeText(item?.component_type);

    return (
        code === "lop" ||
        code === "lwop" ||
        name.includes("loss of pay") ||
        name.includes("leave without pay") ||
        name.includes("unpaid leave") ||
        name.includes("lop") ||
        name.includes("lwop") ||
        type === "lop"
    );
};

const isPfComponent = (item) => {
    const code = normalizeText(item?.code);
    const name = normalizeText(item?.name ?? item?.component_name);

    return (
        code === "pf" ||
        code === "epf" ||
        name === "pf" ||
        name.includes("provident fund")
    );
};

const isInsuranceComponent = (item) => {
    const code = normalizeText(item?.code);
    const name = normalizeText(item?.name ?? item?.component_name);

    return code.includes("insurance") || name.includes("insurance");
};

const isOtherDeductionComponent = (item) => {
    const code = normalizeText(item?.code);
    const name = normalizeText(item?.name ?? item?.component_name);

    // Keep LOP separate, but include professional tax and generic other deductions.
    return (
        code === "od" ||
        code === "other deduction" ||
        code === "pt" ||
        code === "professional tax" ||
        name === "other deductions" ||
        name === "other deduction" ||
        name === "professional tax"
    );
};

const getStructureId = (row) => {
    const value =
        row?.salary_structure_id ??
        row?.salary_structure?.id ??
        row?.salary_structure ??
        row?.structure_id ??
        row?.structureId;

    if (value && typeof value === "object") return value.id ?? null;
    return value ?? null;
};

const getEmployeeId = (row) => {
    const value =
        row?.employee_id ??
        row?.employeeId ??
        row?.employee?.id ??
        row?.employee;

    if (value && typeof value === "object") return value.id ?? "";
    return value ?? "";
};

const normalizePayrollRow = (row, index) => {
    const earnings = asArray(
        row?.earnings_breakdown ??
        row?.earningsBreakdown ??
        row?.earning_breakdown
    );

    const deductions = asArray(
        row?.deductions_breakdown ??
        row?.deductionsBreakdown ??
        row?.deduction_breakdown
    );

    const basicFromBreakdown = getComponentAmount(earnings, isBasicComponent);
    const hraFromBreakdown = getComponentAmount(earnings, isHraComponent);
    const bonusFromBreakdown = getComponentAmount(earnings, isBonusComponent);

    const gross = toNumber(
        row?.gross ??
        row?.gross_salary ??
        row?.gross_pay ??
        row?.total_gross
    );

    const basic =
        earnings.length > 0
            ? basicFromBreakdown
            : toNumber(row?.basic);

    const hra =
        earnings.length > 0
            ? hraFromBreakdown
            : toNumber(row?.hra);

    const bonus =
        earnings.length > 0
            ? bonusFromBreakdown
            : toNumber(row?.bonus);

    const breakdownEarningsTotal = earnings.reduce(
        (sum, item) =>
            sum +
            toNumber(
                item?.amount ??
                item?.calculated_amount ??
                item?.value ??
                item?.total
            ),
        0
    );

    const otherAllowances =
        earnings.length > 0
            ? Math.max(
                0,
                breakdownEarningsTotal - basicFromBreakdown - hraFromBreakdown - bonusFromBreakdown
            )
            : toNumber(row?.other_allowances ?? row?.otherAllowances);

    const lop =
        deductions.length > 0
            ? getComponentAmount(deductions, isLopComponent)
            : toNumber(row?.lop ?? row?.loss_of_pay ?? row?.lwop);

    const pf =
        deductions.length > 0
            ? getComponentAmount(deductions, isPfComponent)
            : toNumber(row?.pf);

    const insurance =
        deductions.length > 0
            ? getComponentAmount(deductions, isInsuranceComponent)
            : toNumber(row?.insurance);

    const otherDeductionsFromBreakdown = deductions
        .filter(isOtherDeductionComponent)
        .reduce(
            (sum, item) =>
                sum +
                toNumber(
                    item?.amount ??
                    item?.calculated_amount ??
                    item?.value ??
                    item?.total
                ),
            0
        );

    const otherDeductions =
        deductions.length > 0
            ? otherDeductionsFromBreakdown
            : toNumber(row?.other_deductions ?? row?.otherDeductions);

    const deductionsTotalFromBreakdown = deductions.reduce(
        (sum, item) =>
            sum +
            toNumber(
                item?.amount ??
                item?.calculated_amount ??
                item?.value ??
                item?.total
            ),
        0
    );

    const totalDeductions = toNumber(
        row?.total_deductions ??
        row?.totalDeductions ??
        (deductions.length > 0
            ? deductionsTotalFromBreakdown
            : pf + insurance + lop + otherDeductions)
    );

    const net = toNumber(
        row?.net ??
        row?.net_salary ??
        row?.net_pay ??
        (gross - totalDeductions)
    );

    const structureId = getStructureId(row);

    const exceptions = asArray(row?.exceptions)
        .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
                return (
                    item.message ??
                    item.detail ??
                    item.description ??
                    item.name ??
                    JSON.stringify(item)
                );
            }
            return String(item ?? "");
        })
        .filter(Boolean);

    const status = row?.status ?? (structureId ? "Ready" : "Missing salary structure");

    return {
        ...row,
        employeeId: String(getEmployeeId(row) || `row-${index}`),
        employeeCode:
            row?.employee_code ??
            row?.employeeCode ??
            row?.employee?.employee_code ??
            row?.employee?.employee_id ??
            "—",
        employeeName:
            row?.employee_name ??
            row?.employeeName ??
            getEmployeeName(row?.employee || row),
        department:
            row?.department_name ??
            row?.department?.name ??
            row?.department ??
            "—",
        structureId,
        effectiveDate:
            row?.effective_from ??
            row?.effective_date ??
            row?.effectiveDate ??
            row?.salary_structure?.effective_from ??
            row?.salary_structure_effective_from ??
            null,
        basic,
        hra,
        otherAllowances,
        bonus,
        pf,
        insurance,
        lop,
        otherDeductions,
        gross,
        totalDeductions,
        net,
        status,
        exceptions,
        earningsBreakdown: earnings,
        deductionsBreakdown: deductions,
        attendanceSummary:
            row?.attendance_summary ??
            row?.attendanceSummary ??
            null,
        recordId: row?.id ?? row?.record_id,
    };
};

const getRowIssues = (row) => {
    const status = normalizeText(row.status);
    const issues = [...row.exceptions];

    if (!row.structureId || status.includes("missing salary structure")) {
        issues.unshift("Missing salary structure");
    }

    if (
        ["error", "exception", "failed", "blocked", "invalid"].some((token) =>
            status.includes(token)
        )
    ) {
        issues.push(`Payroll status: ${row.status}`);
    }

    return [...new Set(issues)];
};

const isRowBlocked = (row) => {
    const status = normalizeText(row.status);

    return (
        !row.structureId ||
        [
            "missing",
            "error",
            "exception",
            "failed",
            "blocked",
            "invalid",
        ].some((token) => status.includes(token)) ||
        row.exceptions.length > 0
    );
};

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
    const [exporting, setExporting] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [selectedRecord, setSelectedRecord] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError("");

        try {
            const draftsResult = await getPayrollDrafts();
            setExistingDrafts(unwrapList(draftsResult));
        } catch (error) {
            console.error("Failed to load payroll drafts:", error);
            setLoadError("Payroll drafts could not be loaded. Please try again.");
            setExistingDrafts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const periodEnd = useMemo(() => {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return "";

        const [year, month] = period.split("-").map(Number);

        return `${year}-${String(month).padStart(2, "0")}-${String(
            new Date(year, month, 0).getDate()
        ).padStart(2, "0")}`;
    }, [period]);

    const periodLabel = useMemo(() => {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return "";

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

    const handleRecordUpdated = (updatedRecord, updatedRun) => {
        setSelectedRecord(updatedRecord);
        setRows((prev) =>
            prev.map((r) => {
                const isMatch =
                    (updatedRecord.id && String(r.recordId) === String(updatedRecord.id)) ||
                    String(r.employeeId) === String(updatedRecord.employee || updatedRecord.employeeId);
                return isMatch ? normalizePayrollRow({ ...r, ...updatedRecord }) : r;
            })
        );
        if (updatedRun) {
            setExistingDrafts((prev) =>
                prev.map((d) => (String(d.id) === String(updatedRun.id) ? { ...d, ...updatedRun } : d))
            );
        }
    };

    const handleRecalculateDraft = async () => {
        if (!existingRun?.id) return;
        const res = await recalculatePayrollDraft(existingRun.id);
        const detail = res?.data ?? res;
        if (detail?.records) {
            setRows(detail.records.map(normalizePayrollRow));
            if (selectedRecord) {
                const fresh = detail.records.find(
                    (r) =>
                        (selectedRecord.recordId && String(r.id) === String(selectedRecord.recordId)) ||
                        String(r.employee) === String(selectedRecord.employeeId)
                );
                if (fresh) setSelectedRecord(normalizePayrollRow(fresh));
            }
        }
        const refreshedDrafts = await getPayrollDrafts();
        setExistingDrafts(unwrapList(refreshedDrafts));
    };

    const loadExistingDraft = async () => {
        if (!existingRun?.id) return;
        setLoading(true);
        try {
            const res = await getPayrollDraft(existingRun.id);
            const detail = res?.data ?? res;
            const recs = detail?.records ?? detail?.employees ?? [];
            setRows(recs.map(normalizePayrollRow));
            setHasGenerated(true);
            notify("success", `Loaded saved payroll draft for ${periodLabel}.`);
        } catch (err) {
            console.error("Failed to load existing draft:", err);
            notify("error", "Failed to load saved draft records.");
        } finally {
            setLoading(false);
        }
    };

    const generatePayroll = async () => {
        if (!periodEnd) {
            notify("error", "Please select a valid payroll month.");
            return;
        }

        setGenerating(true);

        try {
            const response = await calculatePayroll({ period });
            const data = response?.data ?? response;

            const rowsFromObject =
                data?.records ??
                data?.employees ??
                data?.payroll_records ??
                data?.results;

            const backendRows = unwrapList(data);

            const sourceRows = backendRows.length
                ? backendRows
                : Array.isArray(rowsFromObject)
                    ? rowsFromObject
                    : [];

            const mappedRows = sourceRows.map(normalizePayrollRow);

            setRows(mappedRows);
            setHasGenerated(true);

            if (mappedRows.length === 0) {
                notify("warning", `No payroll records were returned for ${periodLabel}.`);
                return;
            }

            const issueCount = mappedRows.filter(
                (row) => getRowIssues(row).length > 0
            ).length;

            notify(
                issueCount > 0 ? "warning" : "success",
                issueCount > 0
                    ? `Payroll calculated. ${issueCount} employee(s) need attention.`
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
        const readyRows = rows.filter((row) => !isRowBlocked(row));
        const blockedRows = rows.filter(isRowBlocked);

        return {
            employees: readyRows.length,
            missing: blockedRows.length,
            gross: readyRows.reduce((sum, row) => sum + row.gross, 0),
            deductions: readyRows.reduce(
                (sum, row) => sum + row.totalDeductions,
                0
            ),
            net: readyRows.reduce((sum, row) => sum + row.net, 0),
            lop: readyRows.reduce((sum, row) => sum + row.lop, 0),
        };
    }, [rows]);

    const saveDraft = async () => {
        if (!hasGenerated || rows.length === 0) {
            notify("error", "Generate payroll before saving a draft.");
            return;
        }

        if (totals.missing > 0) {
            notify(
                "error",
                "Resolve missing salary structures and payroll exceptions before saving the draft."
            );
            return;
        }

        const existingStatus = String(existingRun?.status || "DRAFT").toUpperCase();

        if (existingRun && existingStatus !== "DRAFT") {
            notify(
                "error",
                "A non-draft payroll run already exists for this month. It cannot be overwritten."
            );
            return;
        }

        setSaving(true);

        try {
            let savedResult;
            if (existingRun?.id) {
                savedResult = await recalculatePayrollDraft(existingRun.id);
            } else {
                savedResult = await createPayrollDraft({ period });
            }

            const refreshedDrafts = await getPayrollDrafts();
            setExistingDrafts(unwrapList(refreshedDrafts));

            const detail = savedResult?.data ?? savedResult;
            if (detail?.records) {
                setRows(detail.records.map(normalizePayrollRow));
            }

            notify(
                "success",
                existingRun
                    ? "Payroll draft recalculated and saved successfully."
                    : "Payroll draft created successfully."
            );
        } catch (error) {
            console.error("Failed to save payroll draft:", error);

            const responseData = error?.response?.data;

            const message =
                responseData?.detail ||
                responseData?.message ||
                (responseData
                    ? Object.entries(responseData)
                        .map(([key, value]) => {
                            const readableValue = Array.isArray(value)
                                ? value.join(" ")
                                : typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value);

                            return `${key}: ${readableValue}`;
                        })
                        .join("; ")
                    : "Could not save the draft. Please try again.");

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

        if (!existingRun?.id) {
            notify("error", "Save a payroll draft before exporting it.");
            return;
        }

        setExporting(true);

        try {
            const blob = await exportPayrollRun(existingRun.id);
            triggerBlobDownload(blob, `ignite-payroll-${period}.csv`);
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
            setExporting(false);
        }
    };

    const existingStatus = String(existingRun?.status || "DRAFT").toUpperCase();
    const existingRunLocked = Boolean(existingRun && existingStatus !== "DRAFT");

    return (
        <div className="process-payroll-page">
            <PageHeader
                eyebrow="ACCOUNT"
                title="Process Payroll"
                description="Calculate, review, and prepare employee payroll for a selected month."
            />

            <PayrollWorkflowNav />

            <Card className="process-payroll-period-card">
                <div className="process-payroll-toolbar">
                    <div className="process-payroll-period">
                        <label>
                            <CalendarDays size={16} />
                            Payroll month
                        </label>

                        <div className="process-payroll-datepicker-wrapper">
                            <DatePicker
                                mode="month"
                                value={period}
                                onChange={(val) => {
                                    setPeriod(val);
                                    setHasGenerated(false);
                                    setRows([]);
                                }}
                                placeholder="Select payroll month"
                            />
                        </div>
                    </div>

                    <div className="process-payroll-actions">
                        <Button
                            variant="secondary"
                            onClick={loadData}
                            disabled={loading || generating}
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </Button>

                        {existingRun && (
                            <Button
                                variant="secondary"
                                onClick={loadExistingDraft}
                                disabled={loading || generating}
                                title="Load saved draft from backend"
                            >
                                <FileCheck2 size={16} />
                                Load Draft ({existingRun.status || "Draft"})
                            </Button>
                        )}

                        <Button
                            onClick={generatePayroll}
                            disabled={loading || generating || !period}
                        >
                            <Calculator size={16} />
                            {generating ? "Calculating..." : "Generate Payroll"}
                        </Button>
                    </div>
                </div>

                {loading && (
                    <p className="process-payroll-message">
                        Loading payroll drafts...
                    </p>
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
                        Payroll calculations use salary structures effective on or
                        before {formatDate(periodEnd)}.
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
                                    <small>
                                        {totals.missing} employee(s) need attention
                                    </small>
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
                                    <small>
                                        Includes LOP, PF, insurance and other deductions
                                    </small>
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
                                <strong>
                                    {totals.missing} employee(s) need attention
                                </strong>
                                <p>
                                    Review each employee's status and exceptions below.
                                    Assign a salary structure to employees who are missing
                                    one, and resolve the reported exceptions before saving
                                    the payroll draft.
                                </p>
                            </div>
                        </div>
                    )}

                    <Card className="process-payroll-table-card">
                        <div className="process-payroll-table-heading">
                            <div>
                                <h2>Payroll review</h2>
                                <p>{periodLabel}</p>
                            </div>

                            <div className="process-payroll-actions">
                                <Button
                                    variant="secondary"
                                    onClick={exportCSV}
                                    disabled={exporting || loading || !existingRun?.id}
                                >
                                    <Download size={16} />
                                    {exporting ? "Exporting..." : "Export CSV"}
                                </Button>

                                <Button
                                    onClick={saveDraft}
                                    disabled={
                                        saving ||
                                        generating ||
                                        loading ||
                                        totals.missing > 0 ||
                                        rows.length === 0 ||
                                        existingRunLocked
                                    }
                                >
                                    <Save size={16} />
                                    {saving ? "Saving..." : "Save Draft"}
                                </Button>
                            </div>
                        </div>

                        {existingRun && (
                            <div className="process-payroll-existing-run">
                                Existing run for this month:{" "}
                                <strong>{existingRun.status || "Draft"}</strong>
                                {existingRunLocked &&
                                    " — this run cannot be overwritten."}
                            </div>
                        )}

                        <div className="process-payroll-table-wrap">
                            <table className="process-payroll-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Department</th>
                                        <th>Salary structure</th>
                                        <th>Basic</th>
                                        <th>Gross</th>
                                        <th>Deductions</th>
                                        <th>Net pay</th>
                                        <th>Status</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row) => {
                                        const issues = getRowIssues(row);

                                        return (
                                            <tr
                                                key={`${row.employeeId}-${row.recordId ?? ""}`}
                                                className="process-payroll-clickable-row"
                                                onClick={() => setSelectedRecord(row)}
                                                title="Click to view full salary calculation and adjustments"
                                            >
                                                <td>
                                                    <div className="process-payroll-employee">
                                                        <strong>{row.employeeName}</strong>
                                                        <span>{row.employeeCode}</span>

                                                        {issues.length > 0 && (
                                                            <TruncatedDescription
                                                                text={issues.join(" • ")}
                                                                maxWords={5}
                                                                maxChars={32}
                                                                type="issue"
                                                            />
                                                        )}
                                                        {row.description && !issues.length && (
                                                            <TruncatedDescription
                                                                text={row.description}
                                                                maxWords={5}
                                                                maxChars={32}
                                                                type="desc"
                                                            />
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    <TruncatedDescription
                                                        text={row.department}
                                                        maxWords={4}
                                                        maxChars={22}
                                                        type="dept"
                                                    />
                                                </td>
                                                <td>
                                                    {row.structureId
                                                        ? row.effectiveDate
                                                            ? formatDate(row.effectiveDate)
                                                            : `Assigned (#${row.structureId})`
                                                        : "Missing"}
                                                </td>
                                                <td>{money(row.basic)}</td>
                                                <td>{money(row.gross)}</td>
                                                <td>{money(row.totalDeductions)}</td>
                                                <td className="process-payroll-net">
                                                    {money(row.net)}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`process-payroll-status ${isRowBlocked(row)
                                                                ? "is-missing"
                                                                : "is-ready"
                                                            }`}
                                                    >
                                                        <span className="badge-dot" />
                                                        {row.status}
                                                    </span>
                                                </td>

                                                <td className="text-right process-payroll-action-cell" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        className="process-payroll-view-btn"
                                                        onClick={() => setSelectedRecord(row)}
                                                        title="View detailed calculation & adjustments"
                                                    >
                                                        <Eye size={13} />
                                                        <span>View</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                                {rows.length > 0 && (
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3}>Included payroll total</td>
                                            <td>
                                                {money(
                                                    rows
                                                        .filter((row) => !isRowBlocked(row))
                                                        .reduce((sum, row) => sum + row.basic, 0)
                                                )}
                                            </td>
                                            <td>{money(totals.gross)}</td>
                                            <td>{money(totals.deductions)}</td>
                                            <td>{money(totals.net)}</td>
                                            <td />
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

                    {selectedRecord && (
                        <EmployeePayrollDetailDrawer
                            open={Boolean(selectedRecord)}
                            onClose={() => setSelectedRecord(null)}
                            record={selectedRecord}
                            runId={existingRun?.id}
                            runStatus={existingRun?.status || "DRAFT"}
                            period={period}
                            onRecordUpdated={handleRecordUpdated}
                            onRecalculateDraft={handleRecalculateDraft}
                        />
                    )}
                </>
            )}
        </div>
    );
}
