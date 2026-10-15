import { useEffect, useMemo, useRef, useState } from "react";
import {
    Plus,
    Search,
    Users,
    Wallet,
    BadgeCheck,
    CalendarClock,
    Pencil,
    X,
    IndianRupee,
    RefreshCw,
    Copy,
    Layers,
    Trash2,
    CheckSquare,
    Download,
    Upload,
    FileSpreadsheet,
} from "lucide-react";

import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import Drawer from "../../../components/common/Drawer/Drawer";
import FormField from "../../../components/common/FormField/FormField";
import Select from "../../../components/common/Select/Select";
import DatePicker from "../../../components/common/DatePicker/DatePicker";
import PayrollWorkflowNav from "../../../components/account/PayrollWorkflowNav";
import employeeService from "../../../services/employeeService";
import { useNotification } from "../../../context/NotificationContext";

import "./SalaryStructures.css";

const EMPTY_FORM = {
    employeeId: "",
    effectiveDate: "",
    basic: "",
    hra: "",
    otherAllowances: "",
    bonus: "",
    pf: "",
    insurance: "",
    otherDeductions: "",
};

const getLocalDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

const formatDate = (dateString) => {
    if (!dateString) return "—";

    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
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
    "Employee";

const getEmployeeDepartment = (employee) => {
    if (typeof employee?.department === "string") {
        return employee.department;
    }

    return (
        employee?.department?.name ||
        employee?.department_name ||
        employee?.department?.department_name ||
        "—"
    );
};

const getEmployeeCode = (employee) =>
    employee?.employee_code ||
    employee?.employee_id ||
    employee?.code ||
    `EMP-${employee?.id ?? "—"}`;

const toAmount = (value) => {
    if (value === "" || value === null || value === undefined) return 0;
    return Number(value);
};

const calculateSalary = (form) => {
    const basic = toAmount(form.basic);
    const hra = toAmount(form.hra);
    const otherAllowances = toAmount(form.otherAllowances);
    const bonus = toAmount(form.bonus);
    const pf = toAmount(form.pf);
    const insurance = toAmount(form.insurance);
    const otherDeductions = toAmount(form.otherDeductions);

    const totalAllowances = hra + otherAllowances + bonus;
    const gross = basic + totalAllowances;
    const totalDeductions = pf + insurance + otherDeductions;
    const net = gross - totalDeductions;

    return {
        basic,
        hra,
        otherAllowances,
        bonus,
        totalAllowances,
        gross,
        pf,
        insurance,
        otherDeductions,
        totalDeductions,
        net,
    };
};

const getStructureStatus = (effectiveDate) =>
    effectiveDate > getLocalDate() ? "Upcoming" : "Active";


const TEMPLATE_STORAGE_KEY = "ignite_salary_templates";
const STRUCTURE_STORAGE_KEY = "ignite_salary_structures";

const readLocalData = (key) => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

const EMPTY_TEMPLATE = {
    name: "",
    description: "",
    basic: "",
    hra: "",
    otherAllowances: "",
    bonus: "",
    pf: "",
    insurance: "",
    otherDeductions: "",
};

const CSV_IMPORT_HEADERS = [
    "employee_code",
    "effective_date",
    "basic",
    "hra",
    "other_allowances",
    "bonus",
    "pf",
    "insurance",
    "other_deductions",
];

const csvEscape = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
};

const downloadCSV = (filename, rows) => {
    const csv = rows
        .map((row) => row.map(csvEscape).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
};

const parseCSV = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];

        if (quoted) {
            if (char === '"' && text[i + 1] === '"') {
                field += '"';
                i += 1;
            } else if (char === '"') {
                quoted = false;
            } else {
                field += char;
            }
        } else if (char === '"' && field.length === 0) {
            quoted = true;
        } else if (char === ",") {
            row.push(field);
            field = "";
        } else if (char === "\n" || char === "\r") {
            if (char === "\r" && text[i + 1] === "\n") i += 1;

            row.push(field);

            if (row.some((cell) => cell.trim() !== "")) {
                rows.push(row);
            }

            row = [];
            field = "";
        } else {
            field += char;
        }
    }

    if (quoted) {
        throw new Error("The CSV contains an unclosed quoted field.");
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);

        if (row.some((cell) => cell.trim() !== "")) {
            rows.push(row);
        }
    }

    if (rows.length < 2) {
        throw new Error("The CSV must contain a header row and at least one data row.");
    }

    const headers = rows[0].map((header) =>
        header.trim().replace(/^\uFEFF/, "").toLowerCase()
    );

    const missingHeaders = CSV_IMPORT_HEADERS.filter(
        (header) => !headers.includes(header)
    );

    if (missingHeaders.length) {
        throw new Error(`Missing columns: ${missingHeaders.join(", ")}`);
    }

    return rows.slice(1).map((cells, index) => {
        const record = {};

        headers.forEach((header, headerIndex) => {
            record[header] = (cells[headerIndex] ?? "").trim();
        });

        return {
            rowNumber: index + 2,
            record,
        };
    });
};

const isValidISODate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
};



const SalaryStructures = () => {
    const { showNotification } = useNotification();

    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(true);
    const [employeesError, setEmployeesError] = useState(false);

    const [structures, setStructures] = useState(() =>
        readLocalData(STRUCTURE_STORAGE_KEY)
    );
    const [templates, setTemplates] = useState(() =>
        readLocalData(TEMPLATE_STORAGE_KEY)
    );

    const [activeTab, setActiveTab] = useState("structures");
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [bulkTemplateId, setBulkTemplateId] = useState("");
    const [bulkEffectiveDate, setBulkEffectiveDate] = useState(getLocalDate());
    const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [templateForm, setTemplateForm] = useState({ ...EMPTY_TEMPLATE });
    const [templateError, setTemplateError] = useState("");
    const [bulkError, setBulkError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const csvInputRef = useRef(null);
    const [csvPreview, setCsvPreview] = useState([]);
    const [csvErrors, setCsvErrors] = useState([]);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        ...EMPTY_FORM,
        effectiveDate: getLocalDate(),
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        localStorage.setItem(STRUCTURE_STORAGE_KEY, JSON.stringify(structures));
    }, [structures]);

    useEffect(() => {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
    }, [templates]);

    useEffect(() => {
        let mounted = true;

        const loadEmployees = async () => {
            setEmployeesLoading(true);

            try {
                const response = await employeeService.getAll();

                const employeeList = Array.isArray(response)
                    ? response
                    : Array.isArray(response?.results)
                        ? response.results
                        : Array.isArray(response?.data)
                            ? response.data
                            : [];

                if (mounted) {
                    setEmployees(employeeList);
                    setEmployeesError(false);
                }
            } catch (error) {
                console.error("Failed to load employees:", error);

                if (mounted) {
                    setEmployees([]);
                    setEmployeesError(true);
                    showNotification?.(
                        "error",
                        "Unable to load employees. Please try again."
                    );
                }
            } finally {
                if (mounted) setEmployeesLoading(false);
            }
        };

        loadEmployees();

        return () => {
            mounted = false;
        };
    }, [showNotification]);

    const employeeMap = useMemo(
        () => new Map(employees.map((employee) => [String(employee.id), employee])),
        [employees]
    );

    const employeeOptions = useMemo(
        () =>
            employees
                .filter(
                    (employee) =>
                        employee?.id !== undefined &&
                        employee?.id !== null &&
                        String(employee?.employment_status || "").toLowerCase() !== "inactive" &&
                        String(employee?.employment_status || "").toLowerCase() !== "terminated" &&
                        employee?.is_active !== false
                )
                .map((employee) => ({
                    value: String(employee.id),
                    label: `${getEmployeeName(employee)} (${getEmployeeCode(employee)})`,
                }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        [employees]
    );

    const visibleStructures = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return [...structures]
            .filter((structure) => {
                const employee = employeeMap.get(String(structure.employeeId));
                const name = getEmployeeName(employee).toLowerCase();
                const code = getEmployeeCode(employee).toLowerCase();
                const department = getEmployeeDepartment(employee).toLowerCase();

                const matchesSearch =
                    !normalizedSearch ||
                    name.includes(normalizedSearch) ||
                    code.includes(normalizedSearch) ||
                    department.includes(normalizedSearch);

                const matchesStatus =
                    statusFilter === "ALL" ||
                    getStructureStatus(structure.effectiveDate).toUpperCase() ===
                    statusFilter;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const dateComparison = b.effectiveDate.localeCompare(a.effectiveDate);

                if (dateComparison !== 0) return dateComparison;

                return getEmployeeName(
                    employeeMap.get(String(a.employeeId))
                ).localeCompare(
                    getEmployeeName(employeeMap.get(String(b.employeeId)))
                );
            });
    }, [structures, employeeMap, search, statusFilter]);

    const summary = useMemo(() => {
        const activeEmployeeIds = new Set();
        const upcomingEmployeeIds = new Set();
        let activeStructures = 0;

        structures.forEach((structure) => {
            if (getStructureStatus(structure.effectiveDate) === "Active") {
                activeStructures += 1;
                activeEmployeeIds.add(String(structure.employeeId));
            } else {
                upcomingEmployeeIds.add(String(structure.employeeId));
            }
        });

        return {
            total: structures.length,
            employeesCovered: activeEmployeeIds.size,
            active: activeStructures,
            upcoming: upcomingEmployeeIds.size,
        };
    }, [structures]);

    const salaryTotals = useMemo(
        () =>
            visibleStructures.reduce(
                (totals, structure) => {
                    const salary = calculateSalary(structure);

                    totals.gross += salary.gross;
                    totals.net += salary.net;

                    return totals;
                },
                { gross: 0, net: 0 }
            ),
        [visibleStructures]
    );

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));

        setErrors((current) => {
            if (!current[field] && !current.form) return current;

            const next = { ...current };
            delete next[field];
            delete next.form;
            return next;
        });
    };

    const openCreateDrawer = () => {
        setEditingId(null);
        setForm({
            ...EMPTY_FORM,
            effectiveDate: getLocalDate(),
        });
        setErrors({});
        setDrawerOpen(true);
    };

    const openEditDrawer = (structure) => {
        setEditingId(structure.id);

        setForm({
            employeeId: String(structure.employeeId),
            effectiveDate: structure.effectiveDate,
            basic: String(structure.basic ?? ""),
            hra: String(structure.hra ?? ""),
            otherAllowances: String(structure.otherAllowances ?? ""),
            bonus: String(structure.bonus ?? ""),
            pf: String(structure.pf ?? ""),
            insurance: String(structure.insurance ?? ""),
            otherDeductions: String(structure.otherDeductions ?? ""),
        });

        setErrors({});
        setDrawerOpen(true);
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!form.employeeId) {
            nextErrors.employeeId = "Please select an employee.";
        }

        if (!form.effectiveDate) {
            nextErrors.effectiveDate = "Please select an effective date.";
        }

        const amountFields = [
            ["basic", "Basic salary"],
            ["hra", "HRA"],
            ["otherAllowances", "Other allowances"],
            ["bonus", "Bonus / other earnings"],
            ["pf", "PF deduction"],
            ["insurance", "Insurance deduction"],
            ["otherDeductions", "Other deductions"],
        ];

        amountFields.forEach(([field, label]) => {
            const value = form[field];

            if (value === "" || value === null || value === undefined) {
                if (field === "basic") {
                    nextErrors[field] = `${label} is required.`;
                }
                return;
            }

            if (!Number.isFinite(Number(value)) || Number(value) < 0) {
                nextErrors[field] = `${label} must be a valid non-negative amount.`;
            }
        });

        if (
            form.basic !== "" &&
            Number.isFinite(Number(form.basic)) &&
            Number(form.basic) <= 0
        ) {
            nextErrors.basic = "Basic salary must be greater than zero.";
        }

        const salary = calculateSalary(form);

        if (
            Number.isFinite(salary.gross) &&
            Number.isFinite(salary.totalDeductions) &&
            salary.totalDeductions > salary.gross
        ) {
            nextErrors.otherDeductions =
                "Total deductions cannot exceed gross salary.";
        }

        const duplicate = structures.some(
            (structure) =>
                String(structure.employeeId) === String(form.employeeId) &&
                structure.effectiveDate === form.effectiveDate &&
                structure.id !== editingId
        );

        if (duplicate) {
            nextErrors.effectiveDate =
                "A salary structure already exists for this employee on this date.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = (event) => {
        event.preventDefault();

        if (saving || !validateForm()) return;

        setSaving(true);

        const salary = calculateSalary(form);

        const structure = {
            id: editingId ?? `salary-${Date.now()}`,
            employeeId: String(form.employeeId),
            effectiveDate: form.effectiveDate,
            basic: salary.basic,
            hra: salary.hra,
            otherAllowances: salary.otherAllowances,
            bonus: salary.bonus,
            pf: salary.pf,
            insurance: salary.insurance,
            otherDeductions: salary.otherDeductions,
            updatedAt: new Date().toISOString(),
        };

        if (editingId) {
            setStructures((current) =>
                current.map((item) => (item.id === editingId ? structure : item))
            );
        } else {
            setStructures((current) => [...current, structure]);
        }

        setSaving(false);
        setDrawerOpen(false);
        setEditingId(null);
        setErrors({});
        setForm({ ...EMPTY_FORM, effectiveDate: getLocalDate() });

        showNotification?.(
            "success",
            editingId
                ? "Salary structure updated for this demo session."
                : "Salary structure created for this demo session."
        );
    };

    const openTemplateDrawer = (template = null) => {
        setEditingTemplateId(template?.id ?? null);
        setTemplateForm(
            template
                ? {
                    name: template.name,
                    description: template.description || "",
                    basic: String(template.basic ?? ""),
                    hra: String(template.hra ?? ""),
                    otherAllowances: String(template.otherAllowances ?? ""),
                    bonus: String(template.bonus ?? ""),
                    pf: String(template.pf ?? ""),
                    insurance: String(template.insurance ?? ""),
                    otherDeductions: String(template.otherDeductions ?? ""),
                }
                : { ...EMPTY_TEMPLATE }
        );
        setTemplateError("");
        setTemplateDrawerOpen(true);
    };

    const saveTemplate = (event) => {
        event.preventDefault();

        if (!templateForm.name.trim()) {
            setTemplateError("Enter a template name.");
            return;
        }

        if (!Number.isFinite(Number(templateForm.basic)) ||
            Number(templateForm.basic) <= 0) {
            setTemplateError("Basic salary must be greater than zero.");
            return;
        }

        const amounts = [
            "hra", "otherAllowances", "bonus", "pf",
            "insurance", "otherDeductions",
        ];

        for (const field of amounts) {
            const value = templateForm[field];
            if (
                value !== "" &&
                (!Number.isFinite(Number(value)) || Number(value) < 0)
            ) {
                setTemplateError("Salary amounts must be valid non-negative numbers.");
                return;
            }
        }

        const salary = calculateSalary(templateForm);

        if (salary.totalDeductions > salary.gross) {
            setTemplateError("Total deductions cannot exceed gross salary.");
            return;
        }

        const template = {
            ...templateForm,
            id: editingTemplateId ?? `template-${Date.now()}`,
            name: templateForm.name.trim(),
            basic: salary.basic,
            hra: salary.hra,
            otherAllowances: salary.otherAllowances,
            bonus: salary.bonus,
            pf: salary.pf,
            insurance: salary.insurance,
            otherDeductions: salary.otherDeductions,
            updatedAt: new Date().toISOString(),
        };

        setTemplates((current) =>
            editingTemplateId
                ? current.map((item) =>
                    item.id === editingTemplateId ? template : item
                )
                : [...current, template]
        );

        setTemplateDrawerOpen(false);
        setEditingTemplateId(null);
        setTemplateForm({ ...EMPTY_TEMPLATE });

        showNotification?.(
            "success",
            editingTemplateId ? "Salary template updated." : "Salary template created."
        );
    };

    const toggleEmployee = (employeeId) => {
        const id = String(employeeId);

        setSelectedEmployees((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    };

    const toggleAllEmployees = () => {
        setSelectedEmployees((current) =>
            current.length === employeeOptions.length
                ? []
                : employeeOptions.map((employee) => employee.value)
        );
    };

    const assignTemplate = () => {
        setBulkError("");

        const template = templates.find(
            (item) => item.id === bulkTemplateId
        );

        if (!template) {
            setBulkError("Select a salary template.");
            return;
        }

        if (selectedEmployees.length === 0) {
            setBulkError("Select at least one employee.");
            return;
        }

        if (!bulkEffectiveDate) {
            setBulkError("Select an effective date.");
            return;
        }

        const duplicateEmployees = selectedEmployees.filter((employeeId) =>
            structures.some(
                (structure) =>
                    String(structure.employeeId) === employeeId &&
                    structure.effectiveDate === bulkEffectiveDate
            )
        );

        if (duplicateEmployees.length > 0) {
            const duplicateNames = duplicateEmployees
                .map((id) =>
                    getEmployeeName(employeeMap.get(id))
                )
                .join(", ");

            setBulkError(
                `A structure already exists for this date for: ${duplicateNames}. Change the date or deselect these employees.`
            );
            return;
        }

        const newStructures = selectedEmployees.map((employeeId, index) => ({
            id: `salary-${Date.now()}-${index}`,
            employeeId,
            templateId: template.id,
            templateName: template.name,
            effectiveDate: bulkEffectiveDate,
            basic: Number(template.basic) || 0,
            hra: Number(template.hra) || 0,
            otherAllowances: Number(template.otherAllowances) || 0,
            bonus: Number(template.bonus) || 0,
            pf: Number(template.pf) || 0,
            insurance: Number(template.insurance) || 0,
            otherDeductions: Number(template.otherDeductions) || 0,
            updatedAt: new Date().toISOString(),
        }));

        setStructures((current) => [...current, ...newStructures]);
        setSelectedEmployees([]);
        setBulkTemplateId("");
        setActiveTab("structures");

        showNotification?.(
            "success",
            `Salary template assigned to ${newStructures.length} employee(s).`
        );
    };

    const deleteTemplate = (templateId) => {
        const inUse = structures.some(
            (structure) => structure.templateId === templateId
        );

        if (inUse) {
            showNotification?.(
                "error",
                "This template has been assigned to employees and cannot be deleted."
            );
            return;
        }

        setTemplates((current) =>
            current.filter((template) => template.id !== templateId)
        );
    };


    const downloadImportTemplate = () => {
        downloadCSV("ignite_salary_import_template.csv", [
            CSV_IMPORT_HEADERS,
        ]);
    };

    const exportStructures = () => {
        const headers = [
            "employee_code",
            "employee_name",
            "department",
            "effective_date",
            "basic",
            "hra",
            "other_allowances",
            "bonus",
            "pf",
            "insurance",
            "other_deductions",
            "gross",
            "total_deductions",
            "net",
            "template_name",
        ];

        const rows = structures.map((structure) => {
            const employee = employeeMap.get(String(structure.employeeId));
            const salary = calculateSalary(structure);

            return [
                getEmployeeCode(employee),
                getEmployeeName(employee),
                getEmployeeDepartment(employee),
                structure.effectiveDate,
                salary.basic,
                salary.hra,
                salary.otherAllowances,
                salary.bonus,
                salary.pf,
                salary.insurance,
                salary.otherDeductions,
                salary.gross,
                salary.totalDeductions,
                salary.net,
                structure.templateName || "",
            ];
        });

        downloadCSV("ignite_salary_structures.csv", [headers, ...rows]);

        showNotification?.("success", "Salary structures exported to CSV.");
    };

    const handleCSVFile = async (event) => {
        const file = event.target.files?.[0];

        // Allow the same file to be selected again.
        event.target.value = "";

        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".csv")) {
            showNotification?.("error", "Please select a CSV file.");
            return;
        }

        try {
            const text = await file.text();
            const parsedRows = parseCSV(text);

            const employeesByCode = new Map();

            employeeOptions.forEach((option) => {
                const employee = employeeMap.get(option.value);
                const code = getEmployeeCode(employee).trim().toLowerCase();

                if (!employeesByCode.has(code)) {
                    employeesByCode.set(code, []);
                }

                employeesByCode.get(code).push(employee);
            });

            const seenKeys = new Set();
            const preview = [];
            const rowErrors = [];

            parsedRows.forEach(({ rowNumber, record }) => {
                const issues = [];
                const code = record.employee_code.trim().toLowerCase();
                const matches = employeesByCode.get(code) || [];
                const employee = matches.length === 1 ? matches[0] : null;

                if (!code) {
                    issues.push("Employee code is required.");
                } else if (matches.length === 0) {
                    issues.push("Employee code was not found among active employees.");
                } else if (matches.length > 1) {
                    issues.push("Employee code is ambiguous. Resolve duplicate employee codes first.");
                }

                if (!isValidISODate(record.effective_date)) {
                    issues.push("Effective date must be a valid YYYY-MM-DD date.");
                }

                const amountFields = [
                    ["basic", "Basic salary"],
                    ["hra", "HRA"],
                    ["other_allowances", "Other allowances"],
                    ["bonus", "Bonus"],
                    ["pf", "PF"],
                    ["insurance", "Insurance"],
                    ["other_deductions", "Other deductions"],
                ];

                const amounts = {};

                amountFields.forEach(([field, label]) => {
                    const raw = record[field];

                    if (raw === "") {
                        if (field === "basic") {
                            issues.push(`${label} is required.`);
                        }
                        amounts[field] = 0;
                        return;
                    }

                    const value = Number(raw);

                    if (!Number.isFinite(value) || value < 0) {
                        issues.push(`${label} must be a non-negative number.`);
                    } else {
                        amounts[field] = value;
                    }
                });

                if (
                    record.basic !== "" &&
                    Number.isFinite(Number(record.basic)) &&
                    Number(record.basic) <= 0
                ) {
                    issues.push("Basic salary must be greater than zero.");
                }

                const salary = calculateSalary({
                    basic: amounts.basic ?? 0,
                    hra: amounts.hra ?? 0,
                    otherAllowances: amounts.other_allowances ?? 0,
                    bonus: amounts.bonus ?? 0,
                    pf: amounts.pf ?? 0,
                    insurance: amounts.insurance ?? 0,
                    otherDeductions: amounts.other_deductions ?? 0,
                });

                if (salary.totalDeductions > salary.gross) {
                    issues.push("Total deductions cannot exceed gross salary.");
                }

                const duplicateKey =
                    employee && isValidISODate(record.effective_date)
                        ? `${employee.id}::${record.effective_date}`
                        : "";

                if (duplicateKey) {
                    if (seenKeys.has(duplicateKey)) {
                        issues.push("Duplicate employee + effective date within this CSV.");
                    } else {
                        seenKeys.add(duplicateKey);
                    }

                    const alreadyExists = structures.some(
                        (structure) =>
                            String(structure.employeeId) === String(employee.id) &&
                            structure.effectiveDate === record.effective_date
                    );

                    if (alreadyExists) {
                        issues.push("A structure already exists for this employee and effective date. Duplicate skipped.");
                    }
                }

                const item = {
                    rowNumber,
                    employeeId: employee ? String(employee.id) : "",
                    employeeName: employee ? getEmployeeName(employee) : code || "Unknown",
                    employeeCode: record.employee_code,
                    effectiveDate: record.effective_date,
                    basic: amounts.basic ?? 0,
                    hra: amounts.hra ?? 0,
                    otherAllowances: amounts.other_allowances ?? 0,
                    bonus: amounts.bonus ?? 0,
                    pf: amounts.pf ?? 0,
                    insurance: amounts.insurance ?? 0,
                    otherDeductions: amounts.other_deductions ?? 0,
                    issues,
                };

                preview.push(item);

                if (issues.length) {
                    rowErrors.push({
                        rowNumber,
                        employeeCode: record.employee_code || "—",
                        messages: issues,
                    });
                }
            });

            setCsvPreview(preview);
            setCsvErrors(rowErrors);

            if (preview.length === 0) {
                showNotification?.("error", "No importable rows were found.");
            }
        } catch (error) {
            setCsvPreview([]);
            setCsvErrors([]);
            showNotification?.(
                "error",
                error instanceof Error ? error.message : "Could not read the CSV file."
            );
        }
    };

    const importValidCSVRows = () => {
        const validRows = csvPreview.filter((row) => row.issues.length === 0);

        if (validRows.length === 0) {
            showNotification?.("error", "There are no valid rows to import.");
            return;
        }

        const importedAt = new Date().toISOString();

        const newStructures = validRows.map((row, index) => ({
            id: `salary-csv-${Date.now()}-${index}`,
            employeeId: row.employeeId,
            effectiveDate: row.effectiveDate,
            basic: row.basic,
            hra: row.hra,
            otherAllowances: row.otherAllowances,
            bonus: row.bonus,
            pf: row.pf,
            insurance: row.insurance,
            otherDeductions: row.otherDeductions,
            updatedAt: importedAt,
        }));

        setStructures((current) => [...current, ...newStructures]);
        setCsvPreview([]);
        setCsvErrors([]);

        showNotification?.(
            "success",
            `Imported ${newStructures.length} salary structure(s). Invalid and duplicate rows were skipped.`
        );
    };


    const currentSalary = calculateSalary(form);

    return (
        <div className="salary-structures-page">
            <PageHeader
                eyebrow="ACCOUNT"
                title="Salary Structures"
                description="Manage employee salary components, effective dates and revisions."

                action={
                    <div className="salary-csv-actions">
                        <Button variant="secondary" onClick={downloadImportTemplate}>
                            <FileSpreadsheet size={16} />
                            CSV Template
                        </Button>

                        <Button variant="secondary" onClick={exportStructures}>
                            <Download size={16} />
                            Export CSV
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => csvInputRef.current?.click()}
                            disabled={employeesLoading || employeeOptions.length === 0}
                        >
                            <Upload size={16} />
                            Import CSV
                        </Button>

                        <Button
                            onClick={openCreateDrawer}
                            disabled={employeesLoading || employeeOptions.length === 0}
                        >
                            <Plus size={17} />
                            Add Salary Structure
                        </Button>
                    </div>
                }

            />

            <PayrollWorkflowNav />

            <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={handleCSVFile}
            />


            <div className="salary-demo-notice">
                <span className="salary-demo-notice__icon">
                    <RefreshCw size={17} />
                </span>
                <div>
                    <strong>Frontend demo mode</strong>
                    <p>
                        Salary structures are saved in this browser only and are not
                        submitted to the backend.
                    </p>
                </div>
            </div>

            <div className="salary-summary-grid">
                <Card className="salary-summary-card">
                    <div className="salary-summary-card__content">
                        <div>
                            <span className="salary-summary-card__label">
                                Total Structures
                            </span>
                            <strong className="salary-summary-card__value">
                                {summary.total}
                            </strong>
                            <span className="salary-summary-card__hint">
                                All revisions in this session
                            </span>
                        </div>
                        <span className="salary-summary-card__icon salary-summary-card__icon--teal">
                            <Wallet size={21} />
                        </span>
                    </div>
                </Card>

                <Card className="salary-summary-card">
                    <div className="salary-summary-card__content">
                        <div>
                            <span className="salary-summary-card__label">
                                Employees Covered
                            </span>
                            <strong className="salary-summary-card__value">
                                {summary.employeesCovered}
                            </strong>
                            <span className="salary-summary-card__hint">
                                With an effective structure
                            </span>
                        </div>
                        <span className="salary-summary-card__icon salary-summary-card__icon--blue">
                            <Users size={21} />
                        </span>
                    </div>
                </Card>

                <Card className="salary-summary-card">
                    <div className="salary-summary-card__content">
                        <div>
                            <span className="salary-summary-card__label">
                                Active Structures
                            </span>
                            <strong className="salary-summary-card__value">
                                {summary.active}
                            </strong>
                            <span className="salary-summary-card__hint">
                                Effective today or earlier
                            </span>
                        </div>
                        <span className="salary-summary-card__icon salary-summary-card__icon--green">
                            <BadgeCheck size={21} />
                        </span>
                    </div>
                </Card>

                <Card className="salary-summary-card">
                    <div className="salary-summary-card__content">
                        <div>
                            <span className="salary-summary-card__label">
                                Upcoming Employees
                            </span>
                            <strong className="salary-summary-card__value">
                                {summary.upcoming}
                            </strong>
                            <span className="salary-summary-card__hint">
                                Future-dated structures
                            </span>
                        </div>
                        <span className="salary-summary-card__icon salary-summary-card__icon--gold">
                            <CalendarClock size={21} />
                        </span>
                    </div>
                </Card>
            </div>

            <div className="salary-module-tabs">
                <button
                    type="button"
                    className={activeTab === "structures" ? "is-active" : ""}
                    onClick={() => setActiveTab("structures")}
                >
                    <Wallet size={16} /> Salary Structures
                </button>

                <button
                    type="button"
                    className={activeTab === "templates" ? "is-active" : ""}
                    onClick={() => setActiveTab("templates")}
                >
                    <Layers size={16} /> Salary Templates
                    <span>{templates.length}</span>
                </button>

                <button
                    type="button"
                    className={activeTab === "bulk" ? "is-active" : ""}
                    onClick={() => setActiveTab("bulk")}
                >
                    <Users size={16} /> Bulk Assignment
                </button>
            </div>

            {csvPreview.length > 0 && (
                <Card
                    className="salary-structures-card salary-csv-preview"
                    title="Review CSV Import"
                    description="Only valid rows will be imported. Existing records will not be overwritten."
                >
                    <div className="salary-csv-preview__summary">
                        <div>
                            <span>Total rows</span>
                            <strong>{csvPreview.length}</strong>
                        </div>
                        <div>
                            <span>Valid rows</span>
                            <strong>
                                {csvPreview.filter((row) => row.issues.length === 0).length}
                            </strong>
                        </div>
                        <div>
                            <span>Rows with errors</span>
                            <strong>{csvErrors.length}</strong>
                        </div>
                    </div>

                    <div className="salary-table-wrapper">
                        <table className="salary-table">
                            <thead>
                                <tr>
                                    <th>CSV Row</th>
                                    <th>Employee</th>
                                    <th>Effective From</th>
                                    <th className="salary-table__amount">Basic</th>
                                    <th className="salary-table__amount">Gross</th>
                                    <th className="salary-table__amount">Net</th>
                                    <th>Validation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {csvPreview.map((row) => {
                                    const salary = calculateSalary(row);

                                    return (
                                        <tr key={row.rowNumber}>
                                            <td>{row.rowNumber}</td>
                                            <td>
                                                <strong>{row.employeeName}</strong>
                                                <div className="salary-csv-preview__code">
                                                    {row.employeeCode}
                                                </div>
                                            </td>
                                            <td>{row.effectiveDate || "—"}</td>
                                            <td className="salary-table__amount">
                                                {formatCurrency(salary.basic)}
                                            </td>
                                            <td className="salary-table__amount">
                                                {formatCurrency(salary.gross)}
                                            </td>
                                            <td className="salary-table__amount">
                                                {formatCurrency(salary.net)}
                                            </td>
                                            <td>
                                                {row.issues.length === 0 ? (
                                                    <span className="salary-csv-valid">Valid</span>
                                                ) : (
                                                    <span
                                                        className="salary-csv-invalid"
                                                        title={row.issues.join("\n")}
                                                    >
                                                        {row.issues.length} issue(s)
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {csvErrors.length > 0 && (
                        <div className="salary-csv-errors">
                            <h3>Rows to review</h3>
                            {csvErrors.map((item) => (
                                <p key={item.rowNumber}>
                                    <strong>Row {item.rowNumber} ({item.employeeCode}):</strong>{" "}
                                    {item.messages.join(" ")}
                                </p>
                            ))}
                        </div>
                    )}

                    <div className="salary-csv-preview__footer">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setCsvPreview([]);
                                setCsvErrors([]);
                            }}
                        >
                            Cancel Import
                        </Button>

                        <Button
                            onClick={importValidCSVRows}
                            disabled={!csvPreview.some((row) => row.issues.length === 0)}
                        >
                            <Upload size={16} />
                            Import Valid Rows (
                            {csvPreview.filter((row) => row.issues.length === 0).length})
                        </Button>
                    </div>
                </Card>
            )}



            {activeTab === "structures" && (
                <Card
                    className="salary-structures-card"
                    title="Employee Salary Structures"
                    description="Search employees and review their salary components."
                >
                    <div className="salary-table-toolbar">
                        <div className="salary-search">
                            <Search size={17} />
                            <input
                                type="search"
                                aria-label="Search salary structures"
                                placeholder="Search employee, code or department..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                            {search && (
                                <button
                                    type="button"
                                    className="salary-search__clear"
                                    aria-label="Clear search"
                                    onClick={() => setSearch("")}
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: "ALL", label: "All statuses" },
                                { value: "ACTIVE", label: "Active" },
                                { value: "UPCOMING", label: "Upcoming" },
                            ]}
                            placeholder="Filter status"
                        />
                    </div>

                    {employeesLoading ? (
                        <div className="salary-page-state">
                            <span className="salary-loading-spinner" />
                            <p>Loading employees...</p>
                        </div>
                    ) : employeesError ? (
                        <div className="salary-page-state">
                            <div className="salary-page-state__icon">
                                <Users size={24} />
                            </div>
                            <h3>Could not load employees</h3>
                            <p>
                                Check your connection and retry. Salary structures need the
                                employee list to be available.
                            </p>
                            <Button
                                variant="secondary"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </Button>
                        </div>
                    ) : visibleStructures.length === 0 ? (
                        <div className="salary-page-state">
                            <div className="salary-page-state__icon">
                                <IndianRupee size={25} />
                            </div>
                            <h3>
                                {structures.length === 0
                                    ? "No salary structures yet"
                                    : "No matching salary structures"}
                            </h3>
                            <p>
                                {structures.length === 0
                                    ? "Create a structure for an employee to define their salary components and effective date."
                                    : "Try another search term or change the status filter."}
                            </p>
                            {structures.length === 0 && (
                                <Button
                                    onClick={openCreateDrawer}
                                    disabled={employeeOptions.length === 0}
                                >
                                    <Plus size={16} />
                                    Create First Structure
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="salary-table-wrapper">
                                <table className="salary-table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Department</th>
                                            <th>Effective From</th>
                                            <th className="salary-table__amount">Basic</th>
                                            <th className="salary-table__amount">Allowances</th>
                                            <th className="salary-table__amount">Deductions</th>
                                            <th className="salary-table__amount">Gross</th>
                                            <th className="salary-table__amount">Net Salary</th>
                                            <th>Status</th>
                                            <th className="salary-table__action-heading">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleStructures.map((structure) => {
                                            const employee = employeeMap.get(
                                                String(structure.employeeId)
                                            );
                                            const salary = calculateSalary(structure);
                                            const status = getStructureStatus(structure.effectiveDate);

                                            return (
                                                <tr key={structure.id}>
                                                    <td>
                                                        <div className="salary-employee-cell">
                                                            <span className="salary-employee-avatar">
                                                                {getEmployeeName(employee)
                                                                    .split(/\s+/)
                                                                    .filter(Boolean)
                                                                    .slice(0, 2)
                                                                    .map((part) => part[0])
                                                                    .join("")
                                                                    .toUpperCase()}
                                                            </span>
                                                            <div className="salary-employee-cell__details">
                                                                <strong>{getEmployeeName(employee)}</strong>
                                                                <span>{getEmployeeCode(employee)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{getEmployeeDepartment(employee)}</td>
                                                    <td>{formatDate(structure.effectiveDate)}</td>
                                                    <td className="salary-table__amount">
                                                        {formatCurrency(salary.basic)}
                                                    </td>
                                                    <td className="salary-table__amount">
                                                        {formatCurrency(salary.totalAllowances)}
                                                    </td>
                                                    <td className="salary-table__amount">
                                                        {formatCurrency(salary.totalDeductions)}
                                                    </td>
                                                    <td className="salary-table__amount salary-table__gross">
                                                        {formatCurrency(salary.gross)}
                                                    </td>
                                                    <td className="salary-table__amount salary-table__net">
                                                        {formatCurrency(salary.net)}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`salary-status salary-status--${status.toLowerCase()}`}
                                                        >
                                                            <span />
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="salary-table__action-cell">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => openEditDrawer(structure)}
                                                            aria-label={`Edit salary structure for ${getEmployeeName(employee)}`}
                                                        >
                                                            <Pencil size={14} />
                                                            Edit
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={6}>
                                                Displayed totals ({visibleStructures.length} structures)
                                            </td>
                                            <td className="salary-table__amount">
                                                {formatCurrency(salaryTotals.gross)}
                                            </td>
                                            <td className="salary-table__amount">
                                                {formatCurrency(salaryTotals.net)}
                                            </td>
                                            <td colSpan={2}> </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="salary-table-mobile-note">
                                Scroll horizontally to see all salary details.
                            </div>
                        </>
                    )}
                </Card>
            )}

            {activeTab === "templates" && (
                <Card
                    className="salary-structures-card"
                    title="Salary Templates"
                    description="Define reusable monthly salary plans. Assignments create independent employee salary records."
                    headerAction={
                        <Button onClick={() => openTemplateDrawer()}>
                            <Plus size={16} /> Create Template
                        </Button>
                    }
                >
                    {templates.length === 0 ? (
                        <div className="salary-page-state">
                            <div className="salary-page-state__icon">
                                <Layers size={24} />
                            </div>
                            <h3>No salary templates yet</h3>
                            <p>
                                Create a template once, then use it to assign salaries
                                to multiple employees.
                            </p>
                            <Button onClick={() => openTemplateDrawer()}>
                                <Plus size={16} /> Create First Template
                            </Button>
                        </div>
                    ) : (
                        <div className="salary-template-grid">
                            {templates.map((template) => {
                                const salary = calculateSalary(template);

                                return (
                                    <div className="salary-template-card" key={template.id}>
                                        <div className="salary-template-card__top">
                                            <span className="salary-template-card__icon">
                                                <Layers size={20} />
                                            </span>
                                            <div className="salary-template-card__actions">
                                                <button
                                                    type="button"
                                                    aria-label={`Edit ${template.name}`}
                                                    onClick={() => openTemplateDrawer(template)}
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Delete ${template.name}`}
                                                    onClick={() => deleteTemplate(template.id)}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        <h3>{template.name}</h3>
                                        <p className="salary-template-card__description">
                                            {template.description || "Reusable salary structure"}
                                        </p>

                                        <div className="salary-template-card__amounts">
                                            <div>
                                                <span>Basic</span>
                                                <strong>{formatCurrency(salary.basic)}</strong>
                                            </div>
                                            <div>
                                                <span>Allowances & bonus</span>
                                                <strong>{formatCurrency(salary.totalAllowances)}</strong>
                                            </div>
                                            <div>
                                                <span>Deductions</span>
                                                <strong>{formatCurrency(salary.totalDeductions)}</strong>
                                            </div>
                                        </div>

                                        <div className="salary-template-card__net">
                                            <span>Net monthly salary</span>
                                            <strong>{formatCurrency(salary.net)}</strong>
                                        </div>

                                        <Button
                                            block
                                            onClick={() => {
                                                setBulkTemplateId(template.id);
                                                setActiveTab("bulk");
                                            }}
                                        >
                                            <Users size={15} /> Assign to Employees
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}

            {activeTab === "bulk" && (
                <Card
                    className="salary-structures-card"
                    title="Bulk Salary Assignment"
                    description="Select employees, choose a template and preview the assignment before applying it."
                >
                    <div className="salary-bulk-content">
                        <div className="salary-bulk-settings">
                            <FormField label="Salary Template" required>
                                <Select
                                    value={bulkTemplateId}
                                    onChange={(value) => {
                                        setBulkTemplateId(value);
                                        setBulkError("");
                                    }}
                                    options={templates.map((template) => ({
                                        value: template.id,
                                        label: template.name,
                                    }))}
                                    placeholder="Choose a salary template"
                                />
                            </FormField>

                            <FormField label="Effective From" required>
                                <DatePicker
                                    value={bulkEffectiveDate}
                                    onChange={(value) => {
                                        setBulkEffectiveDate(value);
                                        setBulkError("");
                                    }}
                                    placeholder="Select effective date"
                                />
                            </FormField>
                        </div>

                        {!employeesLoading && employeeOptions.length === 0 && (
                            <p className="salary-bulk-error">
                                No active employees are available for assignment.
                            </p>
                        )}

                        <div className="salary-bulk-selection-header">
                            <div>
                                <h3>Select Employees</h3>
                                <p>
                                    {selectedEmployees.length} of {employeeOptions.length} selected
                                </p>
                            </div>

                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={toggleAllEmployees}
                                disabled={employeesLoading || employeeOptions.length === 0}
                            >
                                <CheckSquare size={15} />
                                {selectedEmployees.length === employeeOptions.length &&
                                    employeeOptions.length > 0
                                    ? "Clear Selection"
                                    : "Select All"}
                            </Button>
                        </div>

                        <div className="salary-bulk-employee-list">
                            {employeesLoading ? (
                                <p>Loading employees...</p>
                            ) : (
                                employeeOptions.map((option) => {
                                    const employee = employeeMap.get(option.value);
                                    const checked = selectedEmployees.includes(option.value);
                                    const duplicate = structures.some(
                                        (structure) =>
                                            String(structure.employeeId) === option.value &&
                                            structure.effectiveDate === bulkEffectiveDate
                                    );

                                    return (
                                        <label
                                            className={`salary-bulk-employee ${checked ? "is-selected" : ""
                                                }`}
                                            key={option.value}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleEmployee(option.value)}
                                            />
                                            <span className="salary-employee-avatar">
                                                {getEmployeeName(employee)
                                                    .split(/\s+/)
                                                    .filter(Boolean)
                                                    .slice(0, 2)
                                                    .map((part) => part[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </span>
                                            <span className="salary-bulk-employee__details">
                                                <strong>{getEmployeeName(employee)}</strong>
                                                <span>
                                                    {getEmployeeCode(employee)} ·{" "}
                                                    {getEmployeeDepartment(employee)}
                                                </span>
                                            </span>
                                            {duplicate && (
                                                <span className="salary-bulk-duplicate">
                                                    Existing record
                                                </span>
                                            )}
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        {bulkTemplateId && (() => {
                            const template = templates.find(
                                (item) => item.id === bulkTemplateId
                            );

                            if (!template) return null;

                            const salary = calculateSalary(template);

                            return (
                                <div className="salary-bulk-preview">
                                    <div>
                                        <span>Selected template</span>
                                        <strong>{template.name}</strong>
                                    </div>
                                    <div>
                                        <span>Gross per employee</span>
                                        <strong>{formatCurrency(salary.gross)}</strong>
                                    </div>
                                    <div>
                                        <span>Net per employee</span>
                                        <strong>{formatCurrency(salary.net)}</strong>
                                    </div>
                                    <div>
                                        <span>Employees selected</span>
                                        <strong>{selectedEmployees.length}</strong>
                                    </div>
                                </div>
                            );
                        })()}

                        {bulkError && (
                            <p className="salary-bulk-error" role="alert">
                                {bulkError}
                            </p>
                        )}

                        <div className="salary-bulk-footer">
                            <Button
                                variant="secondary"
                                onClick={() => setActiveTab("templates")}
                            >
                                Back to Templates
                            </Button>
                            <Button
                                onClick={assignTemplate}
                                disabled={
                                    employeesLoading ||
                                    templates.length === 0 ||
                                    selectedEmployees.length === 0
                                }
                            >
                                <Copy size={16} /> Assign Salary to {selectedEmployees.length} Employee
                                {selectedEmployees.length === 1 ? "" : "s"}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}


            <Drawer
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setErrors({});
                }}
                title={editingId ? "Edit Salary Structure" : "Add Salary Structure"}
                description="Enter the employee's salary components and effective date."
                width="600px"
                footer={
                    <div className="salary-drawer-footer">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setDrawerOpen(false);
                                setErrors({});
                            }}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            loading={saving}
                            disabled={employeesLoading || employeeOptions.length === 0}
                        >
                            {editingId ? "Save Changes" : "Create Structure"}
                        </Button>
                    </div>
                }
            >
                <form
                    id="salary-structure-form"
                    className="salary-structure-form"
                    onSubmit={handleSave}
                >
                    <div className="salary-form-section">
                        <h3>Employee Details</h3>
                        <p>Select the employee and when this structure takes effect.</p>

                        <FormField
                            label="Employee"
                            required
                            error={errors.employeeId}
                        >
                            <Select
                                value={form.employeeId}
                                onChange={(value) => updateField("employeeId", value)}
                                options={employeeOptions}
                                placeholder={
                                    employeesLoading ? "Loading employees..." : "Select employee"
                                }
                                disabled={employeesLoading || Boolean(editingId)}
                            />
                        </FormField>

                        <FormField
                            label="Effective From"
                            required
                            error={errors.effectiveDate}
                            hint="Use a new effective date for a salary revision."
                        >
                            <DatePicker
                                value={form.effectiveDate}
                                onChange={(value) => updateField("effectiveDate", value)}
                                placeholder="Select effective date"
                            />
                        </FormField>
                    </div>

                    <div className="salary-form-section">
                        <h3>Earnings</h3>
                        <p>Amounts are monthly values in Indian rupees (INR).</p>

                        <div className="salary-form-grid">
                            <FormField label="Basic Salary" required error={errors.basic}>
                                <div className="salary-input-with-prefix">
                                    <span>₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.basic}
                                        onChange={(event) => updateField("basic", event.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </FormField>

                            <FormField label="HRA" error={errors.hra}>
                                <div className="salary-input-with-prefix">
                                    <span>₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.hra}
                                        onChange={(event) => updateField("hra", event.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </FormField>

                            <FormField
                                label="Other Allowances"
                                error={errors.otherAllowances}
                            >
                                <div className="salary-input-with-prefix">
                                    <span>₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.otherAllowances}
                                        onChange={(event) =>
                                            updateField("otherAllowances", event.target.value)
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                            </FormField>

                            <FormField
                                label="Bonus / Other Earnings"
                                error={errors.bonus}
                            >
                                <div className="salary-input-with-prefix">
                                    <span>₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.bonus}
                                        onChange={(event) => updateField("bonus", event.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </FormField>
                        </div>
                    </div>

                    <div className="salary-form-section">
                        <h3>Deductions</h3>
                        <p>Enter monthly deductions applicable to this employee.</p>

                        <div className="salary-form-grid">
                            <FormField label="PF Deduction" error={errors.pf}>
                                <div className="salary-input-with-prefix">
                                    <span>₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.pf}
                                        onChange={(event) => updateField("pf", event.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </FormField>

                            <FormField label="Insurance" error={errors.insurance}>
                                <div className="salary-input-with-prefix">
                                    <span>₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.insurance}
                                        onChange={(event) =>
                                            updateField("insurance", event.target.value)
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                            </FormField>

                            <FormField
                                label="Other Deductions"
                                error={errors.otherDeductions}
                            >
                                <div className="salary-input-with-prefix">
                                    <span>₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.otherDeductions}
                                        onChange={(event) =>
                                            updateField("otherDeductions", event.target.value)
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                            </FormField>
                        </div>
                    </div>

                    <div className="salary-calculation-panel">
                        <div>
                            <span>Total Allowances & Other Earnings</span>
                            <strong>{formatCurrency(currentSalary.totalAllowances)}</strong>
                        </div>
                        <div>
                            <span>Gross Monthly Salary</span>
                            <strong>{formatCurrency(currentSalary.gross)}</strong>
                        </div>
                        <div>
                            <span>Total Deductions</span>
                            <strong className="salary-calculation-panel__deductions">
                                {formatCurrency(currentSalary.totalDeductions)}
                            </strong>
                        </div>
                        <div className="salary-calculation-panel__net">
                            <span>Net Monthly Salary</span>
                            <strong>{formatCurrency(currentSalary.net)}</strong>
                        </div>
                    </div>

                    <p className="salary-form-footnote">
                        Gross = Basic + HRA + Other Allowances + Bonus. Net = Gross − Total
                        Deductions. Verify applicable payroll and statutory rules before
                        using these figures for actual payroll.
                    </p>
                </form>
            </Drawer>

            <Drawer
                open={templateDrawerOpen}
                onClose={() => setTemplateDrawerOpen(false)}
                title={editingTemplateId ? "Edit Salary Template" : "Create Salary Template"}
                description="Set monthly salary amounts to reuse when assigning salaries."
                width="600px"
                footer={
                    <div className="salary-drawer-footer">
                        <Button
                            variant="secondary"
                            onClick={() => setTemplateDrawerOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={saveTemplate}>
                            {editingTemplateId ? "Save Changes" : "Create Template"}
                        </Button>
                    </div>
                }
            >
                <form className="salary-structure-form" onSubmit={saveTemplate}>
                    <FormField label="Template Name" required>
                        <input
                            className="salary-template-text-input"
                            value={templateForm.name}
                            onChange={(event) =>
                                setTemplateForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            placeholder="e.g. Standard Employee"
                            maxLength={80}
                        />
                    </FormField>

                    <FormField label="Description">
                        <input
                            className="salary-template-text-input"
                            value={templateForm.description}
                            onChange={(event) =>
                                setTemplateForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                            placeholder="e.g. Standard monthly salary plan"
                            maxLength={200}
                        />
                    </FormField>

                    <div className="salary-form-section">
                        <h3>Earnings</h3>
                        <div className="salary-form-grid">
                            {[
                                ["basic", "Basic Salary"],
                                ["hra", "HRA"],
                                ["otherAllowances", "Other Allowances"],
                                ["bonus", "Bonus / Other Earnings"],
                            ].map(([field, label]) => (
                                <FormField
                                    label={label}
                                    required={field === "basic"}
                                    key={field}
                                >
                                    <div className="salary-input-with-prefix">
                                        <span>₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required={field === "basic"}
                                            value={templateForm[field]}
                                            onChange={(event) =>
                                                setTemplateForm((current) => ({
                                                    ...current,
                                                    [field]: event.target.value,
                                                }))
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                </FormField>
                            ))}
                        </div>
                    </div>

                    <div className="salary-form-section">
                        <h3>Deductions</h3>
                        <div className="salary-form-grid">
                            {[
                                ["pf", "PF Deduction"],
                                ["insurance", "Insurance"],
                                ["otherDeductions", "Other Deductions"],
                            ].map(([field, label]) => (
                                <FormField label={label} key={field}>
                                    <div className="salary-input-with-prefix">
                                        <span>₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={templateForm[field]}
                                            onChange={(event) =>
                                                setTemplateForm((current) => ({
                                                    ...current,
                                                    [field]: event.target.value,
                                                }))
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                </FormField>
                            ))}
                        </div>
                    </div>

                    {templateError && (
                        <p className="salary-bulk-error" role="alert">
                            {templateError}
                        </p>
                    )}

                    <div className="salary-calculation-panel">
                        <div>
                            <span>Gross Monthly Salary</span>
                            <strong>
                                {formatCurrency(calculateSalary(templateForm).gross)}
                            </strong>
                        </div>
                        <div>
                            <span>Total Deductions</span>
                            <strong className="salary-calculation-panel__deductions">
                                {formatCurrency(
                                    calculateSalary(templateForm).totalDeductions
                                )}
                            </strong>
                        </div>
                        <div className="salary-calculation-panel__net">
                            <span>Net Monthly Salary</span>
                            <strong>
                                {formatCurrency(calculateSalary(templateForm).net)}
                            </strong>
                        </div>
                    </div>

                    <p className="salary-form-footnote">
                        Updating a template changes future assignments only. Existing
                        employee salary records retain their assigned amounts.
                    </p>
                </form>
            </Drawer>

        </div>
    );
};

export default SalaryStructures;
