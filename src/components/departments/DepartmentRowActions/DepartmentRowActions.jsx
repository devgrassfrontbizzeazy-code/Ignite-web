import { FiEye, FiEdit2, FiPower, FiTrash2 } from "react-icons/fi";
import {
  canUpdateDepartments,
  canDeleteDepartments,
} from "../../../utils/permissionUtils";
import RowActions from "../../common/RowActions/RowActions";

const DepartmentRowActions = ({
  department,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const canEdit = canUpdateDepartments();
  const canDelete = canDeleteDepartments();
  const isActive = department?.status === "active";

  const actions = [
    {
      key: "view",
      label: "View Details",
      icon: FiEye,
      onClick: () => onView?.(department),
    },
    ...(canEdit
      ? [
          {
            key: "edit",
            label: "Edit",
            icon: FiEdit2,
            onClick: () => onEdit?.(department),
          },
          {
            key: "toggleStatus",
            label: isActive ? "Deactivate" : "Activate",
            icon: FiPower,
            onClick: () => onToggleStatus?.(department),
          },
        ]
      : []),
    ...(canDelete && canEdit ? [{ key: "divider-1", isDivider: true }] : []),
    ...(canDelete
      ? [
          {
            key: "delete",
            label: "Delete",
            icon: FiTrash2,
            isDanger: true,
            onClick: () => onDelete?.(department),
          },
        ]
      : []),
  ];

  return (
    <RowActions
      actions={actions}
      title={`Actions for ${department?.departmentName || "department"}`}
    />
  );
};

export default DepartmentRowActions;
