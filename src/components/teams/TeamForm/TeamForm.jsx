import { useMemo, useState } from "react";

import FormField from "../../common/FormField/FormField";
import Toggle from "../../common/Toggle/Toggle";
import Button from "../../common/Button/Button";

import "./TeamForm.css";

const getEmployeeName = (employee) =>
  [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ") ||
  employee.full_name ||
  employee.email ||
  "Employee";

const TeamForm = ({
  initialData,
  employees = [],
  onSubmit,
  onCancel,
  loading = false,
  fieldErrors = {},
}) => {
  const [formData, setFormData] = useState(() => ({
    teamName: initialData?.teamName || "",
    description: initialData?.description || "",
    memberIds: Array.isArray(initialData?.memberIds)
      ? initialData.memberIds
      : [],
    status: initialData?.status || "active",
  }));

  const [localErrors, setLocalErrors] = useState({});
  const [memberSearch, setMemberSearch] = useState("");

  const errors = {
    ...localErrors,
    ...fieldErrors,
  };

  /*
   * =========================
   * SEARCH EMPLOYEES
   * =========================
   */

  const filteredEmployees = useMemo(() => {
    const searchValue = memberSearch.trim().toLowerCase();

    // Don't render the entire employee directory.
    if (!searchValue) {
      return [];
    }

    return employees
      .filter((employee) => {
        const name =
          getEmployeeName(employee).toLowerCase();

        return (
          name.includes(searchValue) ||
          employee.email
            ?.toLowerCase()
            .includes(searchValue) ||
          employee.employee_code
            ?.toLowerCase()
            .includes(searchValue)
        );
      })
      .filter(
        (employee) =>
          !formData.memberIds.some(
            (id) =>
              String(id) === String(employee.id)
          )
      )
      .slice(0, 8);
  }, [employees, memberSearch, formData.memberIds]);

  /*
   * =========================
   * SELECTED EMPLOYEES
   * =========================
   */

  const selectedEmployees = useMemo(() => {
    return employees.filter((employee) =>
      formData.memberIds.some(
        (id) =>
          String(id) === String(employee.id)
      )
    );
  }, [employees, formData.memberIds]);

  /*
   * =========================
   * FIELD CHANGE
   * =========================
   */

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (localErrors[field]) {
      setLocalErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    }
  };

  /*
   * =========================
   * MEMBER SELECT
   * =========================
   */

  const handleMemberToggle = (employeeId) => {
    setFormData((previous) => {
      const exists = previous.memberIds.some(
        (id) =>
          String(id) === String(employeeId)
      );

      return {
        ...previous,
        memberIds: exists
          ? previous.memberIds.filter(
              (id) =>
                String(id) !==
                String(employeeId)
            )
          : [
              ...previous.memberIds,
              employeeId,
            ],
      };
    });

    setMemberSearch("");

    if (localErrors.memberIds) {
      setLocalErrors((previous) => ({
        ...previous,
        memberIds: "",
      }));
    }
  };

  /*
   * =========================
   * REMOVE MEMBER
   * =========================
   */

  const removeMember = (employeeId) => {
    setFormData((previous) => ({
      ...previous,
      memberIds: previous.memberIds.filter(
        (id) =>
          String(id) !== String(employeeId)
      ),
    }));
  };

  /*
   * =========================
   * VALIDATION
   * =========================
   */

  const validate = () => {
    const newErrors = {};

    if (!formData.teamName.trim()) {
      newErrors.teamName =
        "Team name is required.";
    }

    if (formData.memberIds.length === 0) {
      newErrors.memberIds =
        "Select at least one team member.";
    }

    setLocalErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /*
   * =========================
   * SUBMIT
   * =========================
   */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit?.({
      ...formData,
      teamName: formData.teamName.trim(),
      description: formData.description.trim(),
      memberIds: formData.memberIds,
    });
  };

  return (
    <form
      className="team-form"
      onSubmit={handleSubmit}
    >
      <div className="team-form__fields">
        {/* TEAM NAME */}

        <FormField
          label="Team Name"
          htmlFor="team-name"
          required
          error={errors.teamName}
        >
          <input
            id="team-name"
            type="text"
            value={formData.teamName}
            onChange={(event) =>
              handleChange(
                "teamName",
                event.target.value
              )
            }
            placeholder="e.g. Product Development"
            disabled={loading}
            maxLength={100}
          />
        </FormField>

        {/* DESCRIPTION */}

        <FormField
          label="Description"
          htmlFor="team-description"
          hint="Add a short description of this team."
          error={errors.description}
        >
          <textarea
            id="team-description"
            value={formData.description}
            onChange={(event) =>
              handleChange(
                "description",
                event.target.value
              )
            }
            placeholder="Enter team description..."
            rows={4}
            disabled={loading}
            maxLength={500}
          />
        </FormField>

        {/* TEAM MEMBERS */}

        <FormField
          label="Team Members"
          required
          error={errors.memberIds}
          hint="A team can include employees from different departments."
        >
          <div className="team-form__members">
            {/* SEARCH */}

            <div className="team-form__member-search">
              <input
                type="text"
                value={memberSearch}
                onChange={(event) =>
                  setMemberSearch(
                    event.target.value
                  )
                }
                placeholder="Search employees by name, email or employee code..."
                disabled={loading}
              />
            </div>

            {/* SELECTED MEMBERS */}

            {selectedEmployees.length > 0 && (
              <div className="team-form__selected">
                <div className="team-form__selected-title">
                  Selected Members (
                  {selectedEmployees.length})
                </div>

                <div className="team-form__selected-list">
                  {selectedEmployees.map(
                    (employee) => {
                      const name =
                        getEmployeeName(
                          employee
                        );

                      return (
                        <div
                          className="team-form__selected-member"
                          key={employee.id}
                        >
                          <div className="team-form__selected-avatar">
                            {employee.profile_photo_url ? (
                              <img
                                src={
                                  employee.profile_photo_url
                                }
                                alt={name}
                              />
                            ) : (
                              name
                                .charAt(0)
                                .toUpperCase()
                            )}
                          </div>

                          <div className="team-form__selected-info">
                            <span>
                              {name}
                            </span>

                            <small>
                              {employee.department_name ||
                                "No department"}
                            </small>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeMember(
                                employee.id
                              )
                            }
                            disabled={loading}
                            aria-label={`Remove ${name}`}
                          >
                            ×
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* SEARCH RESULTS */}

            {memberSearch.trim() && (
              <div className="team-form__employee-list">
                {filteredEmployees.length ===
                0 ? (
                  <div className="team-form__employee-empty">
                    No available employees found.
                  </div>
                ) : (
                  <>
                    <div className="team-form__results-title">
                      Search Results
                    </div>

                    {filteredEmployees.map(
                      (employee) => {
                        const name =
                          getEmployeeName(
                            employee
                          );

                        return (
                          <button
                            type="button"
                            className="team-form__employee-option"
                            key={employee.id}
                            onClick={() =>
                              handleMemberToggle(
                                employee.id
                              )
                            }
                            disabled={loading}
                          >
                            <div className="team-form__employee-avatar">
                              {employee.profile_photo_url ? (
                                <img
                                  src={
                                    employee.profile_photo_url
                                  }
                                  alt={name}
                                />
                              ) : (
                                name
                                  .charAt(0)
                                  .toUpperCase()
                              )}
                            </div>

                            <div className="team-form__employee-info">
                              <span className="team-form__employee-name">
                                {name}
                              </span>

                              <span className="team-form__employee-meta">
                                {employee.department_name ||
                                  "No department"}

                                {employee.employee_code
                                  ? ` • ${employee.employee_code}`
                                  : ""}
                              </span>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </>
                )}
              </div>
            )}

            {/* SEARCH HINT */}

            {!memberSearch.trim() &&
              selectedEmployees.length === 0 && (
                <div className="team-form__search-hint">
                  Start typing to search for employees.
                </div>
              )}
          </div>
        </FormField>

        {/* STATUS */}

        <FormField
          label="Status"
          hint="Inactive teams won't be available for new assignments."
        >
          <Toggle
            checked={
              formData.status === "active"
            }
            onChange={(checked) =>
              handleChange(
                "status",
                checked
                  ? "active"
                  : "inactive"
              )
            }
            label={
              formData.status === "active"
                ? "Active"
                : "Inactive"
            }
            disabled={loading}
          />
        </FormField>
      </div>

      {/* FOOTER */}

      <div className="team-form__footer">
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
          disabled={loading}
        >
          {loading
            ? "Creating..."
            : "Create Team"}
        </Button>
      </div>
    </form>
  );
};

export default TeamForm;