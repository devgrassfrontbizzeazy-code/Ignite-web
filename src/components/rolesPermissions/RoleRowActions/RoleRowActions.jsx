import { FiEye, FiEdit2, FiPower, FiTrash2 } from "react-icons/fi";
import RowActions from "../../common/RowActions/RowActions";

const RoleRowActions = ({
  role,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const isActive = role?.status === "active";

  const actions = [
    {
      key: "view",
      label: "View Details",
      icon: FiEye,
      onClick: () => onView?.(role),
    },
    {
      key: "edit",
      label: "Edit",
      icon: FiEdit2,
      onClick: () => onEdit?.(role),
    },
    {
      key: "toggleStatus",
      label: isActive ? "Deactivate" : "Activate",
      icon: FiPower,
      onClick: () => onToggleStatus?.(role),
    },
    { key: "divider-1", isDivider: true },
    {
      key: "delete",
      label: "Delete",
      icon: FiTrash2,
      isDanger: true,
      onClick: () => onDelete?.(role),
    },
  ];

  return (
    <RowActions
      actions={actions}
      title={`Actions for ${role?.roleName || "role"}`}
    />
  );
};

export default RoleRowActions;