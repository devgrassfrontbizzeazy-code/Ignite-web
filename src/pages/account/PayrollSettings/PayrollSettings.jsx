import { useState, useEffect, useCallback } from "react";
import {
    CalendarDays,
    Wallet,
    Save,
    RotateCcw,
    CheckCircle2,
    Plus,
    Pencil,
    Search,
    X,
    Power,
    AlertCircle,
    RefreshCw,
    Trash2,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import Button from "../../../components/common/Button/Button";
import PayrollWorkflowNav from "../../../components/account/PayrollWorkflowNav";
import { useNotification } from "../../../context/NotificationContext";
import {
    getPayrollSettings,
    createPayrollSettings,
    patchPayrollSettings,
    getSalaryComponents,
    createSalaryComponent,
    patchSalaryComponent,
    deleteSalaryComponent,
    unwrapList,
} from "../../../services/api/accountAPI";
import "./PayrollSettings.css";

const DEFAULT_SETTINGS = {
    payrollCycle: "Monthly",
    payrollDay: "28",
    financialYear: "April–March",
    currency: "INR",
};

const mapTypeToBackend = (type) => {
    switch (type) {
        case "earning":
            return "EARNING";
        case "employee_deduction":
            return "DEDUCTION";
        case "employer_contribution":
            return "EMPLOYER_CONTRIBUTION";
        default:
            return "EARNING";
    }
};

const mapTypeFromBackend = (type) => {
    const norm = String(type || "").toUpperCase();
    if (norm === "EARNING") return "earning";
    if (norm === "DEDUCTION") return "employee_deduction";
    if (norm === "EMPLOYER_CONTRIBUTION") return "employer_contribution";
    return "earning";
};

const mapMethodToBackend = (method) => {
    switch (method) {
        case "fixed":
            return "FIXED";
        case "percentage":
            return "PERCENTAGE";
        case "per_day":
            return "PER_DAY";
        case "slab_based":
            return "SLAB";
        case "manual":
            return "MANUAL";
        default:
            return "FIXED";
    }
};

const mapMethodFromBackend = (method) => {
    const norm = String(method || "").toUpperCase();
    if (norm === "FIXED") return "fixed";
    if (norm === "PERCENTAGE") return "percentage";
    if (norm === "PER_DAY") return "per_day";
    if (norm === "SLAB") return "slab_based";
    if (norm === "MANUAL") return "manual";
    return "fixed";
};

const normalizeComponent = (item) => ({
    id: item.id,
    name: item.name || "",
    code: item.code || "",
    type: mapTypeFromBackend(item.component_type),
    calculationMethod: mapMethodFromBackend(item.calculation_method),
    calculationBasis: item.calculation_config?.salaryBasis || item.calculationBasis || "basic",
    value: item.default_value != null ? Number(item.default_value) : item.value || 0,
    calculationConfig: item.calculation_config || {},
    includeInGross: item.include_in_gross ?? true,
    includeInCtc: item.include_in_ctc ?? true,
    effectiveFrom: item.effective_from || "",
    effectiveTo: item.effective_to || "",
    active: item.is_active ?? true,
});

const EMPTY_COMPONENT_FORM = {
    name: "",
    code: "",
    type: "earning",
    calculationMethod: "fixed",
    calculationBasis: "basic",
    value: "0",
    calculationConfig: {
        salaryBasis: "basic",
        daysSource: "unpaid_leave_days",
        slabs: [],
    },
    includeInGross: true,
    includeInCtc: true,
    effectiveFrom: "",
    effectiveTo: "",
    active: true,
};

export default function PayrollSettings() {
    const { showNotification } = useNotification();
    const notify = (type, message) => showNotification({ type, message });

    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsError, setSettingsError] = useState("");
    const [saved, setSaved] = useState(false);
    const [lastSaved, setLastSaved] = useState("");

    const [components, setComponents] = useState([]);
    const [componentsLoading, setComponentsLoading] = useState(true);
    const [componentsError, setComponentsError] = useState("");

    const [componentModalOpen, setComponentModalOpen] = useState(false);
    const [editingComponentId, setEditingComponentId] = useState(null);
    const [componentForm, setComponentForm] = useState(EMPTY_COMPONENT_FORM);
    const [componentSearch, setComponentSearch] = useState("");
    const [componentTypeFilter, setComponentTypeFilter] = useState("all");
    const [componentError, setComponentError] = useState("");
    const [componentSaving, setComponentSaving] = useState(false);
    const [deletingComponentId, setDeletingComponentId] = useState(null);

    // Fetch payroll settings from backend
    const loadSettings = useCallback(async () => {
        setSettingsLoading(true);
        setSettingsError("");
        try {
            const response = await getPayrollSettings();
            const data = response?.data ?? response;
            if (data) {
                setSettings({
                    payrollCycle: data.payroll_cycle || "Monthly",
                    payrollDay: data.payroll_day != null ? String(data.payroll_day) : "28",
                    financialYear: data.financial_year || "April–March",
                    currency: data.currency || "INR",
                });
            } else {
                setSettings({ ...DEFAULT_SETTINGS });
            }
        } catch (error) {
            console.error("Failed to load payroll settings from API:", error);
            if (error?.response?.status !== 404) {
                setSettingsError("Could not load payroll settings from the server.");
            }
        } finally {
            setSettingsLoading(false);
        }
    }, []);

    // Fetch salary components from backend
    const loadComponents = useCallback(async () => {
        setComponentsLoading(true);
        setComponentsError("");
        try {
            const response = await getSalaryComponents();
            const list = unwrapList(response);
            setComponents(list.map(normalizeComponent));
        } catch (error) {
            console.error("Failed to load salary components from API:", error);
            setComponentsError("Could not fetch salary components from server.");
            setComponents([]);
        } finally {
            setComponentsLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(() =>
            Promise.all([loadSettings(), loadComponents()])
        );
    }, [loadSettings, loadComponents]);

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

    const saveComponent = async (event) => {
        event.preventDefault();
        const name = componentForm.name.trim();
        const value = Number(componentForm.value);

        if (!name) {
            setComponentError("Component name is required.");
            return;
        }

        if (!Number.isFinite(value) || value < 0) {
            setComponentError("Enter a valid, non-negative amount or percentage.");
            return;
        }

        if (componentForm.calculationMethod === "percentage" && value > 100) {
            setComponentError("Percentage cannot exceed 100.");
            return;
        }

        if (
            componentForm.effectiveFrom &&
            componentForm.effectiveTo &&
            componentForm.effectiveTo < componentForm.effectiveFrom
        ) {
            setComponentError("The end date cannot be earlier than the start date.");
            return;
        }

        const generatedCode =
            componentForm.code?.trim() ||
            name
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "_")
                .slice(0, 50);

        const payload = {
            name,
            code: generatedCode,
            component_type: mapTypeToBackend(componentForm.type),
            calculation_method: mapMethodToBackend(componentForm.calculationMethod),
            default_value: String(value),
            include_in_gross: componentForm.includeInGross,
            include_in_ctc: componentForm.includeInCtc,
            is_active: componentForm.active,
            effective_from: componentForm.effectiveFrom || null,
            effective_to: componentForm.effectiveTo || null,
            calculation_config: {
                salaryBasis: componentForm.calculationBasis || "basic",
                ...(componentForm.calculationConfig || {}),
            },
        };

        setComponentSaving(true);
        setComponentError("");

        try {
            if (editingComponentId !== null && editingComponentId !== undefined) {
                const res = await patchSalaryComponent(editingComponentId, payload);
                const updated = normalizeComponent(res?.data || res);
                setComponents((curr) =>
                    curr.map((c) => (c.id === editingComponentId ? updated : c))
                );
            } else {
                const res = await createSalaryComponent(payload);
                const created = normalizeComponent(res?.data || res);
                setComponents((curr) => [
                    ...curr.filter((c) => c.id !== editingComponentId),
                    created,
                ]);
            }
            closeComponentModal();
            notify("success", editingComponentId !== null
                ? "Salary component updated."
                : "Salary component created.");
            await loadComponents();
        } catch (error) {
            console.error("Failed to save salary component:", error);
            const msg =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                (error?.response?.data
                    ? Object.entries(error.response.data)
                          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
                          .join("; ")
                    : null) ||
                "Unable to save salary component to backend.";
            setComponentError(msg);
        } finally {
            setComponentSaving(false);
        }
    };

    const toggleComponentStatus = async (componentId) => {
        const target = components.find((c) => c.id === componentId);
        if (!target) return;

        const nextActive = !target.active;

        try {
            await patchSalaryComponent(componentId, { is_active: nextActive });
            notify("success", "Salary component status updated.");
            await loadComponents();
        } catch (err) {
            console.error("Failed to toggle component status:", err);
            setComponentsError("Unable to update component status on server.");
        }
    };

    const removeComponent = async (component) => {
        if (!window.confirm(`Delete the ${component.name} salary component?`)) return;
        setDeletingComponentId(component.id);
        try {
            await deleteSalaryComponent(component.id);
            notify("success", "Salary component deleted.");
            await loadComponents();
        } catch (error) {
            console.error("Failed to delete salary component:", error);
            setComponentsError(
                error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    "Unable to delete salary component."
            );
        } finally {
            setDeletingComponentId(null);
        }
    };

    const filteredComponents = components.filter((component) => {
        const query = componentSearch.trim().toLowerCase();
        const matchesSearch = !query || component.name.toLowerCase().includes(query);
        const matchesType =
            componentTypeFilter === "all" || component.type === componentTypeFilter;
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

    const handleSave = async (event) => {
        event.preventDefault();
        setSettingsSaving(true);
        setSettingsError("");

        const payload = {
            payroll_cycle: settings.payrollCycle,
            payroll_day: Number(settings.payrollDay) || 28,
            financial_year: settings.financialYear,
            currency: settings.currency,
        };

        try {
            try {
                await patchPayrollSettings(payload);
            } catch (err) {
                if (err?.response?.status === 404) {
                    await createPayrollSettings(payload);
                } else {
                    throw err;
                }
            }

            setSaved(true);
            notify("success", "Payroll settings saved.");
            setLastSaved(
                new Date().toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                })
            );
        } catch (error) {
            console.error("Failed to save payroll settings:", error);
            setSaved(false);
            const msg =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Failed to save payroll settings to backend.";
            setSettingsError(msg);
        } finally {
            setSettingsSaving(false);
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
                            disabled={settingsSaving}
                        >
                            <RotateCcw size={16} />
                            Reset defaults
                        </Button>
                        <Button
                            type="submit"
                            form="payroll-settings-form"
                            loading={settingsSaving}
                            disabled={settingsLoading || settingsSaving}
                        >
                            <Save size={16} />
                            {settingsSaving ? "Saving..." : "Save settings"}
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
                            Saved to backend database{lastSaved ? ` · ${lastSaved}` : ""}.
                        </span>
                    </div>
                </div>
            )}

            {settingsError && (
                <div className="payroll-settings-error-banner" role="alert" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.875rem 1rem",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    marginBottom: "1.25rem",
                }}>
                    <AlertCircle size={18} />
                    <span>{settingsError}</span>
                </div>
            )}

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

                    {settingsLoading ? (
                        <p style={{ padding: "1rem", color: "var(--text-muted, #64748b)" }}>
                            Loading settings...
                        </p>
                    ) : (
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
                                    <option value="Bi-weekly">Bi-weekly</option>
                                    <option value="Weekly">Weekly</option>
                                </select>
                                <small>Configured payroll processing frequency.</small>
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
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                        <option key={day} value={String(day)}>
                                            {day}
                                            {day === 1
                                                ? "st"
                                                : day === 2
                                                ? "nd"
                                                : day === 3
                                                ? "rd"
                                                : "th"}{" "}
                                            of the month
                                        </option>
                                    ))}
                                </select>
                                <small>Default day of month for payroll processing.</small>
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
                                    <option value="AED">AED – UAE Dirham (AED)</option>
                                </select>
                                <small>Company default payroll currency.</small>
                            </div>
                        </div>
                    )}
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
                                components available for salary structures and payroll.
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
                                placeholder="Search components by name"
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

                    {componentsError && (
                        <div style={{
                            padding: "0.75rem 1rem",
                            margin: "0 1rem 1rem",
                            borderRadius: "6px",
                            background: "rgba(239, 68, 68, 0.08)",
                            color: "#ef4444",
                            fontSize: "0.875rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <span>{componentsError}</span>
                            <button
                                type="button"
                                onClick={loadComponents}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                }}
                            >
                                <RefreshCw size={14} /> Retry
                            </button>
                        </div>
                    )}

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
                                {componentsLoading ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                                            <p style={{ color: "var(--text-muted, #64748b)" }}>Loading components from server...</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredComponents.map((component) => (
                                        <tr key={component.id || component.code}>
                                            <td>
                                                <div className="salary-component-name">
                                                    <strong>{component.name}</strong>
                                                    {component.code && (
                                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)", marginLeft: "0.5rem" }}>
                                                            ({component.code})
                                                        </span>
                                                    )}
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
                                                        {{
                                                            fixed: `Fixed (₹${Number(component.value || 0).toLocaleString("en-IN")})`,
                                                            percentage: `${component.value}%`,
                                                            per_day: "Per-day calculation",
                                                            slab_based: "Slab-based",
                                                            manual: "Manual / variable",
                                                        }[component.calculationMethod] || "Custom calculation"}
                                                    </strong>

                                                    {component.calculationMethod === "percentage" && (
                                                        <span>
                                                            of{" "}
                                                            {{
                                                                basic: "Basic salary",
                                                                gross: "Gross earnings",
                                                                ctc: "Monthly CTC",
                                                            }[component.calculationBasis] || "Selected basis"}
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
                                                    className={`salary-component-status ${
                                                        component.active ? "is-active" : "is-inactive"
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
                                                        aria-label={`${
                                                            component.active ? "Deactivate" : "Activate"
                                                        } ${component.name}`}
                                                        title={
                                                            component.active
                                                                ? "Deactivate component"
                                                                : "Activate component"
                                                        }
                                                    >
                                                        <Power size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeComponent(component)}
                                                        disabled={deletingComponentId === component.id}
                                                        aria-label={`Delete ${component.name}`}
                                                        title="Delete component"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {!componentsLoading && filteredComponents.length === 0 && (
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
                </section>

                <div className="payroll-settings-bottom-actions">
                    <span className="payroll-settings-hint">
                        Remember to save your changes before leaving this page.
                    </span>

                    <Button
                        type="submit"
                        form="payroll-settings-form"
                        variant="primary"
                        loading={settingsSaving}
                        disabled={settingsLoading || settingsSaving}
                        className="payroll-settings-save-btn"
                    >
                        <Save size={16} strokeWidth={2} />
                        <span>{settingsSaving ? "Saving..." : "Save settings"}</span>
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
                                    templates and structures.
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
                                        Component code
                                    </label>
                                    <input
                                        id="componentCode"
                                        value={componentForm.code}
                                        onChange={(event) =>
                                            updateComponentField("code", event.target.value.toUpperCase())
                                        }
                                        placeholder="e.g. TRAVEL_ALLOW"
                                        maxLength={50}
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
                                        onChange={(event) => {
                                            const method = event.target.value;
                                            updateComponentField("calculationMethod", method);

                                            if (method === "fixed" || method === "manual") {
                                                updateComponentField("calculationBasis", "");
                                            } else if (
                                                method === "percentage" &&
                                                !componentForm.calculationBasis
                                            ) {
                                                updateComponentField("calculationBasis", "basic");
                                            }
                                        }}
                                    >
                                        <option value="fixed">Fixed amount</option>
                                        <option value="percentage">Percentage</option>
                                        <option value="per_day">Per-day calculation</option>
                                        <option value="slab_based">Slab-based</option>
                                        <option value="manual">Manual / variable</option>
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
                                            ? "Default percentage (%)"
                                            : "Default amount (₹)"}
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
                                    disabled={componentSaving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="salary-component-save-btn"
                                    disabled={componentSaving}
                                >
                                    {componentSaving
                                        ? "Saving..."
                                        : editingComponentId
                                        ? "Save changes"
                                        : "Add component"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
