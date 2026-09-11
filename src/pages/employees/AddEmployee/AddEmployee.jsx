import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiUserPlus,
} from "react-icons/fi";

import EmployeeForm from "../../../components/employees/EmployeeForm/EmployeeForm";
import employeeService from "../../../services/employeeService";

import "./AddEmployee.css";

const AddEmployee = () => {
  const navigate = useNavigate();

  const handleSubmit = (formData) => {
    try {
      employeeService.create(formData);

      navigate("/employees");
    } catch (error) {
      console.error(
        "Failed to create employee:",
        error
      );

      window.alert(
        "Unable to create employee. Please try again."
      );
    }
  };

  return (
    <div className="add-employee-page">
      <div className="add-employee-page__top">
        <button
          type="button"
          className="add-employee-page__back"
          onClick={() => navigate("/employees")}
        >
          <FiArrowLeft />

          Back to Employees
        </button>
      </div>

      <div className="add-employee-page__heading">
        <div className="add-employee-page__icon">
          <FiUserPlus />
        </div>

        <div>
          <h1>Add Employee</h1>

          <p>
            Create a new employee profile and assign
            their organization details.
          </p>
        </div>
      </div>

      <EmployeeForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate("/employees")}
      />
    </div>
  );
};

export default AddEmployee;