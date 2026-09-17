import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiEdit2, FiAlertCircle } from "react-icons/fi";
import BackButton from "../../../components/common/BackButton/BackButton";
import IgniteLoader from "../../../components/common/IgniteLoader/IgniteLoader";
import RoleForm from "../../../components/rolesPermissions/RoleForm/RoleForm";
import roleService from "../../../services/roleService";
import "./EditRole.css";

const EditRole = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRole = () => {
      try {
        setLoading(true);
        const data = roleService.getRoleById(id);
        setRole(data);
      } catch (err) {
        console.error("Failed to load role:", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [id]);

  const handleSubmit = (roleData) => {
    try {
      setSubmitting(true);
      setError("");

      roleService.updateRole(id, roleData);
      navigate("/roles-permissions");
    } catch (err) {
      console.error("Failed to update role:", err);
      setError(err?.message || "Failed to update role. Please check the form data.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <IgniteLoader text="Loading role details..." />;
  }

  if (!role) {
    return (
      <div className="edit-role-page__not-found">
        <h2>Role Not Found</h2>
        <p>The requested role could not be located or has been deleted.</p>
        <BackButton
          label="Back to Roles & Permissions"
          onClick={() => navigate("/roles-permissions")}
        />
      </div>
    );
  }

  return (
    <div className="edit-role-page">
      <div className="edit-role-page__top">
        <BackButton
          label="Back to Roles & Permissions"
          onClick={() => navigate("/roles-permissions")}
        />
      </div>

      <div className="edit-role-page__heading">
        <div className="edit-role-page__icon">
          <FiEdit2 />
        </div>

        <div>
          <h1>Edit Role: {role.roleName}</h1>
          <p>
            Update role details and reconfigure its module-based permissions and action scopes.
          </p>
        </div>
      </div>

      {error && (
        <div className="edit-role-page__error" role="alert">
          <FiAlertCircle style={{ fontSize: "20px", marginTop: "2px", flexShrink: 0, color: "var(--color-danger)" }} />
          <div>
            <strong>Error Updating Role</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <RoleForm
        key={role.id}
        initialData={role}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/roles-permissions")}
        loading={submitting}
      />
    </div>
  );
};

export default EditRole;
