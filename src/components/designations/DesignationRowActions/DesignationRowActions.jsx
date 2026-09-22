import { FiEye, FiEdit2, FiPower, FiTrash2 } from "react-icons/fi";
import {
  canUpdateDesignations,
  canDeleteDesignations,
} from "../../../utils/permissionUtils";
import RowActions from "../../common/RowActions/RowActions";

const DesignationRowActions = ({
  designation,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const canEdit = canUpdateDesignations();
  const canDelete = canDeleteDesignations();
  const isActive = designation?.status === "active";

  const actions = [
    {
      key: "view",
      label: "View Details",
      icon: FiEye,
      onClick: () => onView?.(designation),
    },
    ...(canEdit
      ? [
          {
            key: "edit",
            label: "Edit",
            icon: FiEdit2,
            onClick: () => onEdit?.(designation),
          },
          {
            key: "toggleStatus",
            label: isActive ? "Deactivate" : "Activate",
            icon: FiPower,
            onClick: () => onToggleStatus?.(designation),
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
            onClick: () => onDelete?.(designation),
          },
        ]
      : []),
  ];

  return (
    <RowActions
      actions={actions}
      title={`Actions for ${designation?.designationName || "designation"}`}
    />
  );
};

export default DesignationRowActions;
