import {
  FiEye,
  FiEdit2,
  FiSend,
  FiPower,
  FiSlash,
  FiLogOut,
  FiTrash2,
} from "react-icons/fi";
import {
  canUpdateEmployees,
  canDeleteEmployees,
  canCreateEmployees,
} from "../../../utils/permissionUtils";
import RowActions from "../../common/RowActions/RowActions";

const EmployeeRowActions = ({
  employee,
  onView,
  onEdit,
  onResendInvite,
  onToggleStatus,
  onTerminate,
  onResign,
  onDelete,
}) => {
  const canEdit = canUpdateEmployees(null, employee);
  const canDelete = canDeleteEmployees();
  const canResend = canCreateEmployees() || canEdit;

  const isActive = employee.employment_status === "ACTIVE";
  const isPendingInvite =
    employee.invitation_status === "PENDING" ||
    employee.invitation_status === "SENT";

  const actions = [
    {
      key: "view",
      label: "View Details",
      icon: FiEye,
      onClick: () => onView?.(employee),
    },
    ...(canEdit
      ? [
          {
            key: "edit",
            label: "Edit Profile",
            icon: FiEdit2,
            onClick: () => onEdit?.(employee),
          },
        ]
      : []),
    ...(isPendingInvite && onResendInvite && canResend
      ? [
          {
            key: "resend",
            label: "Resend Invite",
            icon: FiSend,
            onClick: () => onResendInvite?.(employee),
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            key: "toggleStatus",
            label: isActive ? "Deactivate" : "Activate",
            icon: FiPower,
            onClick: () => onToggleStatus?.(employee),
          },
        ]
      : []),
    ...(isActive && canEdit
      ? [
          {
            key: "terminate",
            label: "Terminate",
            icon: FiSlash,
            isDanger: true,
            onClick: () => onTerminate?.(employee),
          },
          {
            key: "resign",
            label: "Resign",
            icon: FiLogOut,
            onClick: () => onResign?.(employee),
          },
        ]
      : []),
    ...(canDelete && (canEdit || canResend)
      ? [{ key: "divider-1", isDivider: true }]
      : []),
    ...(canDelete
      ? [
          {
            key: "delete",
            label: "Delete",
            icon: FiTrash2,
            isDanger: true,
            onClick: () => onDelete?.(employee),
          },
        ]
      : []),
  ];

  return <RowActions actions={actions} title="Employee actions" />;
};

export default EmployeeRowActions;