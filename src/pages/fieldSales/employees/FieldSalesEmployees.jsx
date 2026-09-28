import { useMemo, useState } from "react";
import { FiPlus, FiUsers } from "react-icons/fi";

import Button from "../../../components/common/Button/Button";
import EmployeeStats from "../../../components/employees/EmployeeStats/EmployeeStats";
import Modal from "../../../components/common/Modal/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal/ConfirmModal";
import SearchInput from "../../../components/common/SearchInput/SearchInput";

import FieldSalesEmployeeForm from "../../../components/fieldSales/employees/FieldSalesEmployeeForm/FieldSalesEmployeeForm";
import FieldSalesEmployeeTable from "../../../components/fieldSales/employees/FieldSalesEmployeeTable/FieldSalesEmployeeTable";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../../utils/permissionUtils";

import "./FieldSalesEmployees.css";

/*
 * MOCK FIELD SALES EMPLOYEES
 *
 * Frontend-only for now.
 * Replace with Field Sales API later.
 */
const INITIAL_EMPLOYEES = [
    {
        id: 1,
        employee_code: "FS-1001",
        first_name: "Rahul",
        middle_name: "",
        last_name: "Sharma",
        email: "rahul.sharma@company.com",
        phone: "9876543210",
        date_of_birth: "1995-04-12",
        gender: "Male",
        address: "Delhi, India",

        role: "Manager",
        field_sales_role: "Manager",

        reporting_manager_id: null,
        reporting_manager: null,

        employment_status: "Active",
        is_active: true,
    },

    {
        id: 2,
        employee_code: "FS-1002",
        first_name: "Amit",
        middle_name: "",
        last_name: "Kumar",
        email: "amit.kumar@company.com",
        phone: "9876543211",
        date_of_birth: "1998-08-20",
        gender: "Male",
        address: "Gurugram, Haryana",

        role: "Executive",
        field_sales_role: "Executive",

        reporting_manager_id: 1,
        reporting_manager: "Rahul Sharma",

        employment_status: "Active",
        is_active: true,
    },

    {
        id: 3,
        employee_code: "FS-1003",
        first_name: "Priya",
        middle_name: "",
        last_name: "Verma",
        email: "priya.verma@company.com",
        phone: "9876543212",
        date_of_birth: "1997-02-15",
        gender: "Female",
        address: "Noida, Uttar Pradesh",

        role: "Executive",
        field_sales_role: "Executive",

        reporting_manager_id: 1,
        reporting_manager: "Rahul Sharma",

        employment_status: "Active",
        is_active: true,
    },
];

/*
 * HELPERS
 */

const getEmployeeName = (employee) =>
    [
        employee?.first_name,
        employee?.middle_name,
        employee?.last_name,
    ]
        .filter(Boolean)
        .join(" ") || employee?.full_name || "Employee";

/*
 * PAGE
 */

export default function FieldSalesEmployees() {
    /*
     * EMPLOYEE DATA
     */
    const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
    const navigate = useNavigate();

    /*
     * SEARCH
     */
    const [search, setSearch] = useState("");

    /*
     * ADD / EDIT FORM
     */
    const [formOpen, setFormOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    /*
     * DELETE
     */
    const [deleteEmployee, setDeleteEmployee] = useState(null);

    /*
     * LOADING
     *
     * Backend is not connected yet.
     */
    const loading = false;

    /*
     * FIELD SALES MANAGERS
     *
     * Used by Reporting Manager dropdown.
     */
    const managers = useMemo(
        () =>
            employees
                .filter(
                    (employee) =>
                        employee.field_sales_role === "Manager" ||
                        employee.role === "Manager"
                )
                .map((employee) => ({
                    id: employee.id,
                    full_name: getEmployeeName(employee),
                })),
        [employees]
    );

    const currentUser = getCurrentUser();

    const isOwner =
        currentUser?.role === "OWNER" ||
        currentUser?.role_code === "OWNER" ||
        currentUser?.is_owner === true;

    /*
     * FILTER EMPLOYEES
     */
    const filteredEmployees = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return employees;
        }

        return employees.filter((employee) => {
            const name = getEmployeeName(employee).toLowerCase();

            return (
                name.includes(query) ||
                employee.email?.toLowerCase().includes(query) ||
                employee.phone?.includes(query) ||
                employee.employee_code?.toLowerCase().includes(query) ||
                employee.field_sales_role?.toLowerCase().includes(query)
            );
        });
    }, [employees, search]);

    /*
     * STATS
     */
    const stats = useMemo(() => {
        const total = employees.length;

        const active = employees.filter(
            (employee) =>
                employee.is_active === true ||
                employee.employment_status === "Active"
        ).length;

        const pending = 0;

        const inactive = employees.filter(
            (employee) =>
                employee.is_active === false ||
                employee.employment_status !== "Active"
        ).length;

        return {
            total,
            active,
            pending,
            inactive,
        };
    }, [employees]);

    /*
     * CURRENT DATE
     *
     * Same presentation as HRMS Employees page.
     */
    const formattedDate = new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date());

    /*
     * ADD EMPLOYEE
     */
    const handleAddEmployee = () => {
        setEditingEmployee(null);
        setFormOpen(true);
    };

    /*
     * EDIT EMPLOYEE
     */
    const handleEditEmployee = (employee) => {
        setEditingEmployee(employee);
        setFormOpen(true);
    };

    /*
     * VIEW EMPLOYEE
     *
     * Details screen can be added later.
     */
    const handleViewEmployee = (employee) => {
        console.log("View Field Sales Employee:", employee);
    };

    /*
     * CREATE / UPDATE EMPLOYEE
     */
    const handleSubmit = async (payload) => {
        setSubmitting(true);

        try {
            /*
             * EDIT
             */
            if (editingEmployee) {
                setEmployees((prev) =>
                    prev.map((employee) =>
                        employee.id === editingEmployee.id
                            ? {
                                ...employee,
                                ...payload,

                                role: payload.role,
                                field_sales_role: payload.role,

                                reporting_manager:
                                    payload.reporting_manager
                                        ? managers.find(
                                            (manager) =>
                                                manager.id === payload.reporting_manager
                                        )?.full_name || null
                                        : null,

                                reporting_manager_id:
                                    payload.reporting_manager || null,

                                is_active: employee.is_active,
                                employment_status: employee.employment_status,
                            }
                            : employee
                    )
                );
            }

            /*
             * CREATE
             */
            else {
                const newEmployee = {
                    id: Date.now(),

                    ...payload,

                    role: payload.role,
                    field_sales_role: payload.role,

                    reporting_manager:
                        payload.reporting_manager
                            ? managers.find(
                                (manager) =>
                                    manager.id === payload.reporting_manager
                            )?.full_name || null
                            : null,

                    reporting_manager_id:
                        payload.reporting_manager || null,

                    is_active: true,
                    employment_status: "Active",
                };

                setEmployees((prev) => [...prev, newEmployee]);
            }

            setFormOpen(false);
            setEditingEmployee(null);
        } finally {
            setSubmitting(false);
        }
    };

    /*
     * TOGGLE STATUS
     */
    const handleToggleStatus = (employee) => {
        setEmployees((prev) =>
            prev.map((item) =>
                item.id === employee.id
                    ? {
                        ...item,

                        is_active: !item.is_active,

                        employment_status: item.is_active
                            ? "Inactive"
                            : "Active",
                    }
                    : item
            )
        );
    };

    /*
     * DELETE EMPLOYEE
     */
    const handleDelete = () => {
        if (!deleteEmployee) return;

        setEmployees((prev) =>
            prev.filter(
                (employee) => employee.id !== deleteEmployee.id
            )
        );

        setDeleteEmployee(null);
    };

    return (
        <main className="employees-page fs-employees-page">

            {/* ================= HEADER ================= */}

            <header className="employees-page__header">
                <div>
                    <span className="employees-page__eyebrow">
                        FIELD SALES
                    </span>

                    <h1>Employees</h1>

                    <p>
                        Manage employees working in the Field Sales workspace.
                    </p>
                </div>

                <div className="employees-page__header-actions">

                    {isOwner && (
                        <div className="employees-page__workspace-toggle">

                            <button
                                type="button"
                                className="employees-page__workspace-option"
                                onClick={() => navigate("/employees")}
                            >
                                HRMS
                            </button>

                            <button
                                type="button"
                                className="employees-page__workspace-option employees-page__workspace-option--active"
                            >
                                Field Sales
                            </button>

                        </div>
                    )}

                    <div className="employees-page__date">
                        <FiUsers />
                        <span>{formattedDate}</span>
                    </div>

                    <Button
                        variant="primary"
                        icon={<FiPlus size={16} />}
                        onClick={handleAddEmployee}
                    >
                        + Add Employee
                    </Button>

                </div>
            </header>

            {/* ================= STATS ================= */}

            <EmployeeStats stats={stats} />

            {/* ================= SEARCH ================= */}

            <section className="fs-employees-page__filters">
                <div className="fs-employees-page__search">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Search employees..."
                    />
                </div>
            </section>

            {/* ================= TABLE ================= */}

            <section className="employees-page__content">

                <FieldSalesEmployeeTable
                    employees={filteredEmployees}
                    loading={loading}
                    onView={handleViewEmployee}
                    onEdit={handleEditEmployee}
                    onToggleStatus={handleToggleStatus}
                    onDelete={setDeleteEmployee}
                />

            </section>

            {/* ================= ADD / EDIT MODAL ================= */}

            <Modal
                open={formOpen}
                onClose={() => {
                    if (!submitting) {
                        setFormOpen(false);
                        setEditingEmployee(null);
                    }
                }}
                title={
                    editingEmployee
                        ? "Edit Employee"
                        : "Add Field Sales Employee"
                }
                size="medium"
            >
                <FieldSalesEmployeeForm
                    mode={editingEmployee ? "edit" : "create"}
                    initialData={editingEmployee}
                    managers={managers}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setFormOpen(false);
                        setEditingEmployee(null);
                    }}
                    submitting={submitting}
                />
            </Modal>

            {/* ================= DELETE MODAL ================= */}

            <ConfirmModal
                open={Boolean(deleteEmployee)}
                onClose={() => setDeleteEmployee(null)}
                onConfirm={handleDelete}
                title="Delete Employee"
                itemName={
                    deleteEmployee
                        ? getEmployeeName(deleteEmployee)
                        : ""
                }
                description={
                    deleteEmployee
                        ? `Are you sure you want to delete ${getEmployeeName(
                            deleteEmployee
                        )}?`
                        : ""
                }
                confirmText="Delete"
                variant="danger"
            />

        </main>
    );
}
