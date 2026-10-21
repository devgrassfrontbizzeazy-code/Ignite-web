import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getFieldSalesEmployees } from "../../../services/api/fieldSalesAPI";
import { useNotification } from "../../../context/NotificationContext";

import "./SalaryStructures.css";
import {
  getSalaryStructures,
  getSalaryComponents,
  createSalaryStructure,
  patchSalaryStructure,
  deleteSalaryStructure,
  bulkAssignSalaryTemplate,
  importSalaryStructures,
  exportSalaryStructures,
  getSalaryTemplates,
  createSalaryTemplate,
  patchSalaryTemplate,
  deleteSalaryTemplate,
  triggerBlobDownload,
} from "../../../services/api/accountAPI";
const unwrapList = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.results)) return data.data.results;

  return [];
};

const getLegacyComponentField = (component) => {
  const code = String(component?.code ?? component?.component_code ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const name = String(component?.name ?? component?.component_name ?? "")
    .trim()
    .toLowerCase();

  if (["BS", "BASIC", "BASIC_SALARY"].includes(code) || /^basic(\s+salary)?$/.test(name)) return "basic";
  if (code === "HRA" || /house rent allowance|\bhra\b/.test(name)) return "hra";
  if (["OA", "OTHER_ALLOWANCES"].includes(code) || /other allowances?/.test(name)) return "otherAllowances";
  if (code === "BONUS" || /\bbonus\b/.test(name)) return "bonus";
  if (code === "PF" || /provident fund|\bpf\b/.test(name)) return "pf";
  if (code === "INSURANCE" || /\binsurance\b/.test(name)) return "insurance";
  if (["OD", "OTHER_DEDUCTIONS"].includes(code) || /other deductions?/.test(name)) return "otherDeductions";
  return null;
};

const getLegacyAmountsFromItems = (items = [], componentList = [], valueKey = "value") => {
  const amounts = {};
  (Array.isArray(items) ? items : []).forEach((item) => {
    const componentId = item.component_id ?? item.component?.id;
    const component = componentList.find(
      (candidate) => String(candidate.id) === String(componentId)
    ) || item;
    const field = getLegacyComponentField(component);
    if (field) amounts[field] = Number(item[valueKey] ?? item.default_value ?? 0) || 0;
  });
  return amounts;
};

const normalizeStructure = (item, componentList = []) => {
  const itemAmounts = getLegacyAmountsFromItems(item.items, componentList, "value");
  return {
    ...item,
    id: item.id,
    employeeId: String(
      item.employee_id ??
      item.employee?.id ??
      item.employeeId ??
      (typeof item.employee === "object" ? item.employee?.id : item.employee) ??
      ""
    ),
    effectiveDate:
      item.effective_from ??
      item.effectiveDate ??
      item.effective_date ??
      "",
    basic: itemAmounts.basic ?? item.basic ?? 0,
    hra: itemAmounts.hra ?? item.hra ?? 0,
    otherAllowances:
      itemAmounts.otherAllowances ??
      item.other_allowances ??
      item.otherAllowances ??
      0,
    bonus: itemAmounts.bonus ?? item.bonus ?? 0,
    pf: itemAmounts.pf ?? item.pf ?? 0,
    insurance: itemAmounts.insurance ?? item.insurance ?? 0,
    otherDeductions:
      itemAmounts.otherDeductions ??
      item.other_deductions ??
      item.otherDeductions ??
      0,
    templateId:
      item.template_id ??
      item.template?.id ??
      item.templateId ??
      (typeof item.template === "number" ? item.template : null),
    templateName:
      item.template_name ??
      item.template?.name ??
      item.templateName ??
      "",
  };
};

const normalizeTemplate = (item, componentList = []) => {
  const itemAmounts = getLegacyAmountsFromItems(item.components, componentList, "default_value");
  return {
    ...item,
    id: item.id,
    name: item.name ?? "",
    description: item.description ?? "",
    basic: itemAmounts.basic ?? item.basic ?? 0,
    hra: itemAmounts.hra ?? item.hra ?? 0,
    otherAllowances:
      itemAmounts.otherAllowances ??
      item.other_allowances ??
      item.otherAllowances ??
      0,
    bonus: itemAmounts.bonus ?? item.bonus ?? 0,
    pf: itemAmounts.pf ?? item.pf ?? 0,
    insurance: itemAmounts.insurance ?? item.insurance ?? 0,
    otherDeductions:
      itemAmounts.otherDeductions ??
      item.other_deductions ??
      item.otherDeductions ??
      0,
  };
};

const EMPTY_FORM = { employeeId: "", effectiveDate: "", componentAmounts: {} };

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

const calculateSalary = (form, componentList = []) => {
  const sourceItems = Array.isArray(form?.items)
    ? form.items
    : Array.isArray(form?.components)
      ? form.components
      : null;
  const componentAmounts = form?.componentAmounts && typeof form.componentAmounts === "object"
    ? form.componentAmounts
    : null;

  if (sourceItems || componentAmounts) {
    const items = sourceItems || componentList
      .filter((component) => component.is_active !== false)
      .map((component) => ({
        ...component,
        component_id: component.id,
        value: componentAmounts?.[String(component.id)] ?? component.default_value ?? 0,
      }));
    const resolveComponent = (item) => {
      const id = item.component_id ?? item.component?.id ?? item.id;
      return componentList.find((component) => String(component.id) === String(id)) || item;
    };
    const rows = items.map((item) => {
      const component = resolveComponent(item);
      const code = String(component.component_code ?? component.code ?? item.component_code ?? item.code ?? "").trim().toUpperCase();
      const name = String(component.component_name ?? component.name ?? item.component_name ?? item.name ?? "").trim().toLowerCase();
      const type = String(component.component_type ?? item.component_type ?? "").trim().toUpperCase();
      const amount = Number(componentAmounts?.[String(item.component_id ?? item.component?.id ?? item.id)] ?? item.value ?? item.default_value ?? item.amount ?? 0) || 0;
      const isBasic = ["BS", "BASIC", "BASIC_SALARY"].includes(code) || /^basic(\s+salary)?$/.test(name);
      return { type, amount, isBasic };
    });
    const earnings = rows.filter((item) => item.type === "EARNING");
    const deductions = rows.filter((item) => item.type === "DEDUCTION");
    const basic = earnings.find((item) => item.isBasic)?.amount ?? 0;
    const gross = earnings.reduce((total, item) => total + item.amount, 0);
    const totalDeductions = deductions.reduce((total, item) => total + item.amount, 0);
    return {
      basic,
      totalAllowances: gross - basic,
      gross,
      totalDeductions,
      net: gross - totalDeductions,
    };
  }

  // Compatibility for the existing fixed-column CSV import preview.
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
  return { basic, hra, otherAllowances, bonus, totalAllowances, gross, pf, insurance, otherDeductions, totalDeductions, net: gross - totalDeductions };
};

const getDynamicAmounts = (items = [], valueKey = "value") => Object.fromEntries(
  (Array.isArray(items) ? items : []).map((item) => [
    String(item.component_id ?? item.component?.id ?? item.id),
    String(item[valueKey] ?? item.value ?? item.default_value ?? 0),
  ])
);

const getActiveComponents = (components = []) => components.filter((component) => component.is_active !== false);
const getComponentId = (component) => String(component.id ?? component.component_id ?? "");
const getComponentName = (component) => component.component_name ?? component.name ?? component.code ?? "Salary Component";
const getComponentType = (component) => String(component.component_type ?? "").toUpperCase();

const getStructureStatus = (structureOrDate) => {
  const structure =
    structureOrDate && typeof structureOrDate === "object"
      ? structureOrDate
      : null;
  const backendStatus = String(structure?.status || "").toUpperCase();

  if (backendStatus === "INACTIVE") return "Inactive";
  if (backendStatus === "SUPERSEDED") return "Superseded";

  const effectiveDate = structure ? structure.effectiveDate : structureOrDate;
  if (effectiveDate > getLocalDate()) return "Upcoming";
  return "Active";
};


const EMPTY_TEMPLATE = { name: "", description: "", componentAmounts: {} };

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
  const notify = useCallback(
    (type, message) => showNotification({ type, message }),
    [showNotification]
  );

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState(false);
  const [fieldSalesEmployees, setFieldSalesEmployees] = useState([]);
  const [fieldSalesEmployeesLoading, setFieldSalesEmployeesLoading] = useState(true);
  const [fieldSalesEmployeesError, setFieldSalesEmployeesError] = useState(false);

  const [structures, setStructures] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [salaryComponents, setSalaryComponents] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  const [activeTab, setActiveTab] = useState("structures");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [bulkDepartment, setBulkDepartment] = useState("");
  const [bulkTemplateId, setBulkTemplateId] = useState("");
  const [bulkEffectiveDate, setBulkEffectiveDate] = useState(getLocalDate());
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState({ ...EMPTY_TEMPLATE });
  const [templateError, setTemplateError] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const csvInputRef = useRef(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvImportFile, setCsvImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    effectiveDate: getLocalDate(),
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingStructureId, setDeletingStructureId] = useState(null);

  const loadStructuresAndTemplates = useCallback(async () => {
    setDataLoading(true);
    setDataError("");
    try {
      const [structureResponse, templateResponse, componentResponse] = await Promise.all([
        getSalaryStructures(),
        getSalaryTemplates(),
        getSalaryComponents(),
      ]);
      const componentList = unwrapList(componentResponse);
      setSalaryComponents(componentList);
      setStructures(
        unwrapList(structureResponse).map((item) => normalizeStructure(item, componentList))
      );
      setTemplates(
        unwrapList(templateResponse).map((item) => normalizeTemplate(item, componentList))
      );
    } catch (error) {
      console.error("Failed to load salary structures and templates:", error);
      setStructures([]);
      setTemplates([]);
      setDataError("Unable to load salary structures and templates.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadStructuresAndTemplates);
  }, [loadStructuresAndTemplates]);

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
          notify("error", "Unable to load employees. Please try again.");
        }
      } finally {
        if (mounted) setEmployeesLoading(false);
      }
    };

    loadEmployees();

    return () => {
      mounted = false;
    };
  }, [notify]);

  useEffect(() => {
    let mounted = true;

    const loadFieldSalesEmployees = async () => {
      setFieldSalesEmployeesLoading(true);
      try {
        const response = await getFieldSalesEmployees();
        const employeeList = unwrapList(response);
        if (mounted) {
          setFieldSalesEmployees(employeeList);
          setFieldSalesEmployeesError(false);
        }
      } catch (error) {
        console.error("Failed to load Field Sales employees:", error);
        if (mounted) {
          setFieldSalesEmployees([]);
          setFieldSalesEmployeesError(true);
        }
      } finally {
        if (mounted) setFieldSalesEmployeesLoading(false);
      }
    };

    void loadFieldSalesEmployees();
    return () => {
      mounted = false;
    };
  }, []);

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
        .map((employee) => {
          const dept = getEmployeeDepartment(employee);
          const isSales = String(dept).toLowerCase().includes("sales");
          return {
            value: String(employee.id),
            label: `${getEmployeeName(employee)} (${getEmployeeCode(employee)})${isSales ? " [Sales]" : ""}`,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [employees]
  );

  // Department-first selection: don't render the employee list until a department is chosen.
  const departmentOptions = useMemo(() => {
    const departments = new Set();

    employeeOptions.forEach((option) => {
      const employee = employeeMap.get(option.value);
      const department = getEmployeeDepartment(employee);
      departments.add(department === "—" ? "Unassigned" : department.trim());
    });

    return [...departments]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((department) => ({ value: department, label: department }));
  }, [employeeOptions, employeeMap]);

  const departmentEmployeeOptions = useMemo(() => {
    if (!bulkDepartment) return [];

    return employeeOptions.filter((option) => {
      const department = getEmployeeDepartment(employeeMap.get(option.value));
      const normalizedDepartment = department === "—" ? "Unassigned" : department.trim();
      return normalizedDepartment === bulkDepartment;
    });
  }, [bulkDepartment, employeeOptions, employeeMap]);

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
          getStructureStatus(structure).toUpperCase() ===
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
      const status = getStructureStatus(structure);
      if (status === "Active") {
        activeStructures += 1;
        activeEmployeeIds.add(String(structure.employeeId));
      } else if (status === "Upcoming") {
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
          const salary = calculateSalary(structure, salaryComponents);

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

  const openCreateDrawer = (defaultEmployeeId = null) => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      employeeId: defaultEmployeeId ? String(defaultEmployeeId) : "",
      effectiveDate: getLocalDate(),
      componentAmounts: Object.fromEntries(getActiveComponents(salaryComponents).map((component) => [getComponentId(component), String(component.default_value ?? 0)])),
    });
    setErrors({});
    setDrawerOpen(true);
  };

  const openEditDrawer = (structure) => {
    setEditingId(structure.id);

    setForm({
      employeeId: String(structure.employeeId),
      effectiveDate: structure.effectiveDate,
      componentAmounts: getDynamicAmounts(structure.items, "value"),
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
    if (getActiveComponents(salaryComponents).length === 0) {
      nextErrors.form = "No active salary components are configured. Add salary components before creating a structure.";
    }

    getActiveComponents(salaryComponents).forEach((component) => {
      const id = getComponentId(component);
      const value = form.componentAmounts?.[id] ?? component.default_value ?? 0;
      if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        nextErrors[`component_${id}`] = `${getComponentName(component)} must be a valid non-negative amount.`;
      }
    });

    const salary = calculateSalary(form, salaryComponents);

    if (
      Number.isFinite(salary.gross) &&
      Number.isFinite(salary.totalDeductions) &&
      salary.totalDeductions > salary.gross
    ) {
      nextErrors.form = "Total deductions cannot exceed gross salary.";
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

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving || !validateForm()) return;

    const salary = calculateSalary(form, salaryComponents);

    const existingItems = structures.find((item) => item.id === editingId)?.items ?? [];
    const payload = {
      employee: Number(form.employeeId),
      effective_from: form.effectiveDate,
      items: getActiveComponents(salaryComponents).map((component) => {
        const existingItem = existingItems.find((item) => String(item.component_id ?? item.component?.id) === String(component.id));
        const amount = form.componentAmounts?.[getComponentId(component)] ?? existingItem?.value ?? component.default_value ?? 0;
        return {
          component_id: Number(component.id),
          value: String(Number(amount) || 0),
          ...(existingItem?.calculation_config_override ? { calculation_config_override: existingItem.calculation_config_override } : {}),
        };
      }),
    };

    setSaving(true);
    try {
      if (editingId !== null && editingId !== undefined) {
        await patchSalaryStructure(editingId, payload);
      } else {
        await createSalaryStructure(payload);
      }

      setDrawerOpen(false);
      setEditingId(null);
      setErrors({});
      setForm({ ...EMPTY_FORM, effectiveDate: getLocalDate(), componentAmounts: Object.fromEntries(getActiveComponents(salaryComponents).map((component) => [getComponentId(component), String(component.default_value ?? 0)])) });
      notify("success", editingId ? "Salary structure updated." : "Salary structure created.");
      await loadStructuresAndTemplates();
    } catch (error) {
      console.error("Failed to save salary structure:", error);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to save the salary structure.";
      setErrors((current) => ({ ...current, form: message }));
      notify("error", message);
    } finally {
      setSaving(false);
    }
  };

  const deleteStructure = async (structure) => {
    if (!window.confirm("Delete this salary structure? This action cannot be undone.")) {
      return;
    }

    setDeletingStructureId(structure.id);
    try {
      await deleteSalaryStructure(structure.id);
      notify("success", "Salary structure deleted.");
      await loadStructuresAndTemplates();
    } catch (error) {
      console.error("Failed to delete salary structure:", error);
      notify(
        "error",
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to delete the salary structure."
      );
    } finally {
      setDeletingStructureId(null);
    }
  };

  const openTemplateDrawer = (template = null) => {
    setEditingTemplateId(template?.id ?? null);
    setTemplateForm(template ? {
      name: template.name,
      description: template.description || "",
      componentAmounts: getDynamicAmounts(template.components, "default_value"),
    } : {
      ...EMPTY_TEMPLATE,
      componentAmounts: Object.fromEntries(getActiveComponents(salaryComponents).map((component) => [getComponentId(component), String(component.default_value ?? 0)])),
    });
    setTemplateError("");
    setTemplateDrawerOpen(true);
  };

  const saveTemplate = async (event) => {
    event.preventDefault();

    if (!templateForm.name.trim()) {
      setTemplateError("Enter a template name.");
      return;
    }
    if (salaryComponents.length === 0) {
      setTemplateError("Load salary components before creating a template.");
      return;
    }

    for (const component of getActiveComponents(salaryComponents)) {
      const value = templateForm.componentAmounts?.[getComponentId(component)] ?? component.default_value ?? 0;
      if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        setTemplateError(`${getComponentName(component)} must be a valid non-negative amount.`);
        return;
      }
    }

    const salary = calculateSalary(templateForm, salaryComponents);

    if (salary.totalDeductions > salary.gross) {
      setTemplateError("Total deductions cannot exceed gross salary.");
      return;
    }

    const existingComponents = templates.find(
      (template) => template.id === editingTemplateId
    )?.components ?? [];
    const payload = {
      name: templateForm.name.trim(),
      description: templateForm.description.trim(),
      is_active: templates.find(
        (template) => String(template.id) === String(editingTemplateId)
      )?.is_active ?? true,
      components: getActiveComponents(salaryComponents).map((component) => {
        const existingComponent = existingComponents.find((item) => String(item.component_id ?? item.component?.id) === String(component.id));
        const amount = templateForm.componentAmounts?.[getComponentId(component)] ?? existingComponent?.default_value ?? component.default_value ?? 0;
        return {
          component_id: Number(component.id),
          default_value: String(Number(amount) || 0),
          ...(existingComponent?.calculation_config_override ? { calculation_config_override: existingComponent.calculation_config_override } : {}),
        };
      }),
    };

    setTemplateSaving(true);
    try {
      if (editingTemplateId !== null && editingTemplateId !== undefined) {
        await patchSalaryTemplate(editingTemplateId, payload);
      } else {
        await createSalaryTemplate(payload);
      }
      setTemplateDrawerOpen(false);
      setEditingTemplateId(null);
      setTemplateForm({ ...EMPTY_TEMPLATE, componentAmounts: Object.fromEntries(getActiveComponents(salaryComponents).map((component) => [getComponentId(component), String(component.default_value ?? 0)])) });
      notify("success", editingTemplateId ? "Salary template updated." : "Salary template created.");
      await loadStructuresAndTemplates();
    } catch (error) {
      console.error("Failed to save salary template:", error);
      setTemplateError(
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to save the salary template."
      );
    } finally {
      setTemplateSaving(false);
    }
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
    const departmentEmployeeIds = departmentEmployeeOptions.map((employee) => employee.value);
    const allDepartmentEmployeesSelected =
      departmentEmployeeIds.length > 0 &&
      departmentEmployeeIds.every((id) => selectedEmployees.includes(id));

    setSelectedEmployees(
      allDepartmentEmployeesSelected ? [] : departmentEmployeeIds
    );
  };

  const assignTemplate = async () => {
    setBulkError("");

    const template = templates.find(
      (item) => String(item.id) === String(bulkTemplateId)
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

    try {
      await bulkAssignSalaryTemplate({
        employee_ids: selectedEmployees.map(Number),
        template_id: Number(template.id),
        effective_from: bulkEffectiveDate,
      });
      setSelectedEmployees([]);
      setBulkTemplateId("");
      setActiveTab("structures");
      notify("success", "Salary template assignment completed.");
      await loadStructuresAndTemplates();
    } catch (error) {
      console.error("Failed to assign salary template:", error);
      setBulkError(
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to assign the salary template."
      );
    }
  };

  const deleteTemplate = async (templateId) => {
    const inUse = structures.some(
      (structure) => structure.templateId === templateId
    );

    if (inUse) {
      notify("error", "This template has been assigned to employees and cannot be deleted.");
      return;
    }

    if (!window.confirm("Delete this salary template?")) return;
    try {
      await deleteSalaryTemplate(templateId);
      notify("success", "Salary template deleted.");
      await loadStructuresAndTemplates();
    } catch (error) {
      console.error("Failed to delete salary template:", error);
      notify(
        "error",
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to delete the salary template."
      );
    }
  };


  const downloadImportTemplate = () => {
    downloadCSV("ignite_salary_import_template.csv", [
      CSV_IMPORT_HEADERS,
    ]);
  };

  const exportStructures = async () => {
    try {
      const blob = await exportSalaryStructures();
      triggerBlobDownload(blob, "ignite_salary_structures.csv");
      notify("success", "Salary structures exported.");
    } catch (error) {
      console.error("Failed to export salary structures:", error);
      notify(
        "error",
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to export salary structures."
      );
    }
  };

  const handleCSVFile = async (event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again.
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      notify("error", "Please select a CSV file.");
      return;
    }

    try {
      const text = await file.text();
      const parsedRows = parseCSV(text);
      setCsvImportFile(file);

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
        notify("error", "No importable rows were found.");
      }
    } catch (error) {
      setCsvPreview([]);
      setCsvErrors([]);
      setCsvImportFile(null);
      notify(
        "error",
        error instanceof Error ? error.message : "Could not read the CSV file."
      );
    }
  };

  const importValidCSVRows = async () => {
    const validRows = csvPreview.filter((row) => row.issues.length === 0);

    if (validRows.length === 0) {
      notify("error", "There are no valid rows to import.");
      return;
    }

    const csvRows = [
      CSV_IMPORT_HEADERS,
      ...validRows.map((row) => [
        row.employeeCode,
        row.effectiveDate,
        row.basic,
        row.hra,
        row.otherAllowances,
        row.bonus,
        row.pf,
        row.insurance,
        row.otherDeductions,
      ]),
    ];
    const csvContent = csvRows
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");
    const upload = new File(
      [csvContent],
      csvImportFile?.name || "salary_structures.csv",
      { type: "text/csv" }
    );

    setImporting(true);
    try {
      await importSalaryStructures(upload);
      setCsvPreview([]);
      setCsvErrors([]);
      setCsvImportFile(null);
      notify("success", "Salary structure import completed.");
      await loadStructuresAndTemplates();
    } catch (error) {
      console.error("Failed to import salary structures:", error);
      notify(
        "error",
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to import salary structures."
      );
    } finally {
      setImporting(false);
    }
  };


  const currentSalary = calculateSalary(form, salaryComponents);

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


      {dataError && (
        <div className="salary-page-state" role="alert">
          <h3>Could not load payroll data</h3>
          <p>{dataError}</p>
          <Button variant="secondary" onClick={loadStructuresAndTemplates}>
            <RefreshCw size={16} /> Retry
          </Button>
        </div>
      )}

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

      <Card
        className="salary-structures-card"
        title={`Field Sales Employees${fieldSalesEmployeesLoading ? " (loading…)" : ` (${fieldSalesEmployees.length})`}`}
        description="All Field Sales employees are automatically synchronized with HRMS under the Sales department and can be assigned individual or bulk salary structures."
      >
        {fieldSalesEmployeesLoading ? (
          <p>Loading Field Sales employees…</p>
        ) : fieldSalesEmployeesError ? (
          <div className="salary-page-state" role="status">
            <p>Could not fetch Field Sales employees. HRMS payroll data remains available.</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} /> Retry
            </Button>
          </div>
        ) : fieldSalesEmployees.length === 0 ? (
          <p>No Field Sales employee records were returned by the API.</p>
        ) : (
          <div className="salary-table-wrapper">
            <table className="salary-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee Code</th>
                  <th>Designation / Role</th>
                  <th>HRMS Status</th>
                  <th>Payroll Structure</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {fieldSalesEmployees.map((fsEmp) => {
                  const linkedEmpId = fsEmp.employee_id || fsEmp.employee?.id || fsEmp.employee;
                  const linkedHrms =
                    (linkedEmpId ? employeeMap.get(String(linkedEmpId)) : null) ||
                    employees.find(
                      (e) =>
                        e.email &&
                        fsEmp.email &&
                        e.email.trim().toLowerCase() === fsEmp.email.trim().toLowerCase()
                    );
                  const effectiveEmpId = linkedHrms?.id || linkedEmpId;
                  const assignedStructure = effectiveEmpId
                    ? structures.find((s) => String(s.employeeId) === String(effectiveEmpId))
                    : null;

                  return (
                    <tr key={fsEmp.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong>{fsEmp.full_name || getEmployeeName(fsEmp)}</strong>
                          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #64748b)" }}>
                            {fsEmp.email || "—"}
                          </span>
                        </div>
                      </td>
                      <td>{fsEmp.employee_code || (linkedHrms ? getEmployeeCode(linkedHrms) : `FS-${fsEmp.id}`)}</td>
                      <td>{fsEmp.designation_name || (fsEmp.role === "manager" ? "Sales Manager" : "Sales Person")}</td>
                      <td>
                        <span className={`salary-badge ${linkedHrms ? "is-active" : "is-pending"}`}>
                          {linkedHrms ? "Synced (Sales)" : "Sync Pending"}
                        </span>
                      </td>
                      <td>
                        {assignedStructure ? (
                          <span className="salary-badge is-active">
                            Assigned {assignedStructure.netPay ? `(₹${Number(assignedStructure.netPay).toLocaleString("en-IN")})` : ""}
                          </span>
                        ) : (
                          <span className="salary-badge is-pending">Not Assigned</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {assignedStructure ? (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => openEditDrawer(assignedStructure)}
                          >
                            <Pencil size={14} /> Edit Structure
                          </Button>
                        ) : effectiveEmpId ? (
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => openCreateDrawer(effectiveEmpId)}
                          >
                            <Plus size={14} /> Assign Structure
                          </Button>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>
                            Syncing...
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
                  const salary = calculateSalary(row, salaryComponents);

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
              disabled={importing || !csvPreview.some((row) => row.issues.length === 0)}
            >
              <Upload size={16} />
              {importing
                ? "Importing..."
                : `Import Valid Rows (${csvPreview.filter((row) => row.issues.length === 0).length})`}
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
                { value: "INACTIVE", label: "Inactive" },
                { value: "SUPERSEDED", label: "Superseded" },
              ]}
              placeholder="Filter status"
            />
          </div>

          {dataLoading ? (
            <div className="salary-page-state">
              <span className="salary-loading-spinner" />
              <p>Loading salary structures...</p>
            </div>
          ) : employeesLoading ? (
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
                onClick={async () => {
                  setEmployeesError(false);
                  try {
                    const employeeList = await employeeService.getAll();
                    setEmployees(employeeList);
                  } catch (error) {
                    console.error("Failed to reload employees:", error);
                    setEmployeesError(true);
                    notify("error", "Unable to load employees. Please try again.");
                  }
                }}
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
                      {getActiveComponents(salaryComponents).map((component) => (
                        <th className="salary-table__amount" key={getComponentId(component)}>{getComponentName(component)}</th>
                      ))}
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
                      const salary = calculateSalary(structure, salaryComponents);
                      const structureItems = Array.isArray(structure.items) ? structure.items : [];
                      const status = getStructureStatus(structure);

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
                          {getActiveComponents(salaryComponents).map((component) => {
                            const item = structureItems.find((entry) => String(entry.component_id ?? entry.component?.id) === getComponentId(component));
                            return <td className="salary-table__amount" key={getComponentId(component)}>{formatCurrency(item?.value ?? 0)}</td>;
                          })}
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
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={deletingStructureId === structure.id}
                              onClick={() => deleteStructure(structure)}
                              aria-label={`Delete salary structure for ${getEmployeeName(employee)}`}
                            >
                              <Trash2 size={14} />
                              {deletingStructureId === structure.id ? "Deleting..." : "Delete"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3 + getActiveComponents(salaryComponents).length}>
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
          {dataLoading ? (
            <div className="salary-page-state">
              <span className="salary-loading-spinner" />
              <p>Loading salary templates...</p>
            </div>
          ) : templates.length === 0 ? (
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
                const salary = calculateSalary(template, salaryComponents);

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
                        <span>Gross earnings</span>
                        <strong>{formatCurrency(salary.gross)}</strong>
                      </div>
                      <div>
                        <span>Other earnings</span>
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

            <div style={{ maxWidth: 420, marginBottom: 20 }}>
              <FormField label="Department" required>
                <Select
                  value={bulkDepartment}
                  onChange={(value) => {
                    setBulkDepartment(value);
                    setSelectedEmployees([]);
                    setBulkError("");
                  }}
                  options={departmentOptions}
                  placeholder="Choose a department first"
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
                  {!bulkDepartment
                    ? "Choose a department to view employees"
                    : `${selectedEmployees.length} of ${departmentEmployeeOptions.length} selected`}
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={toggleAllEmployees}
                disabled={
                  employeesLoading ||
                  !bulkDepartment ||
                  departmentEmployeeOptions.length === 0
                }
              >
                <CheckSquare size={15} />
                {departmentEmployeeOptions.length > 0 &&
                  departmentEmployeeOptions.every((employee) =>
                    selectedEmployees.includes(employee.value)
                  )
                  ? "Clear Selection"
                  : "Select All in Department"}
              </Button>
            </div>

            <div className="salary-bulk-employee-list">
              {employeesLoading ? (
                <p>Loading employees...</p>
              ) : !bulkDepartment ? (
                <p>Select a department above to view its employees.</p>
              ) : departmentEmployeeOptions.length === 0 ? (
                <p>No active employees found in this department.</p>
              ) : (
                departmentEmployeeOptions.map((option) => {
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

              const salary = calculateSalary(template, salaryComponents);

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

          {salaryComponents.length === 0 ? (
            <div className="salary-page-state"><p>No salary components are configured. Add active salary components in Account settings first.</p></div>
          ) : (
            <>
              {["EARNING", "DEDUCTION"].map((type) => {
                const components = getActiveComponents(salaryComponents).filter((component) => getComponentType(component) === type);
                if (!components.length) return null;
                return (
                  <div className="salary-form-section" key={type}>
                    <h3>{type === "EARNING" ? "Earnings" : "Deductions"}</h3>
                    <p>{type === "EARNING" ? "Monthly earning components configured for your company." : "Monthly deduction components configured for your company."}</p>
                    <div className="salary-form-grid">
                      {components.map((component) => {
                        const id = getComponentId(component);
                        return (
                          <FormField label={getComponentName(component)} key={id} error={errors[`component_${id}`]}>
                            <div className="salary-input-with-prefix">
                              <span>₹</span>
                              <input type="number" min="0" step="0.01" value={form.componentAmounts?.[id] ?? component.default_value ?? "0"}
                                onChange={(event) => setForm((current) => ({ ...current, componentAmounts: { ...(current.componentAmounts || {}), [id]: event.target.value } }))}
                                placeholder="0.00" />
                            </div>
                          </FormField>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {errors.form && <p className="salary-bulk-error" role="alert">{errors.form}</p>}

          <div className="salary-calculation-panel">
            <div>
              <span>Other Earnings</span>
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
            Gross is the sum of configured earning components. Net = Gross − total configured deductions. Verify applicable payroll and statutory rules before using these figures for actual payroll.
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
            <Button onClick={saveTemplate} disabled={templateSaving}>
              {templateSaving
                ? "Saving..."
                : editingTemplateId
                  ? "Save Changes"
                  : "Create Template"}
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

          {salaryComponents.length === 0 ? (
            <div className="salary-page-state"><p>No salary components are configured. Add active salary components in Account settings first.</p></div>
          ) : (
            <>
              {["EARNING", "DEDUCTION"].map((type) => {
                const components = getActiveComponents(salaryComponents).filter((component) => getComponentType(component) === type);
                if (!components.length) return null;
                return (
                  <div className="salary-form-section" key={type}>
                    <h3>{type === "EARNING" ? "Earnings" : "Deductions"}</h3>
                    <div className="salary-form-grid">
                      {components.map((component) => {
                        const id = getComponentId(component);
                        return (
                          <FormField label={getComponentName(component)} key={id}>
                            <div className="salary-input-with-prefix">
                              <span>₹</span>
                              <input type="number" min="0" step="0.01" value={templateForm.componentAmounts?.[id] ?? component.default_value ?? "0"}
                                onChange={(event) => setTemplateForm((current) => ({ ...current, componentAmounts: { ...(current.componentAmounts || {}), [id]: event.target.value } }))}
                                placeholder="0.00" />
                            </div>
                          </FormField>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {templateError && (
            <p className="salary-bulk-error" role="alert">
              {templateError}
            </p>
          )}

          <div className="salary-calculation-panel">
            <div>
              <span>Gross Monthly Salary</span>
              <strong>
                {formatCurrency(calculateSalary(templateForm, salaryComponents).gross)}
              </strong>
            </div>
            <div>
              <span>Total Deductions</span>
              <strong className="salary-calculation-panel__deductions">
                {formatCurrency(
                  calculateSalary(templateForm, salaryComponents).totalDeductions
                )}
              </strong>
            </div>
            <div className="salary-calculation-panel__net">
              <span>Net Monthly Salary</span>
              <strong>
                {formatCurrency(calculateSalary(templateForm, salaryComponents).net)}
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
