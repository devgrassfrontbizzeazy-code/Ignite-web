
import { useState } from "react";
import {
    CalendarDays,
    Wallet,
    ReceiptText,
    Save,
    RotateCcw,
    Info,
    CheckCircle2,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import Button from "../../../components/common/Button/Button";
import PayrollWorkflowNav from "../../../components/account/PayrollWorkflowNav";
import "./PayrollSettings.css";

const STORAGE_KEY = "ignite_payroll_settings";

const DEFAULT_SETTINGS = {
    payrollCycle: "Monthly",
    payrollDay: "1",
    financialYear: "April–March",
    currency: "INR",
    currencyDisplay: "Symbol",
    basicIncluded: true,
    hraIncluded: true,
    allowancesIncluded: true,
    bonusIncluded: true,
    pfDeduction: true,
    insuranceDeduction: true,
    otherDeductions: true,
    payslipShowCompanyLogo: true,
    payslipShowEmployeeCode: true,
    payslipShowDepartment: true,
    payslipShowBankDetails: false,
    payslipFooter:
        "This is a system-generated payslip and does not require a signature.",
};

const COMPONENTS = [
    {
        key: "basicIncluded",
        label: "Basic Salary",
        description: "Base salary component",
        type: "Earning",
    },
    {
        key: "hraIncluded",
        label: "House Rent Allowance",
        description: "HRA component",
        type: "Earning",
    },
    {
        key: "allowancesIncluded",
        label: "Other Allowances",
        description: "Additional salary allowances",
        type: "Earning",
    },
    {
        key: "bonusIncluded",
        label: "Bonus",
        description: "Bonus and incentive earnings",
        type: "Earning",
    },
    {
        key: "pfDeduction",
        label: "Provident Fund (PF)",
        description: "Include PF in total deductions",
        type: "Deduction",
    },
    {
        key: "insuranceDeduction",
        label: "Insurance",
        description: "Include insurance in total deductions",
        type: "Deduction",
    },
    {
        key: "otherDeductions",
        label: "Other Deductions",
        description: "Additional employee deductions",
        type: "Deduction",
    },
];

function readSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored
            ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
            : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

function Toggle({ checked, onChange, label }) {
    return (
        <button
            type="button"
            className={`settings-toggle ${checked ? "is-on" : ""}`}
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
        >
            <span />
        </button>
    );
}

export default function PayrollSettings() {
    const [settings, setSettings] = useState(readSettings);
    const [saved, setSaved] = useState(false);
    const [lastSaved, setLastSaved] = useState("");

    const updateSetting = (key, value) => {
        setSettings((current) => ({ ...current, [key]: value }));
        setSaved(false);
    };

    const handleSave = (event) => {
        event.preventDefault();

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            window.dispatchEvent(
                new CustomEvent("ignite:payroll-settings-updated", {
                    detail: settings,
                })
            );
            setSaved(true);
            setLastSaved(
                new Date().toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                })
            );
        } catch {
            setSaved(false);
            window.alert("Unable to save settings in this browser.");
        }
    };

    const handleReset = () => {
        const confirmed = window.confirm(
            "Reset all payroll settings to their default values?"
        );

        if (!confirmed) return;

        setSettings({ ...DEFAULT_SETTINGS });
        setSaved(false);
    };

    return (
        <div className="payroll-settings-page">
            <PageHeader
                eyebrow="ACCOUNT · PAYROLL"
                title="Payroll Settings"
                description="Configure payroll defaults, salary components, and payslip preferences."
                action={
                    <div className="payroll-settings-header-actions">
                        <Button
                            variant="secondary"
                            onClick={handleReset}
                        >
                            <RotateCcw size={16} />
                            Reset defaults
                        </Button>
                        <Button
                            type="submit"
                            form="payroll-settings-form"
                        >
                            <Save size={16} />
                            Save settings
                        </Button>
                    </div>
                }
            />

            <PayrollWorkflowNav />

            {saved && (
                <div className="payroll-settings-success" role="status">
                    <CheckCircle2 size={18} />
                    <div>
                        <strong>Settings saved successfully</strong>
                        <span>
                            Saved in this browser{lastSaved ? ` · ${lastSaved}` : ""}.
                        </span>
                    </div>
                </div>
            )}

            <div className="payroll-settings-notice">
                <Info size={19} />
                <p>
                    These are frontend settings stored in this browser. They do not
                    automatically change payroll calculations or backend records yet.
                </p>
            </div>

            <form id="payroll-settings-form" onSubmit={handleSave}>
                <section className="payroll-settings-card">
                    <div className="payroll-settings-card-heading">
                        <div className="payroll-settings-icon">
                            <CalendarDays size={20} />
                        </div>
                        <div>
                            <h2>Payroll cycle</h2>
                            <p>Set the default payroll period and financial year.</p>
                        </div>
                    </div>

                    <div className="payroll-settings-fields">
                        <div className="payroll-settings-field">
                            <label htmlFor="payrollCycle">Payroll frequency</label>
                            <select
                                id="payrollCycle"
                                value={settings.payrollCycle}
                                onChange={(e) =>
                                    updateSetting("payrollCycle", e.target.value)
                                }
                            >
                                <option value="Monthly">Monthly</option>
                            </select>
                            <small>Monthly payroll is currently supported.</small>
                        </div>

                        <div className="payroll-settings-field">
                            <label htmlFor="payrollDay">Default payroll day</label>
                            <select
                                id="payrollDay"
                                value={settings.payrollDay}
                                onChange={(e) =>
                                    updateSetting("payrollDay", e.target.value)
                                }
                            >
                                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                    <option key={day} value={String(day)}>
                                        {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of the month
                                    </option>
                                ))}
                            </select>
                            <small>A default preference for payroll processing.</small>
                        </div>

                        <div className="payroll-settings-field">
                            <label htmlFor="financialYear">Financial year</label>
                            <select
                                id="financialYear"
                                value={settings.financialYear}
                                onChange={(e) =>
                                    updateSetting("financialYear", e.target.value)
                                }
                            >
                                <option value="April–March">April – March</option>
                                <option value="January–December">January – December</option>
                            </select>
                        </div>

                        <div className="payroll-settings-field">
                            <label htmlFor="currency">Payroll currency</label>
                            <select
                                id="currency"
                                value={settings.currency}
                                onChange={(e) => updateSetting("currency", e.target.value)}
                            >
                                <option value="INR">INR – Indian Rupee (₹)</option>
                                <option value="USD">USD – US Dollar ($)</option>
                                <option value="GBP">GBP – British Pound (£)</option>
                                <option value="EUR">EUR – Euro (€)</option>
                            </select>
                            <small>
                                This preference does not convert existing salary amounts.
                            </small>
                        </div>
                    </div>
                </section>

                <section className="payroll-settings-card">
                    <div className="payroll-settings-card-heading">
                        <div className="payroll-settings-icon">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h2>Salary components</h2>
                            <p>
                                Choose which components are included in payroll summaries.
                            </p>
                        </div>
                    </div>

                    <div className="payroll-settings-component-list">
                        {COMPONENTS.map((component) => (
                            <div className="payroll-settings-component" key={component.key}>
                                <div className="payroll-settings-component-copy">
                                    <strong>{component.label}</strong>
                                    <span>{component.description}</span>
                                </div>
                                <span
                                    className={`payroll-settings-type ${component.type === "Earning"
                                            ? "type-earning"
                                            : "type-deduction"
                                        }`}
                                >
                                    {component.type}
                                </span>
                                <Toggle
                                    checked={Boolean(settings[component.key])}
                                    onChange={(value) =>
                                        updateSetting(component.key, value)
                                    }
                                    label={`Include ${component.label}`}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="payroll-settings-inline-note">
                        <Info size={16} />
                        <span>
                            Component switches currently save preferences only. The payroll
                            calculation and payslip pages must be connected to these settings
                            separately.
                        </span>
                    </div>
                </section>

                <section className="payroll-settings-card">
                    <div className="payroll-settings-card-heading">
                        <div className="payroll-settings-icon">
                            <ReceiptText size={20} />
                        </div>
                        <div>
                            <h2>Payslip preferences</h2>
                            <p>Choose the information displayed on generated payslips.</p>
                        </div>
                    </div>

                    <div className="payroll-settings-preferences">
                        {[
                            {
                                key: "payslipShowCompanyLogo",
                                label: "Company logo",
                                description: "Display the company logo on the payslip.",
                            },
                            {
                                key: "payslipShowEmployeeCode",
                                label: "Employee code",
                                description: "Show the employee's unique code.",
                            },
                            {
                                key: "payslipShowDepartment",
                                label: "Department",
                                description: "Show the employee's department.",
                            },
                            {
                                key: "payslipShowBankDetails",
                                label: "Bank details",
                                description: "Display bank details when available.",
                            },
                        ].map((item) => (
                            <div className="payroll-settings-preference" key={item.key}>
                                <div>
                                    <strong>{item.label}</strong>
                                    <span>{item.description}</span>
                                </div>
                                <Toggle
                                    checked={Boolean(settings[item.key])}
                                    onChange={(value) => updateSetting(item.key, value)}
                                    label={item.label}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="payroll-settings-field payroll-settings-footer-field">
                        <label htmlFor="payslipFooter">Payslip footer message</label>
                        <textarea
                            id="payslipFooter"
                            rows={3}
                            maxLength={300}
                            value={settings.payslipFooter}
                            onChange={(e) =>
                                updateSetting("payslipFooter", e.target.value)
                            }
                            placeholder="Enter the message shown at the bottom of a payslip"
                        />
                        <small>{settings.payslipFooter.length}/300 characters</small>
                    </div>
                </section>

                <div className="payroll-settings-bottom-actions">
                    <span>Remember to save your changes before leaving this page.</span>
                    <Button type="submit">
                        <Save size={16} />
                        Save settings
                    </Button>
                </div>
            </form>
        </div>
    );
}
