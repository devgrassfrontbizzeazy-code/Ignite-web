import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FiArrowLeft,
  FiEdit2,
} from "react-icons/fi";

import EmployeeForm from "../../../components/employees/EmployeeForm/EmployeeForm";
import employeeService from "../../../services/employeeService";

import "./EditEmployee.css";

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    try {
      const data =
        employeeService.getById(id);

      setEmployee(data);
    } catch (error) {
      console.error(
        "Failed to load employee:",
        error
      );

      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleSubmit = (formData) => {
    try {
      employeeService.update(
        id,
        formData
      );

      navigate("/employees");
    } catch (error) {
      console.error(
        "Failed to update employee:",
        error
      );

      window.alert(
        "Unable to update employee. Please try again."
      );
    }
  };

  if (loading) {
    return (
      <div className="edit-employee-page__loading">
        Loading employee...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="edit-employee-page__not-found">
        <h2>Employee not found</h2>

        <button
          type="button"
          onClick={() => navigate("/employees")}
        >
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
            Update {employee.first_name}{" "}
            {employee.last_name}'s employee
            information.
          </p>
        </div>
      </div>

      <EmployeeForm
        mode="edit"
        initialData={employee}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate("/employees")
        }
      />
    </div>
  );
};

export default EditEmployee;