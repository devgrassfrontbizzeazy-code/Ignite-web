import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import RowActions from "../../common/RowActions/RowActions";

const TeamRowActions = ({
  team,
  onView,
  onEdit,
  onDelete,
}) => {
  const actions = [
    {
      key: "view",
      label: "View",
      icon: FiEye,
      onClick: () => onView?.(team),
    },
    {
      key: "edit",
      label: "Edit",
      icon: FiEdit2,
      onClick: () => onEdit?.(team),
    },
    { key: "divider-1", isDivider: true },
    {
      key: "delete",
      label: "Delete",
      icon: FiTrash2,
      isDanger: true,
      onClick: () => onDelete?.(team),
    },
  ];

  return (
    <RowActions
      actions={actions}
      title={`Actions for ${team?.name || "team"}`}
    />
  );
};

export default TeamRowActions;