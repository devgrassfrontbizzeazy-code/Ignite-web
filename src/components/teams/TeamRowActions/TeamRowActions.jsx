import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import RowActions from "../../common/RowActions/RowActions";

const TeamRowActions = ({
  team,
  onView,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  const actions = [
    {
      key: "view",
      label: "View",
      icon: FiEye,
      onClick: () => onView?.(team),
    },

    canEdit && {
      key: "edit",
      label: "Edit",
      icon: FiEdit2,
      onClick: () => onEdit?.(team),
    },

    canDelete && {
      key: "divider-1",
      isDivider: true,
    },

    canDelete && {
      key: "delete",
      label: "Delete",
      icon: FiTrash2,
      isDanger: true,
      onClick: () => onDelete?.(team),
    },
  ].filter(Boolean);

  return (
    <RowActions
      actions={actions}
      title={`Actions for ${team?.name || "team"}`}
    />
  );
};

export default TeamRowActions;