import { useState, useEffect, useMemo } from "react";
import {
    CalendarDays,
    CircleAlert,
    CheckCircle2,
    DollarSign,
    Save,
    RefreshCw,
    Info,
    CreditCard,
    User,
    Building2,
    FileText,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Lock,
} from "lucide-react";

import Drawer from "../../common/Drawer/Drawer";
import Button from "../../common/Button/Button";
import { adjustPayrollRecord, recalculatePayrollDraft } from "../../../services/api/accountAPI";
import { useNotification } from "../../../context/NotificationContext";
import "./EmployeePayrollDetailDrawer.css";

const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

const formatMethod = (method) => {
    if (!method) return "Fixed";
    const str = String(method).toUpperCase();
    switch (str) {
        case "FIXED":
            return "Fixed Amount";
        case "PERCENTAGE":
            return "Percentage";
        case "PER_DAY":
            return "Per Day Pro-rata";
        case "SLAB":
            return "Tax/Slab Based";
        case "MANUAL":
            return "Manual Input";
        default:
            return method;
    }
};

export default function EmployeePayrollDetailDrawer({
    open,
    onClose,
    record,
    runId,
    runStatus = "DRAFT",
    period,
    onRecordUpdated,
    onRecalculateDraft,
}) {
    const { showNotification } = useNotification();
    const notify = (type, message) => showNotification({ type, message });

    const [saving, setSaving] = useState(false);
    const [recalculating, setRecalculating] = useState(false);

    // Form inputs for supported payroll-period adjustments
    const [bonus, setBonus] = useState("");
    const [deduction, setDeduction] = useState("");
    const [notes, setNotes] = useState("");

    // Populate existing manual adjustments when record changes
    useEffect(() => {
        if (!record) return;
        const currentAdj = record.manual_adjustments || record.manualAdjustments || {};
        setBonus(currentAdj.bonus !== undefined && currentAdj.bonus !== null ? String(currentAdj.bonus) : "");
        setDeduction(currentAdj.deduction !== undefined && currentAdj.deduction !== null ? String(currentAdj.deduction) : "");
        setNotes(currentAdj.notes ? String(currentAdj.notes) : "");
    }, [record]);

    if (!record) return null;

    const recordId = record.id || record.recordId || record.record_id;
    const isDraft = String(runStatus || "DRAFT").toUpperCase() === "DRAFT";
    const canEdit = isDraft && Boolean(runId && recordId);

    // Employee snapshot / basic info
    const snapshot = record.employee_snapshot || record.employeeSnapshot || {};
    const employeeName =
        record.employee_name ||
        record.employeeName ||
        snapshot.full_name ||
        record.name ||
        "Employee";
    const employeeCode =
        record.employee_code ||
        record.employeeCode ||
        snapshot.employee_code ||
        "—";
    const departmentName =
        record.department ||
        snapshot.department_name ||
        "—";
    const designationName =
        snapshot.designation_name ||
        record.designation ||
        "—";

    // Attendance summary
    const att = record.attendance_summary || record.attendanceSummary || {};
    const calendarDays = Number(att.total_calendar_days ?? att.calendar_days ?? 30);
    const payableDays = Number(att.payable_days ?? calendarDays);
    const presentDays = Number(att.present_days ?? 0);
    const paidLeaves = Number(att.approved_paid_leave_days ?? att.paid_leaves ?? 0);
    const unpaidDays = Number(att.unpaid_leave_days ?? att.total_unpaid_days ?? att.unpaid_days ?? 0);
    const lwpBasis = att.lwp_calculation_basis || "CALENDAR_DAYS";
    const lwpComponent = att.lwp_deduction_component || "GROSS";

    // Earnings & Deductions breakdowns
    const earnings = Array.isArray(record.earnings_breakdown)
        ? record.earnings_breakdown
        : Array.isArray(record.earningsBreakdown)
            ? record.earningsBreakdown
            : [];

    const deductions = Array.isArray(record.deductions_breakdown)
        ? record.deductions_breakdown
        : Array.isArray(record.deductionsBreakdown)
            ? record.deductionsBreakdown
            : [];

    // Financial totals
    const grossSalary = Number(
        record.gross_salary ?? record.gross ?? record.gross_pay ?? 0
    );
    const totalDeductions = Number(
        record.total_deductions ?? record.totalDeductions ?? 0
    );
    const netSalary = Number(
        record.net_salary ?? record.net ?? record.net_pay ?? 0
    );

    // Exceptions & issues
    const exceptions = Array.isArray(record.exceptions)
        ? record.exceptions
        : [];

    // Handle Save Manual Adjustments
    const handleSaveAdjustments = async (e) => {
        if (e) e.preventDefault();
        if (!runId || !recordId) {
            notify("error", "Cannot save adjustments without an active draft payroll run.");
            return;
        }

        const numBonus = bonus === "" ? 0 : Number(bonus);
        const numDeduction = deduction === "" ? 0 : Number(deduction);

        if (isNaN(numBonus) || numBonus < 0) {
            notify("error", "Ad-hoc bonus must be a valid non-negative number.");
            return;
        }
        if (isNaN(numDeduction) || numDeduction < 0) {
            notify("error", "Ad-hoc deduction must be a valid non-negative number.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                manual_adjustments: {
                    bonus: numBonus,
                    deduction: numDeduction,
                    notes: notes.trim(),
                },
            };

            const response = await adjustPayrollRecord(runId, recordId, payload);
            notify("success", `Adjustments saved for ${employeeName}. Run totals updated.`);

            if (onRecordUpdated) {
                const updatedRecord = response?.record || response;
                const updatedRun = response?.payroll_run || null;
                onRecordUpdated(updatedRecord, updatedRun);
            }
        } catch (error) {
            console.error("Failed to save adjustments:", error);
            const msg =
                error?.response?.data?.error ||
                error?.response?.data?.detail ||
                "Failed to save payroll adjustments.";
            notify("error", msg);
        } finally {
            setSaving(false);
        }
    };

    // Handle Recalculate
    const handleRecalculate = async () => {
        if (!runId) {
            notify("error", "No draft ID available to recalculate.");
            return;
        }
        setRecalculating(true);
        try {
            if (onRecalculateDraft) {
                await onRecalculateDraft();
            } else {
                const res = await recalculatePayrollDraft(runId);
                notify("success", "Payroll draft recalculated successfully.");
                if (onRecordUpdated && res?.records) {
                    const freshRecord = res.records.find(
                        (r) => String(r.id) === String(recordId)
                    );
                    if (freshRecord) onRecordUpdated(freshRecord, res);
                }
            }
        } catch (error) {
            console.error("Recalculate failed:", error);
            notify("error", error?.response?.data?.error || "Recalculation failed.");
        } finally {
            setRecalculating(false);
        }
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Employee Payroll Calculation Details"
            description={`Component-wise salary breakdown & adjustments for ${employeeName}`}
            width="680px"
            className="emp-payroll-drawer"
        >
            <div className="emp-payroll-drawer__content">
                {/* 1. EMPLOYEE HEADER SUMMARY CARD */}
                <div className="emp-payroll-card emp-payroll-header-card">
                    <div className="emp-payroll-header-avatar">
                        <User size={24} />
                    </div>
                    <div className="emp-payroll-header-info">
                        <div className="emp-payroll-header-title-row">
                            <h3>{employeeName}</h3>
                            <span className="emp-payroll-code-badge">{employeeCode}</span>
                            <span className={`emp-payroll-status-badge ${exceptions.length > 0 ? "has-issues" : "is-valid"}`}>
                                {exceptions.length > 0 ? "Action Required" : "Ready"}
                            </span>
                        </div>
                        <div className="emp-payroll-header-meta">
                            <span><Building2 size={13} /> {departmentName}</span>
                            {designationName && designationName !== "—" && (
                                <span>• {designationName}</span>
                            )}
                            {period && <span>• Period: <strong>{period}</strong></span>}
                        </div>
                    </div>
                </div>

                {/* 2. EXCEPTIONS & WARNINGS BANNER */}
                {exceptions.length > 0 && (
                    <div className="emp-payroll-exceptions-banner">
                        <div className="emp-payroll-exceptions-header">
                            <CircleAlert size={16} />
                            <strong>Payroll Calculation Warnings ({exceptions.length})</strong>
                        </div>
                        <ul className="emp-payroll-exceptions-list">
                            {exceptions.map((exc, idx) => (
                                <li key={idx}>{exc}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 3. KPI FINANCIAL SUMMARY CARDS */}
                <div className="emp-payroll-kpi-grid">
                    <div className="emp-payroll-kpi-card gross">
                        <span className="emp-payroll-kpi-icon"><TrendingUp size={16} /></span>
                        <div>
                            <span className="emp-payroll-kpi-label">Gross Salary</span>
                            <strong className="emp-payroll-kpi-val">{money(grossSalary)}</strong>
                        </div>
                    </div>
                    <div className="emp-payroll-kpi-card deductions">
                        <span className="emp-payroll-kpi-icon"><TrendingDown size={16} /></span>
                        <div>
                            <span className="emp-payroll-kpi-label">Total Deductions</span>
                            <strong className="emp-payroll-kpi-val">{money(totalDeductions)}</strong>
                        </div>
                    </div>
                    <div className="emp-payroll-kpi-card net">
                        <span className="emp-payroll-kpi-icon"><DollarSign size={16} /></span>
                        <div>
                            <span className="emp-payroll-kpi-label">Net Take-Home Pay</span>
                            <strong className="emp-payroll-kpi-val highlight">{money(netSalary)}</strong>
                        </div>
                    </div>
                </div>

                {/* 4. ATTENDANCE & PAID DAYS SUMMARY */}
                <div className="emp-payroll-card">
                    <div className="emp-payroll-card-header">
                        <CalendarDays size={16} />
                        <h4>Attendance & Working Days Analysis</h4>
                    </div>
                    <div className="emp-payroll-attendance-grid">
                        <div className="emp-payroll-att-item">
                            <span>Calendar Days</span>
                            <strong>{calendarDays}</strong>
                        </div>
                        <div className="emp-payroll-att-item">
                            <span>Payable Days</span>
                            <strong className="att-highlight">{payableDays}</strong>
                        </div>
                        <div className="emp-payroll-att-item">
                            <span>Present Days</span>
                            <strong>{presentDays}</strong>
                        </div>
                        <div className="emp-payroll-att-item">
                            <span>Paid Leaves</span>
                            <strong>{paidLeaves}</strong>
                        </div>
                        <div className="emp-payroll-att-item">
                            <span>Unpaid (LWP)</span>
                            <strong className={unpaidDays > 0 ? "att-warning" : ""}>{unpaidDays}</strong>
                        </div>
                    </div>
                    {unpaidDays > 0 && (
                        <div className="emp-payroll-lwp-note">
                            <Info size={13} />
                            <span>
                                LWP calculated based on <strong>{lwpBasis.replace(/_/g, " ")}</strong> against <strong>{lwpComponent.replace(/_/g, " ")}</strong> salary.
                            </span>
                        </div>
                    )}
                </div>

                {/* 5. SALARY STRUCTURE & BANKING SNAPSHOT */}
                <div className="emp-payroll-card">
                    <div className="emp-payroll-card-header">
                        <CreditCard size={16} />
                        <h4>Salary Structure & Banking Details</h4>
                    </div>
                    <div className="emp-payroll-banking-grid">
                        <div className="emp-payroll-banking-field">
                            <span>Payment Method</span>
                            <strong>{(snapshot.payment_method || "Bank Transfer").replace(/_/g, " ")}</strong>
                        </div>
                        <div className="emp-payroll-banking-field">
                            <span>Bank Name</span>
                            <strong>{snapshot.bank_name || "—"}</strong>
                        </div>
                        <div className="emp-payroll-banking-field">
                            <span>Account Number</span>
                            <strong>{snapshot.account_number || "—"}</strong>
                        </div>
                        <div className="emp-payroll-banking-field">
                            <span>IFSC Code</span>
                            <strong>{snapshot.ifsc_code || "—"}</strong>
                        </div>
                        <div className="emp-payroll-banking-field">
                            <span>PAN Number</span>
                            <strong>{snapshot.pan_number || "—"}</strong>
                        </div>
                        <div className="emp-payroll-banking-field">
                            <span>UAN Number</span>
                            <strong>{snapshot.uan_number || "—"}</strong>
                        </div>
                    </div>
                </div>

                {/* 6. EARNINGS BREAKDOWN TABLE */}
                <div className="emp-payroll-card">
                    <div className="emp-payroll-card-header">
                        <TrendingUp size={16} />
                        <h4>Earnings Component Breakdown</h4>
                    </div>
                    <div className="emp-payroll-table-wrap">
                        <table className="emp-payroll-breakdown-table">
                            <thead>
                                <tr>
                                    <th>Component</th>
                                    <th>Code</th>
                                    <th>Calculation Method</th>
                                    <th className="text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map((item, idx) => (
                                    <tr key={item.component_id || item.code || idx}>
                                        <td>
                                            <span className="component-name">{item.name || "Earning"}</span>
                                        </td>
                                        <td>
                                            <span className="component-code">{item.code || "—"}</span>
                                        </td>
                                        <td>
                                            <span className="component-method">{formatMethod(item.calculation_method)}</span>
                                        </td>
                                        <td className="text-right font-medium">
                                            {money(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                                {earnings.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center text-muted">
                                            No earnings components defined.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3}><strong>Gross Total Earnings</strong></td>
                                    <td className="text-right font-bold text-success">{money(grossSalary)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* 7. DEDUCTIONS BREAKDOWN TABLE */}
                <div className="emp-payroll-card">
                    <div className="emp-payroll-card-header">
                        <TrendingDown size={16} />
                        <h4>Deductions Breakdown</h4>
                    </div>
                    <div className="emp-payroll-table-wrap">
                        <table className="emp-payroll-breakdown-table">
                            <thead>
                                <tr>
                                    <th>Component</th>
                                    <th>Code</th>
                                    <th>Calculation Method</th>
                                    <th className="text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deductions.map((item, idx) => (
                                    <tr key={item.component_id || item.code || idx}>
                                        <td>
                                            <span className="component-name">{item.name || "Deduction"}</span>
                                        </td>
                                        <td>
                                            <span className="component-code">{item.code || "—"}</span>
                                        </td>
                                        <td>
                                            <span className="component-method">{formatMethod(item.calculation_method)}</span>
                                        </td>
                                        <td className="text-right font-medium text-danger">
                                            {money(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                                {deductions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center text-muted">
                                            No deductions applied.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3}><strong>Total Deductions</strong></td>
                                    <td className="text-right font-bold text-danger">{money(totalDeductions)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* 8. GROSS-TO-NET EXACT FORMULA DISPLAY */}
                <div className="emp-payroll-formula-banner">
                    <div className="emp-payroll-formula-header">
                        <FileText size={15} />
                        <span>Exact Gross-to-Net Salary Calculation</span>
                    </div>
                    <div className="emp-payroll-formula-steps">
                        <div className="emp-payroll-formula-term">
                            <span className="term-label">Gross Earnings</span>
                            <span className="term-value positive">{money(grossSalary)}</span>
                        </div>
                        <span className="term-op">−</span>
                        <div className="emp-payroll-formula-term">
                            <span className="term-label">Total Deductions</span>
                            <span className="term-value negative">{money(totalDeductions)}</span>
                        </div>
                        <span className="term-op">=</span>
                        <div className="emp-payroll-formula-term total">
                            <span className="term-label">Net Salary Payout</span>
                            <span className="term-value net">{money(netSalary)}</span>
                        </div>
                    </div>
                </div>

                {/* 9. MANUAL ADJUSTMENTS (EDITABLE PAYROLL-PERIOD INPUTS) */}
                <div className="emp-payroll-card emp-payroll-adjustments-card">
                    <div className="emp-payroll-card-header">
                        <DollarSign size={16} />
                        <h4>Payroll-Period Adjustments</h4>
                        {!canEdit && (
                            <span className="emp-payroll-lock-badge">
                                <Lock size={12} /> Read-only ({runStatus})
                            </span>
                        )}
                    </div>

                    <form onSubmit={handleSaveAdjustments} className="emp-payroll-adjustments-form">
                        <p className="emp-payroll-adj-help">
                            {canEdit
                                ? "Ad-hoc adjustments for this specific payroll period. Permanent employee salary structures remain unchanged."
                                : "Payroll adjustments cannot be modified in the current run status."}
                        </p>

                        <div className="emp-payroll-adj-fields">
                            <div className="emp-payroll-field-group">
                                <label htmlFor="adhoc-bonus">Ad-hoc Bonus / Incentive (₹)</label>
                                <input
                                    id="adhoc-bonus"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={bonus}
                                    onChange={(e) => setBonus(e.target.value)}
                                    disabled={!canEdit || saving || recalculating}
                                />
                            </div>

                            <div className="emp-payroll-field-group">
                                <label htmlFor="adhoc-deduction">Ad-hoc Deduction / Fine (₹)</label>
                                <input
                                    id="adhoc-deduction"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={deduction}
                                    onChange={(e) => setDeduction(e.target.value)}
                                    disabled={!canEdit || saving || recalculating}
                                />
                            </div>
                        </div>

                        <div className="emp-payroll-field-group">
                            <label htmlFor="adhoc-notes">Adjustment Remarks / Audit Note</label>
                            <textarea
                                id="adhoc-notes"
                                rows={2}
                                placeholder="State reason for manual adjustment (e.g. Festival advance, overtime incentive)..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={!canEdit || saving || recalculating}
                            />
                        </div>

                        {canEdit && (
                            <div className="emp-payroll-adj-actions">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={saving || recalculating}
                                    loading={saving}
                                >
                                    <Save size={15} />
                                    {saving ? "Saving..." : "Save Adjustments"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleRecalculate}
                                    disabled={saving || recalculating}
                                    loading={recalculating}
                                >
                                    <RefreshCw size={15} />
                                    {recalculating ? "Recalculating..." : "Recalculate Draft"}
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </Drawer>
    );
}
