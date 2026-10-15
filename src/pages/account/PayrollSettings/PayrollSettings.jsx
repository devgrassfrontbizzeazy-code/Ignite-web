import { useState } from "react";
import {
    CalendarDays,
    Wallet,
    Save,
    RotateCcw,
    Info,
    CheckCircle2,
    Plus,
    Pencil,
    Search,
    X,
    Power,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import Button from "../../../components/common/Button/Button";
import PayrollWorkflowNav from "../../../components/account/PayrollWorkflowNav";
import "./PayrollSettings.css";

const COMPONENTS_STORAGE_KEY = "ignite_salary_components";

const STORAGE_KEY = "ignite_payroll_settings";

const DEFAULT_SETTINGS = {
    payrollCycle: "Monthly",
    payrollDay: "28",
    financialYear: "April–March",
    currency: "INR",
};


const DEFAULT_COMPONENTS = [
    {
        id: "basic-salary",
        name: "Basic Salary",
        code: "BASIC",
        type: "earning",
        calculationMethod: "fixed",
        calculationBasis: "basic",
        value: 0,
        includeInGross: true,
        includeInCtc: true,
        effectiveFrom: "",
        effectiveTo: "",
        active: true,
    },
    {
        id: "hra",
        name: "House Rent Allowance",
        code: "HRA",
        type: "earning",
        calculationMethod: "percentage",
        calculationBasis: "basic",
        value: 0,
        includeInGross: true,
        includeInCtc: true,
        effectiveFrom: "",
        effectiveTo: "",
        active: true,
    },
    {
        id: "other-allowances",
        name: "Other Allowances",
        code: "ALLOWANCE",
        type: "earning",
        calculationMethod: "fixed",
        calculationBasis: "basic",
        value: 0,
        includeInGross: true,
        includeInCtc: true,
        effectiveFrom: "",
        effectiveTo: "",
        active: true,
    },
    {
        id: "bonus",
        name: "Bonus",
        code: "BONUS",
        type: "earning",
        calculationMethod: "fixed",
        calculationBasis: "basic",
        value: 0,
        includeInGross: true,
        includeInCtc: true,
        effectiveFrom: "",
        effectiveTo: "",
        active: true,
    },
    {
        id: "pf",
        name: "Provident Fund",
        code: "PF",
        type: "employee_deduction",
        calculationMethod: "percentage",
        calculationBasis: "basic",
        value: 0,
        includeInGross: false,
        includeInCtc: false,
        effectiveFrom: "",
        effectiveTo: "",
        active: true,
    },
    {
        id: "insurance",
        name: "Insurance",
        code: "INSURANCE",
        type: "employee_deduction",
        calculationMethod: "fixed",
        calculationBasis: "basic",
        value: 0,
        includeInGross: false,
        includeInCtc: false,
        effectiveFrom: "",
        effectiveTo: "",
        active: true,
    },
    {
        id: "other-deductions",
        name: "Other Deductions",
        code: "OTHER_DEDUCTION",
        type: "employee_deduction",
        calculationMethod: "fixed",
        calculationBasis: "basic",
        value: 0,
        includeInGross: false,
        includeInCtc: false,
        effectiveFrom: "",
        effectiveTo: "",
        active: true,
    },
];

function readSalaryComponents() {
    try {
        const stored = localStorage.getItem(COMPONENTS_STORAGE_KEY);

        if (!stored) {
            return DEFAULT_COMPONENTS;
        }

        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : DEFAULT_COMPONENTS;
    } catch {
        return DEFAULT_COMPONENTS;
    }
}

const EMPTY_COMPONENT_FORM = {
    name: "",
    code: "",
    type: "earning",
    calculationMethod: "fixed",
    calculationBasis: "basic",
    value: "0",
    includeInGross: true,
    includeInCtc: true,
    effectiveFrom: "",
    effectiveTo: "",
    active: true,
};

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

export default function PayrollSettings() {
    const [settings, setSettings] = useState(readSettings);
    const [saved, setSaved] = useState(false);
    const [lastSaved, setLastSaved] = useState("");
    const [components, setComponents] = useState(readSalaryComponents);
    const [componentModalOpen, setComponentModalOpen] = useState(false);
    const [editingComponentId, setEditingComponentId] = useState(null);
    const [componentForm, setComponentForm] = useState(EMPTY_COMPONENT_FORM);
    const [componentSearch, setComponentSearch] = useState("");
    const [componentTypeFilter, setComponentTypeFilter] = useState("all");
    const [componentError, setComponentError] = useState("");
    const openComponentModal = (component = null) => {
        setComponentError("");

        if (component) {
            setEditingComponentId(component.id);
            setComponentForm({
                ...EMPTY_COMPONENT_FORM,
                ...component,
                value: String(component.value ?? 0),
            });
        } else {
            setEditingComponentId(null);
            setComponentForm({ ...EMPTY_COMPONENT_FORM });
        }

        setComponentModalOpen(true);
    };

    const closeComponentModal = () => {
        setComponentModalOpen(false);
        setEditingComponentId(null);
        setComponentForm({ ...EMPTY_COMPONENT_FORM });
        setComponentError("");
    };

    const updateComponentField = (field, value) => {
        setComponentForm((current) => ({
            ...current,
            [field]: value,
        }));

        setComponentError("");
    };

    const saveComponent = (event) => {
        event.preventDefault();

        const name = componentForm.name.trim();
        const code = componentForm.code.trim().toUpperCase();
        const value = Number(componentForm.value);

        if (!name || !code) {
            setComponentError("Component name and code are required.");
            return;
        }

        if (!/^[A-Z0-9_-]+$/.test(code)) {
            setComponentError(
                "Use only letters, numbers, underscores or hyphens in the code."
            );
            return;
        }

        if (!Number.isFinite(value) || value < 0) {
            setComponentError("Enter a valid, non-negative amount or percentage.");
            return;
        }

        if (
            componentForm.calculationMethod === "percentage" &&
            value > 100
        ) {
            setComponentError("Percentage cannot exceed 100.");
            return;
        }

        if (
            componentForm.effectiveFrom &&
            componentForm.effectiveTo &&
            componentForm.effectiveTo < componentForm.effectiveFrom
        ) {
            setComponentError(
                "The end date cannot be earlier than the start date."
            );
            return;
        }

        const duplicateCode = components.some(
            (component) =>
                component.code.toUpperCase() === code &&
                component.id !== editingComponentId
        );

        if (duplicateCode) {
            setComponentError("This component code already exists.");
            return;
        }

        const nextComponent = {
            ...componentForm,
            id: editingComponentId || `component-${Date.now()}`,
            name,
            code,
            value,
        };

        const nextComponents = editingComponentId
            ? components.map((component) =>
                component.id === editingComponentId
                    ? nextComponent
                    : component
            )
            : [...components, nextComponent];

        try {
            localStorage.setItem(
                COMPONENTS_STORAGE_KEY,
                JSON.stringify(nextComponents)
            );

            setComponents(nextComponents);
            window.dispatchEvent(
                new CustomEvent("ignite:salary-components-updated", {
                    detail: nextComponents,
                })
            );

            closeComponentModal();
        } catch {
            setComponentError("Unable to save components in this browser.");
        }
    };

    const toggleComponentStatus = (componentId) => {
        const nextComponents = components.map((component) =>
            component.id === componentId
                ? { ...component, active: !component.active }
                : component
        );

        try {
            localStorage.setItem(
                COMPONENTS_STORAGE_KEY,
                JSON.stringify(nextComponents)
            );

            setComponents(nextComponents);
            window.dispatchEvent(
                new CustomEvent("ignite:salary-components-updated", {
                    detail: nextComponents,
                })
            );
        } catch {
            window.alert("Unable to update the component status.");
        }
    };

    const filteredComponents = components.filter((component) => {
        const query = componentSearch.trim().toLowerCase();

        const matchesSearch =
            !query ||
            component.name.toLowerCase().includes(query) ||
            component.code.toLowerCase().includes(query);

        const matchesType =
            componentTypeFilter === "all" ||
            component.type === componentTypeFilter;

        return matchesSearch && matchesType;
    });

    const componentTypeLabel = (type) =>
        ({
            earning: "Earning",
            employee_deduction: "Employee deduction",
            employer_contribution: "Employer contribution",
        })[type] || type;

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
                eyebrow="ACCOUNT"
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

                <section className="payroll-settings-card salary-components-card">
                    <div className="payroll-settings-card-heading salary-components-heading">
                        <div className="payroll-settings-icon">
                            <Wallet size={20} />
                        </div>

                        <div>
                            <h2>Salary components</h2>
                            <p>
                                Manage the earning, deduction and employer contribution
                                components available for salary templates.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="salary-component-add-btn"
                            onClick={() => openComponentModal()}
                        >
                            <Plus size={17} />
                            Add component
                        </button>
                    </div>

                    <div className="salary-components-toolbar">
                        <div className="salary-components-search">
                            <Search size={17} />
                            <input
                                type="search"
                                value={componentSearch}
                                onChange={(event) =>
                                    setComponentSearch(event.target.value)
                                }
                                placeholder="Search by name or code"
                                aria-label="Search salary components"
                            />
                        </div>

                        <select
                            value={componentTypeFilter}
                            onChange={(event) =>
                                setComponentTypeFilter(event.target.value)
                            }
                            aria-label="Filter salary components by type"
                        >
                            <option value="all">All types</option>
                            <option value="earning">Earnings</option>
                            <option value="employee_deduction">
                                Employee deductions
                            </option>
                            <option value="employer_contribution">
                                Employer contributions
                            </option>
                        </select>
                    </div>

                    <div className="salary-components-table-wrap">
                        <table className="salary-components-table">
                            <thead>
                                <tr>
                                    <th>Component</th>
                                    <th>Type</th>
                                    <th>Calculation</th>
                                    <th>Gross / CTC</th>
                                    <th>Status</th>
                                    <th className="salary-components-actions-heading">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredComponents.map((component) => (
                                    <tr key={component.id}>
                                        <td>
                                            <div className="salary-component-name">
                                                <strong>{component.name}</strong>
                                                <span>{component.code}</span>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`salary-component-type salary-component-type--${component.type}`}
                                            >
                                                {componentTypeLabel(component.type)}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="salary-component-calculation">
                                                <strong>
                                                    {component.calculationMethod === "percentage"
                                                        ? `${component.value}%`
                                                        : "Fixed amount"}
                                                </strong>

                                                {component.calculationMethod === "percentage" && (
                                                    <span>
                                                        of{" "}
                                                        {
                                                            {
                                                                basic: "Basic salary",
                                                                gross: "Gross earnings",
                                                                ctc: "Monthly CTC",
                                                            }[component.calculationBasis]
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <span>
                                                Gross: {component.includeInGross ? "Yes" : "No"}
                                            </span>
                                            <span className="salary-component-secondary-line">
                                                CTC: {component.includeInCtc ? "Yes" : "No"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`salary-component-status ${component.active ? "is-active" : "is-inactive"
                                                    }`}
                                            >
                                                {component.active ? "Active" : "Inactive"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="salary-component-row-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => openComponentModal(component)}
                                                    aria-label={`Edit ${component.name}`}
                                                    title="Edit component"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleComponentStatus(component.id)
                                                    }
                                                    aria-label={`${component.active ? "Deactivate" : "Activate"
                                                        } ${component.name}`}
                                                    title={
                                                        component.active
                                                            ? "Deactivate component"
                                                            : "Activate component"
                                                    }
                                                >
                                                    <Power size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredComponents.length === 0 && (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="salary-components-empty">
                                                <Wallet size={25} />
                                                <strong>No components found</strong>
                                                <span>
                                                    Try another search or add a salary component.
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="payroll-settings-inline-note">
                        <Info size={16} />
                        <span>
                            This catalogue is currently stored in this browser. Changes will
                            not update existing salary templates or payroll calculations until
                            those features are connected.
                        </span>
                    </div>
                </section>




                <div className="payroll-settings-bottom-actions">
                    <span className="payroll-settings-hint">
                        Remember to save your changes before leaving this page.
                    </span>

                    <Button
                        type="submit"
                        form="payroll-settings-form"
                        variant="primary"
                        className="payroll-settings-save-btn"
                    >
                        <Save size={16} strokeWidth={2} />
                        <span>Save settings</span>
                    </Button>
                </div>

            </form>

            {componentModalOpen && (
                <div
                    className="salary-component-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeComponentModal();
                        }
                    }}
                >
                    <div
                        className="salary-component-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="salary-component-modal-title"
                    >
                        <div className="salary-component-modal-header">
                            <div>
                                <h2 id="salary-component-modal-title">
                                    {editingComponentId
                                        ? "Edit salary component"
                                        : "Add salary component"}
                                </h2>
                                <p>
                                    Configure how this component will be used in salary
                                    templates.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeComponentModal}
                                aria-label="Close component form"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={saveComponent}>
                            <div className="salary-component-form-grid">
                                <div className="payroll-settings-field">
                                    <label htmlFor="componentName">
                                        Component name *
                                    </label>
                                    <input
                                        id="componentName"
                                        value={componentForm.name}
                                        onChange={(event) =>
                                            updateComponentField("name", event.target.value)
                                        }
                                        placeholder="e.g. Travel Allowance"
                                        maxLength={100}
                                        required
                                    />
                                </div>

                                <div className="payroll-settings-field">
                                    <label htmlFor="componentCode">
                                        Component code *
                                    </label>
                                    <input
                                        id="componentCode"
                                        value={componentForm.code}
                                        onChange={(event) =>
                                            updateComponentField(
                                                "code",
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        placeholder="e.g. TRAVEL"
                                        maxLength={30}
                                        required
                                    />
                                </div>

                                <div className="payroll-settings-field">
                                    <label htmlFor="componentType">Component type *</label>
                                    <select
                                        id="componentType"
                                        value={componentForm.type}
                                        onChange={(event) =>
                                            updateComponentField("type", event.target.value)
                                        }
                                    >
                                        <option value="earning">Earning</option>
                                        <option value="employee_deduction">
                                            Employee deduction
                                        </option>
                                        <option value="employer_contribution">
                                            Employer contribution
                                        </option>
                                    </select>
                                </div>

                                <div className="payroll-settings-field">
                                    <label htmlFor="calculationMethod">
                                        Calculation method *
                                    </label>
                                    <select
                                        id="calculationMethod"
                                        value={componentForm.calculationMethod}
                                        onChange={(event) =>
                                            updateComponentField(
                                                "calculationMethod",
                                                event.target.value
                                            )
                                        }
                                    >
                                        <option value="fixed">Fixed amount</option>
                                        <option value="percentage">Percentage</option>
                                    </select>
                                </div>

                                {componentForm.calculationMethod === "percentage" && (
                                    <div className="payroll-settings-field">
                                        <label htmlFor="calculationBasis">
                                            Calculate percentage of *
                                        </label>
                                        <select
                                            id="calculationBasis"
                                            value={componentForm.calculationBasis}
                                            onChange={(event) =>
                                                updateComponentField(
                                                    "calculationBasis",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="basic">Basic salary</option>
                                            <option value="gross">Gross earnings</option>
                                            <option value="ctc">Monthly CTC</option>
                                        </select>
                                    </div>
                                )}

                                <div className="payroll-settings-field">
                                    <label htmlFor="componentValue">
                                        {componentForm.calculationMethod === "percentage"
                                            ? "Default percentage"
                                            : "Default amount"}
                                    </label>
                                    <input
                                        id="componentValue"
                                        type="number"
                                        min="0"
                                        max={
                                            componentForm.calculationMethod === "percentage"
                                                ? "100"
                                                : undefined
                                        }
                                        step="0.01"
                                        value={componentForm.value}
                                        onChange={(event) =>
                                            updateComponentField("value", event.target.value)
                                        }
                                        required
                                    />
                                    <small>
                                        This is a default value. Template-specific values
                                        will be configured separately.
                                    </small>
                                </div>

                                <div className="payroll-settings-field">
                                    <label htmlFor="componentEffectiveFrom">
                                        Effective from
                                    </label>
                                    <input
                                        id="componentEffectiveFrom"
                                        type="date"
                                        value={componentForm.effectiveFrom}
                                        onChange={(event) =>
                                            updateComponentField(
                                                "effectiveFrom",
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="payroll-settings-field">
                                    <label htmlFor="componentEffectiveTo">
                                        Effective until
                                    </label>
                                    <input
                                        id="componentEffectiveTo"
                                        type="date"
                                        min={componentForm.effectiveFrom || undefined}
                                        value={componentForm.effectiveTo}
                                        onChange={(event) =>
                                            updateComponentField(
                                                "effectiveTo",
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="salary-component-checkboxes">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={componentForm.includeInGross}
                                        onChange={(event) =>
                                            updateComponentField(
                                                "includeInGross",
                                                event.target.checked
                                            )
                                        }
                                    />
                                    Include in gross earnings
                                </label>

                                <label>
                                    <input
                                        type="checkbox"
                                        checked={componentForm.includeInCtc}
                                        onChange={(event) =>
                                            updateComponentField(
                                                "includeInCtc",
                                                event.target.checked
                                            )
                                        }
                                    />
                                    Include in CTC
                                </label>

                                <label>
                                    <input
                                        type="checkbox"
                                        checked={componentForm.active}
                                        onChange={(event) =>
                                            updateComponentField(
                                                "active",
                                                event.target.checked
                                            )
                                        }
                                    />
                                    Active component
                                </label>
                            </div>

                            {componentError && (
                                <div className="salary-component-form-error" role="alert">
                                    {componentError}
                                </div>
                            )}

                            <div className="salary-component-modal-footer">
                                <button
                                    type="button"
                                    className="salary-component-cancel-btn"
                                    onClick={closeComponentModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="salary-component-save-btn"
                                >
                                    {editingComponentId ? "Save changes" : "Add component"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
