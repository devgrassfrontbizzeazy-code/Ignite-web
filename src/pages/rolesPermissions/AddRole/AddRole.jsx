import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiShield, FiAlertCircle } from "react-icons/fi";
import BackButton from "../../../components/common/BackButton/BackButton";
import RoleForm from "../../../components/rolesPermissions/RoleForm/RoleForm";
import roleService from "../../../services/roleService";
import "./AddRole.css";

const AddRole = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (roleData) => {
    try {
      setLoading(true);
      setError("");

      roleService.createRole(roleData);
      navigate("/roles-permissions");
    } catch (err) {
      console.error("Failed to create role:", err);
      setError(err?.message || "Failed to create role. Please check the form data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-role-page">
      <div className="add-role-page__top">
        <BackButton
          label="Back to Roles & Permissions"
          onClick={() => navigate("/roles-permissions")}
        />
      </div>

      <div className="add-role-page__heading">
        <div className="add-role-page__icon">
          <FiShield />
        </div>

        <div>
          <h1>Create Role</h1>
          <p>
            Define a reusable role and configure its module-level permission matrix with granular action scopes.
          </p>
        </div>
      </div>

      {error && (
        <div className="add-role-page__error" role="alert">
          <FiAlertCircle style={{ fontSize: "20px", marginTop: "2px", flexShrink: 0, color: "var(--color-danger)" }} />
          <div>
            <strong>Error Creating Role</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <RoleForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/roles-permissions")}
        loading={loading}
      />
    </div>
  );
};

export default AddRole;
