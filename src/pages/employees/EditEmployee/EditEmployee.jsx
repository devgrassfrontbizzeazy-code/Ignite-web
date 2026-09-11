import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiAlertCircle, FiArrowLeft, FiEdit2 } from "react-icons/fi";

import EmployeeForm from "../../../components/employees/EmployeeForm/EmployeeForm";
import employeeService from "../../../services/employeeService";

import "./EditEmployee.css";

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [serverErrors, setServerErrors] = useState({});

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await employeeService.getById(id);
        setEmployee(data);
      } catch (err) {
        console.error("Failed to load employee:", err);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError("");
      setServerErrors({});

      await employeeService.update(id, formData);
      navigate("/employees");
    } catch (err) {
      console.error("Failed to update employee:", err);
      const data = err.response?.data;
      let errMsg = "Unable to update employee. Please check the form data.";
      const fieldErrors = {};

      const rawErrors = data?.errors || (typeof data === "object" && !data?.message && !data?.detail ? data : null);
      if (rawErrors && typeof rawErrors === "object") {
        for (const [key, val] of Object.entries(rawErrors)) {
          const messageStr = Array.isArray(val) ? val[0] : (typeof val === "object" ? Object.values(val)[0] : String(val));
          fieldErrors[key] = messageStr;
        }

        const entries = Object.entries(fieldErrors);
        if (entries.length > 0) {
          const [firstField, firstMsg] = entries[0];
          const fieldLabel = firstField.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          errMsg = `${fieldLabel}: ${firstMsg}`;
        }
      } else if (data?.message && data.message !== "Validation failed.") {
        errMsg = data.message;
      } else if (data?.detail) {
        errMsg = data.detail;
      }

      setError(errMsg);
      setServerErrors(fieldErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-employee-page__loading">Loading employee details...</div>
    );
  }

  if (!employee) {
    return (
      <div className="edit-employee-page__not-found">
        <h2>Employee not found</h2>
        <button type="button" onClick={() => navigate("/employees")}>
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div className="edit-employee-page">
      <div className="edit-employee-page__top">
        <button
          type="button"
          className="edit-employee-page__back"
          onClick={() => navigate("/employees")}
        >
          <FiArrowLeft />
          Back to Employees
        </button>
      </div>

      <div className="edit-employee-page__heading">
        <div className="edit-employee-page__icon">
          <FiEdit2 />
        </div>

        <div>
          <h1>Edit Employee</h1>
          <p>
            Update {employee.first_name} {employee.last_name}'s profile and
            organization settings.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "24px",
            fontSize: "14px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.08)",
          }}
        >
          <FiAlertCircle style={{ fontSize: "20px", marginTop: "2px", flexShrink: 0, color: "#dc2626" }} />
          <div>
            <strong style={{ display: "block", marginBottom: "3px", color: "#991b1b" }}>Error Updating Employee</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <EmployeeForm
        mode="edit"
        initialData={employee}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/employees")}
        submitting={submitting}
        serverErrors={serverErrors}
      />
    </div>
  );
};

export default EditEmployee;