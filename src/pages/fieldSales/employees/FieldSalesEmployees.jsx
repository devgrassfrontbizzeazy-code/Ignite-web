import { useEffect, useMemo, useState, useCallback } from "react";
import { FiPlus, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button/Button";
import EmployeeStats from "../../../components/employees/EmployeeStats/EmployeeStats";
import Modal from "../../../components/common/Modal/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal/ConfirmModal";
import SearchInput from "../../../components/common/SearchInput/SearchInput";

import FieldSalesEmployeeForm from "../../../components/fieldSales/employees/FieldSalesEmployeeForm/FieldSalesEmployeeForm";
import FieldSalesEmployeeTable from "../../../components/fieldSales/employees/FieldSalesEmployeeTable/FieldSalesEmployeeTable";
import { getCurrentUser, canCreateEmployees, canUpdateEmployees, canDeleteEmployees, isSuperOrAdmin } from "../../../utils/permissionUtils";
import { useNotification } from "../../../context/NotificationContext";
import {
    getFieldSalesEmployees,
    getFieldSalesManagers,
    createFieldSalesEmployee,
    updateFieldSalesEmployee,
    deleteFieldSalesEmployee,
    resendFieldSalesInvite,
} from "../../../services/api/fieldSalesAPI";

import "./FieldSalesEmployees.css";

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
    const navigate = useNavigate();
    const { notify } = useNotification();

    /*
     * EMPLOYEE DATA & API STATE
     */
    const [employees, setEmployees] = useState([]);
    const [managers, setManagers] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, inactive: 0 });
    const [loading, setLoading] = useState(true);
    const [serverErrors, setServerErrors] = useState({});

    /*
     * SEARCH & FILTER
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
     * LOAD DATA FROM BACKEND
     */
    const loadEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getFieldSalesEmployees();
            if (res?.data) {
                setEmployees(res.data);
            } else if (Array.isArray(res)) {
                setEmployees(res);
            }

            if (res?.stats) {
                setStats(res.stats);
            }
        } catch (err) {
            console.error("Failed to load field sales employees:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadManagers = useCallback(async () => {
        try {
            const res = await getFieldSalesManagers();
            if (res?.data) {
                setManagers(res.data);
            }
        } catch (err) {
            console.error("Failed to load managers:", err);
        }
    }, []);

    useEffect(() => {
        loadEmployees();
        loadManagers();
    }, [loadEmployees, loadManagers]);

    const currentUser = getCurrentUser();
    const isOwner =
        currentUser?.role === "OWNER" ||
        currentUser?.role_code === "OWNER" ||
        currentUser?.is_owner === true;

    // Check if user has permission to add employees (Managers without create_employee permission cannot add)
    const canAdd = isSuperOrAdmin(currentUser) || canCreateEmployees(currentUser);
    const canEdit = isSuperOrAdmin(currentUser) || canUpdateEmployees(currentUser);
    const canDelete = isSuperOrAdmin(currentUser) || canDeleteEmployees(currentUser);

    /*
     * FILTER EMPLOYEES
     */
    const filteredEmployees = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return employees;

        return employees.filter((employee) => {
            const name = getEmployeeName(employee).toLowerCase();
            return (
                name.includes(query) ||
                employee.email?.toLowerCase().includes(query) ||
                employee.phone?.includes(query) ||
                employee.employee_code?.toLowerCase().includes(query) ||
                employee.role?.toLowerCase().includes(query)
            );
        });
    }, [employees, search]);

    /*
     * CURRENT DATE DISPLAY
     */
    const formattedDate = new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date());

    /*
     * ADD / EDIT HANDLERS
     */
    const handleAddEmployee = () => {
        setEditingEmployee(null);
        setServerErrors({});
        setFormOpen(true);
    };

    const handleEditEmployee = (employee) => {
        setEditingEmployee(employee);
        setServerErrors({});
        setFormOpen(true);
    };

    const handleViewEmployee = (employee) => {
        console.log("View Field Sales Employee:", employee);
    };

    /*
     * CREATE / UPDATE SUBMIT
     */
    const handleSubmit = async (payload) => {
        setSubmitting(true);
        setServerErrors({});

        try {
            if (editingEmployee) {
                await updateFieldSalesEmployee(editingEmployee.id, payload);
                notify.success(`Employee ${payload.first_name || ""} updated successfully.`);
            } else {
                await createFieldSalesEmployee(payload);
                notify.success(`Employee created & invitation sent to ${payload.email}`);
            }
            await loadEmployees();
            await loadManagers();
            setFormOpen(false);
            setEditingEmployee(null);
        } catch (err) {
            console.error("Error saving employee:", err);
            if (err?.response?.data) {
                setServerErrors(err.response.data);
            }
            notify.error("Failed to save employee. Please check the form errors.");
        } finally {
            setSubmitting(false);
        }
    };

    /*
     * TOGGLE STATUS
     */
    const handleToggleStatus = async (employee) => {
        try {
            const newActive = !employee.is_active;
            await updateFieldSalesEmployee(employee.id, {
                is_active: newActive,
                employment_status: newActive ? "Active" : "Inactive",
            });
            await loadEmployees();
        } catch (err) {
            console.error("Error toggling employee status:", err);
        }
    };

    /*
     * RESEND INVITATION
     */
    const handleResendInvite = async (employee) => {
        try {
            await resendFieldSalesInvite(employee.id);
            notify.success(`Invitation resent successfully to ${employee.email}`);
        } catch (err) {
            console.error("Failed to resend invite:", err);
            notify.error("Failed to resend invitation. Please try again.");
        }
    };

    /*
     * DELETE EMPLOYEE
     */
    const handleDelete = async () => {
        if (!deleteEmployee) return;

        try {
            await deleteFieldSalesEmployee(deleteEmployee.id);
            notify.success(`Employee ${getEmployeeName(deleteEmployee)} deleted successfully.`);
            await loadEmployees();
            await loadManagers();
        } catch (err) {
            console.error("Error deleting employee:", err);
            notify.error("Failed to delete employee. Please try again.");
        } finally {
            setDeleteEmployee(null);
        }
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

                    {canAdd && (
                        <Button
                            variant="primary"
                            icon={<FiPlus size={16} />}
                            onClick={handleAddEmployee}
                        >
                            + Add Employee
                        </Button>
                    )}
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
                    onEdit={canEdit ? handleEditEmployee : undefined}
                    onToggleStatus={canEdit ? handleToggleStatus : undefined}
                    onDelete={canDelete ? setDeleteEmployee : undefined}
                    onResendInvite={canAdd ? handleResendInvite : undefined}
                />
            </section>

            {/* ================= ADD / EDIT MODAL ================= */}
            <Modal
                open={formOpen}
                onClose={() => {
                    if (!submitting) {
                        setFormOpen(false);
                        setEditingEmployee(null);
                        setServerErrors({});
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
                        setServerErrors({});
                    }}
                    submitting={submitting}
                    serverErrors={serverErrors}
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
