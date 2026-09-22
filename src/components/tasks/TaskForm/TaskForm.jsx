import { useEffect, useMemo, useState } from "react";
import { Search, UserRound, X } from "lucide-react";

import FormField from "../../common/FormField/FormField";
import Select from "../../common/Select/Select";
import Button from "../../common/Button/Button";

import "./TaskForm.css";

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

const STATUS_OPTIONS = [
  { value: "To Do", label: "To Do" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

const getEmployeeName = (employee) =>
  [employee?.first_name, employee?.middle_name, employee?.last_name]
    .filter(Boolean)
    .join(" ") ||
  employee?.full_name ||
  employee?.name ||
  employee?.email ||
  "Employee";

const getTeamName = (team) =>
  team?.name ||
  team?.teamName ||
  "Unnamed Team";

const TaskForm = ({
  initialData = {},
  teams = [],
  employees = [],
  onSubmit,
  onCancel,
  loading = false,
  fieldErrors = {},
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    teamId: initialData?.teamId || "",
    assignedTo: initialData?.assignedTo || "",
    priority: initialData?.priority || "Medium",
    dueDate: initialData?.dueDate || "",
    status: initialData?.status || "To Do",
  });

  const [localErrors, setLocalErrors] = useState({});
  const [memberSearch, setMemberSearch] = useState("");

  const errors = {
    ...localErrors,
    ...fieldErrors,
  };

  /*
   * Keep the form synced when editing an existing task.
   */
  useEffect(() => {
    setFormData({
      title: initialData?.title || "",
      description: initialData?.description || "",
      teamId: initialData?.teamId || "",
      assignedTo: initialData?.assignedTo || "",
      priority: initialData?.priority || "Medium",
      dueDate: initialData?.dueDate || "",
      status: initialData?.status || "To Do",
    });

    setLocalErrors({});
    setMemberSearch("");
  }, [initialData]);

  /*
   * Find selected team.
   */
  const selectedTeam = useMemo(() => {
    return teams.find(
      (team) => String(team.id) === String(formData.teamId)
    );
  }, [teams, formData.teamId]);

  /*
   * Get members belonging to selected team.
   *
   * Supports:
   * - memberIds
   * - members
   * - employeeIds
   */
  const teamMembers = useMemo(() => {
    if (!selectedTeam) return [];

    let memberIds = [];

    if (Array.isArray(selectedTeam.memberIds)) {
      memberIds = selectedTeam.memberIds;
    } else if (Array.isArray(selectedTeam.employeeIds)) {
      memberIds = selectedTeam.employeeIds;
    } else if (Array.isArray(selectedTeam.members)) {
      memberIds = selectedTeam.members.map((member) =>
        typeof member === "object" ? member.id : member
      );
    }

    return employees.filter((employee) =>
      memberIds.some(
        (id) => String(id) === String(employee.id)
      )
    );
  }, [selectedTeam, employees]);

  /*
   * Search within selected team members only.
   */
  const filteredMembers = useMemo(() => {
    const searchValue = memberSearch.trim().toLowerCase();

    if (!searchValue) {
      return teamMembers.slice(0, 8);
    }

    return teamMembers
      .filter((employee) => {
        const name = getEmployeeName(employee).toLowerCase();
        const email = employee?.email?.toLowerCase() || "";
        const code =
          employee?.employee_code?.toLowerCase() || "";

        return (
          name.includes(searchValue) ||
          email.includes(searchValue) ||
          code.includes(searchValue)
        );
      })
      .slice(0, 8);
  }, [teamMembers, memberSearch]);

  const selectedEmployee = useMemo(() => {
    return teamMembers.find(
      (employee) =>
        String(employee.id) === String(formData.assignedTo)
    );
  }, [teamMembers, formData.assignedTo]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    if (localErrors[field]) {
      setLocalErrors((current) => ({
        ...current,
        [field]: "",
      }));
    }
  };

  const handleTeamChange = (value) => {
    setFormData((current) => ({
      ...current,
      teamId: value,
      assignedTo: "",
    }));

    setMemberSearch("");

    setLocalErrors((current) => ({
      ...current,
      teamId: "",
      assignedTo: "",
    }));
  };

  const handleMemberSelect = (employee) => {
    setFormData((current) => ({
      ...current,
      assignedTo: employee.id,
    }));

    setMemberSearch("");

    setLocalErrors((current) => ({
      ...current,
      assignedTo: "",
    }));
  };

  const removeAssignee = () => {
    setFormData((current) => ({
      ...current,
      assignedTo: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = "Task title is required.";
    }

    if (!formData.teamId) {
      nextErrors.teamId = "Please select a team.";
    }

    if (!formData.assignedTo) {
      nextErrors.assignedTo = "Please select a team member.";
    }

    if (!formData.priority) {
      nextErrors.priority = "Please select a priority.";
    }

    if (!formData.status) {
      nextErrors.status = "Please select a status.";
    }

    setLocalErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) return;

    onSubmit?.({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      teamName: selectedTeam ? getTeamName(selectedTeam) : "",
      assignedToName: selectedEmployee
        ? getEmployeeName(selectedEmployee)
        : "",
    });
  };

  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: getTeamName(team),
  }));

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="task-form__fields">

        {/* Task Title */}
        <FormField
          label="Task Title"
          htmlFor="task-title"
          required
          error={errors.title}
        >
          <input
            id="task-title"
            type="text"
            placeholder="Enter task title"
            value={formData.title}
            onChange={(event) =>
              handleChange("title", event.target.value)
            }
            disabled={loading}
          />
        </FormField>

        {/* Description */}
        <FormField
          label="Description"
          htmlFor="task-description"
          error={errors.description}
        >
          <textarea
            id="task-description"
            placeholder="Describe what needs to be done..."
            value={formData.description}
            onChange={(event) =>
              handleChange("description", event.target.value)
            }
            disabled={loading}
            rows={4}
          />
        </FormField>

        {/* Team */}
        <FormField
          label="Team"
          htmlFor="task-team"
          required
          error={errors.teamId}
        >
          <Select
            id="task-team"
            value={formData.teamId}
            onChange={handleTeamChange}
            options={teamOptions}
            placeholder="Select a team"
            disabled={loading}
          />
        </FormField>

        {/* Assignee */}
        <FormField
          label="Assign To"
          htmlFor="task-assignee-search"
          required
          error={errors.assignedTo}
          hint={
            formData.teamId
              ? "Only members of the selected team are available."
              : "Select a team first."
          }
        >
          {!formData.teamId ? (
            <div className="task-form__disabled-message">
              Select a team to choose a team member.
            </div>
          ) : (
            <>
              {selectedEmployee ? (
                <div className="task-form__selected-member">
                  <div className="task-form__member-avatar">
                    {getEmployeeName(selectedEmployee)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="task-form__member-info">
                    <strong>
                      {getEmployeeName(selectedEmployee)}
                    </strong>

                    <span>
                      {selectedEmployee.email ||
                        selectedEmployee.employee_code ||
                        "Team Member"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="task-form__remove-member"
                    onClick={removeAssignee}
                    aria-label="Remove assignee"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="task-form__member-picker">
                  <div className="task-form__member-search">
                    <Search size={16} />

                    <input
                      id="task-assignee-search"
                      type="text"
                      placeholder="Search team members..."
                      value={memberSearch}
                      onChange={(event) =>
                        setMemberSearch(event.target.value)
                      }
                      disabled={loading}
                    />
                  </div>

                  {teamMembers.length === 0 ? (
                    <div className="task-form__member-empty">
                      <UserRound size={18} />

                      <span>
                        No members found in this team.
                      </span>
                    </div>
                  ) : (
                    <div className="task-form__member-results">
                      {filteredMembers.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          className="task-form__member-option"
                          onClick={() =>
                            handleMemberSelect(employee)
                          }
                        >
                          <div className="task-form__member-avatar">
                            {getEmployeeName(employee)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="task-form__member-info">
                            <strong>
                              {getEmployeeName(employee)}
                            </strong>

                            <span>
                              {employee.email ||
                                employee.employee_code ||
                                "Team Member"}
                            </span>
                          </div>
                        </button>
                      ))}

                      {filteredMembers.length === 0 && (
                        <div className="task-form__member-empty">
                          <Search size={17} />

                          <span>
                            No team member matches your search.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </FormField>

        {/* Priority */}
        <FormField
          label="Priority"
          htmlFor="task-priority"
          required
          error={errors.priority}
        >
          <Select
            id="task-priority"
            value={formData.priority}
            onChange={(value) =>
              handleChange("priority", value)
            }
            options={PRIORITY_OPTIONS}
            placeholder="Select priority"
            disabled={loading}
          />
        </FormField>

        {/* Due Date */}
        <FormField
          label="Due Date"
          htmlFor="task-due-date"
          hint="Optional"
        >
          <input
            id="task-due-date"
            type="date"
            value={formData.dueDate}
            onChange={(event) =>
              handleChange("dueDate", event.target.value)
            }
            disabled={loading}
          />
        </FormField>

        {/* Status */}
        <FormField
          label="Status"
          htmlFor="task-status"
          required
          error={errors.status}
        >
          <Select
            id="task-status"
            value={formData.status}
            onChange={(value) =>
              handleChange("status", value)
            }
            options={STATUS_OPTIONS}
            placeholder="Select status"
            disabled={loading}
          />
        </FormField>
      </div>

      <div className="task-form__footer">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          Create Task
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;