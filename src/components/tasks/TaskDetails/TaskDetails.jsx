import Button from "../../common/Button/Button";
import Select from "../../common/Select/Select";
import "./TaskDetails.css";

const STATUS_OPTIONS = [
  { value: "To Do", label: "To Do" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

const TaskDetails = ({ task, onClose, onEdit, onViewTeam, canEdit = false, onStatusChange }) => {
  if (!task) return null;
  return (
    <div className="task-details">
      <p className="task-details__description">{task.description || "No description added."}</p>
      <dl className="task-details__facts">
        <dt>Team</dt><dd><button type="button" className="task-details__team-link" onClick={() => onViewTeam?.(task)}>{task.teamName || "—"}</button></dd>
        <dt>Assigned To</dt><dd>{task.assignedToName || "—"}</dd>
        <dt>Priority</dt><dd>{task.priority || "—"}</dd>
        <dt>Status</dt><dd><Select value={task.status} options={STATUS_OPTIONS} onChange={(value) => onStatusChange?.(task, value)} disabled={!canEdit} /></dd>
        <dt>Due Date</dt><dd>{task.dueDate || "—"}</dd>
      </dl>
      <div className="task-details__actions"><Button variant="secondary" onClick={onClose}>Close</Button><Button variant="primary" onClick={() => onEdit?.(task)} disabled={!canEdit}>Edit Task</Button></div>
    </div>
  );
};

export default TaskDetails;
