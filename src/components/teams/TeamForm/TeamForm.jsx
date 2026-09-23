import { useEffect, useMemo, useState } from "react";
import FormField from "../../common/FormField/FormField";
import Select from "../../common/Select/Select";
import Toggle from "../../common/Toggle/Toggle";
import Button from "../../common/Button/Button";
import "./TeamForm.css";
const getEmployeeId = (employee = {}) =>
  employee.id ??
  employee.employee_id ??
  employee.employeeId ??
  employee.pk ??
  null;
const getEmployeeName = (employee = {}) =>
  [
    employee.first_name || employee.firstName,
    employee.middle_name || employee.middleName,
    employee.last_name || employee.lastName,
  ]
    .filter(Boolean)
    .join(" ") ||
  employee.full_name ||
  employee.fullName ||
  employee.email ||
  "Employee";
const getEmployeeDepartment = (employee = {}) =>
  employee.department?.name ||
  employee.department_name ||
  employee.departmentName ||
  "No department";
const getEmployeeCode = (employee = {}) =>
  employee.employee_code || employee.employeeCode || "No employee code";
const normalizeMember = (employee = {}) => ({
  ...employee,
  id: getEmployeeId(employee),
});
const TeamForm = ({
  initialData,
  employees = [],
  onSubmit,
  onCancel,
  loading = false,
  fieldErrors = {},
}) => {
  const [formData, setFormData] = useState(() => ({
    teamName: initialData?.teamName || initialData?.name || "",
    description: initialData?.description || "",
    teamLeadId: initialData?.teamLeadId || "",
    memberIds: Array.isArray(initialData?.memberIds)
      ? initialData.memberIds
      : [],
    status: initialData?.status || "active",
  }));
  const [localErrors, setLocalErrors] = useState({});
  const [memberSearch, setMemberSearch] = useState("");
  /* * ========================================== * RESET FORM WHEN TEAM CHANGES * ========================================== */ useEffect(() => {
    setFormData({
      teamName: initialData?.teamName || initialData?.name || "",
      description: initialData?.description || "",
      teamLeadId: initialData?.teamLeadId || "",
      memberIds: Array.isArray(initialData?.memberIds)
        ? initialData.memberIds
        : [],
      status: initialData?.status || "active",
    });
    setLocalErrors({});
    setMemberSearch("");
  }, [initialData]);
  const errors = { ...localErrors, ...fieldErrors };
  /* * ========================================== * AVAILABLE EMPLOYEES * ========================================== * * `employees` normally contains the complete * employee directory. * * For edit mode, however, the team API also * gives us `members_details`. Keep those as a * fallback so existing members never disappear * from the form just because they are missing * from the employee list. */ const availableEmployees =
    useMemo(() => {
      const employeeMap = new Map();
      employees.forEach((employee) => {
        const id = getEmployeeId(employee);
        if (id !== null && id !== undefined) {
          employeeMap.set(String(id), normalizeMember(employee));
        }
      });
      const existingMembers = Array.isArray(initialData?.members_details)
        ? initialData.members_details
        : [];
      existingMembers.forEach((employee) => {
        const id = getEmployeeId(employee);
        if (id !== null && id !== undefined && !employeeMap.has(String(id))) {
          employeeMap.set(String(id), normalizeMember(employee));
        }
      });
      return Array.from(employeeMap.values());
    }, [employees, initialData]);
  /* * ========================================== * SEARCH EMPLOYEES * ========================================== */ const filteredEmployees =
    useMemo(() => {
      const searchValue = memberSearch.trim().toLowerCase();
      if (!searchValue) {
        return [];
      }
      return availableEmployees
        .filter((employee) => {
          const name = getEmployeeName(employee).toLowerCase();
          return (
            name.includes(searchValue) ||
            employee.email?.toLowerCase().includes(searchValue) ||
            getEmployeeCode(employee).toLowerCase().includes(searchValue)
          );
        })
        .filter(
          (employee) =>
            !formData.memberIds.some(
              (id) => String(id) === String(getEmployeeId(employee)),
            ),
        )
        .slice(0, 8);
    }, [availableEmployees, memberSearch, formData.memberIds]);
  /* * ========================================== * SELECTED EMPLOYEES * ========================================== */ const selectedEmployees =
    useMemo(() => {
      return formData.memberIds
        .map((memberId) =>
          availableEmployees.find(
            (employee) => String(getEmployeeId(employee)) === String(memberId),
          ),
        )
        .filter(Boolean);
    }, [availableEmployees, formData.memberIds]);
  /* * ========================================== * FIELD CHANGE * ========================================== */ const handleChange =
    (field, value) => {
      setFormData((previous) => ({ ...previous, [field]: value }));
      if (localErrors[field]) {
        setLocalErrors((previous) => ({ ...previous, [field]: "" }));
      }
    };
  /* * ========================================== * ADD / REMOVE MEMBER * ========================================== */ const handleMemberToggle =
    (employeeId) => {
      setFormData((previous) => {
        const exists = previous.memberIds.some(
          (id) => String(id) === String(employeeId),
        );
        return {
          ...previous,
          memberIds: exists
            ? previous.memberIds.filter(
                (id) => String(id) !== String(employeeId),
              )
            : [...previous.memberIds, employeeId],
        };
      });
      setMemberSearch("");
      if (localErrors.memberIds) {
        setLocalErrors((previous) => ({ ...previous, memberIds: "" }));
      }
    };
  const removeMember = (employeeId) => {
    setFormData((previous) => {
      const updatedMemberIds = previous.memberIds.filter(
        (id) => String(id) !== String(employeeId),
      );
      /* * If the removed employee was the team lead, * clear the team lead so the user must select * another current member. */ const removingTeamLead =
        String(previous.teamLeadId) === String(employeeId);
      return {
        ...previous,
        memberIds: updatedMemberIds,
        teamLeadId: removingTeamLead ? "" : previous.teamLeadId,
      };
    });
    if (localErrors.memberIds) {
      setLocalErrors((previous) => ({ ...previous, memberIds: "" }));
    }
    if (localErrors.teamLeadId) {
      setLocalErrors((previous) => ({ ...previous, teamLeadId: "" }));
    }
  };
  /* * ========================================== * VALIDATION * ========================================== */ const validate =
    () => {
      const newErrors = {};
      if (!formData.teamName.trim()) {
        newErrors.teamName = "Team name is required.";
      }
      if (formData.memberIds.length === 0) {
        newErrors.memberIds = "Select at least one team member.";
      }
      if (!formData.teamLeadId) {
        newErrors.teamLeadId = "Select a team lead.";
      } else if (
        !formData.memberIds.some(
          (id) => String(id) === String(formData.teamLeadId),
        )
      ) {
        newErrors.teamLeadId = "The team lead must be a selected member.";
      }
      setLocalErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  /* * ========================================== * SUBMIT * ========================================== */ const handleSubmit =
    (event) => {
      event.preventDefault();
      if (!validate()) {
        return;
      }
      onSubmit?.({
        ...formData,
        teamName: formData.teamName.trim(),
        description: formData.description.trim(),
        memberIds: formData.memberIds,
        teamLeadId: formData.teamLeadId,
      });
    };
  return (
    <form className="team-form" onSubmit={handleSubmit}>
      {" "}
      <div className="team-form__fields">
        {" "}
        {/* TEAM NAME */}{" "}
        <FormField
          label="Team Name"
          htmlFor="team-name"
          required
          error={errors.teamName}
        >
          {" "}
          <input
            id="team-name"
            type="text"
            value={formData.teamName}
            onChange={(event) => handleChange("teamName", event.target.value)}
            placeholder="e.g. Product Development"
            disabled={loading}
            maxLength={100}
          />{" "}
        </FormField>{" "}
        {/* DESCRIPTION */}{" "}
        <FormField
          label="Description"
          htmlFor="team-description"
          hint="Add a short description of this team."
          error={errors.description}
        >
          {" "}
          <textarea
            id="team-description"
            value={formData.description}
            onChange={(event) =>
              handleChange("description", event.target.value)
            }
            placeholder="Enter team description..."
            rows={4}
            disabled={loading}
            maxLength={500}
          />{" "}
        </FormField>{" "}
        {/* TEAM MEMBERS */}{" "}
        <FormField
          label="Team Members"
          required
          error={errors.memberIds}
          hint="A team can include employees from different departments."
        >
          {" "}
          <div className="team-form__members">
            {" "}
            {/* SEARCH */}{" "}
            <div className="team-form__member-search">
              {" "}
              <input
                type="text"
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Search employees by name, email or employee code..."
                disabled={loading}
              />{" "}
            </div>{" "}
            {/* SELECTED MEMBERS */}{" "}
            {selectedEmployees.length > 0 && (
              <div className="team-form__selected">
                {" "}
                <div className="team-form__selected-title">
                  {" "}
                  Selected Members ( {selectedEmployees.length}){" "}
                </div>{" "}
                <div className="team-form__selected-list">
                  {" "}
                  {selectedEmployees.map((employee) => {
                    const employeeId = getEmployeeId(employee);
                    const name = getEmployeeName(employee);
                    return (
                      <div
                        className="team-form__selected-member"
                        key={employeeId}
                      >
                        {" "}
                        <div className="team-form__selected-avatar">
                          {" "}
                          {employee.profile_photo_url ||
                          employee.profilePhotoUrl ? (
                            <img
                              src={
                                employee.profile_photo_url ||
                                employee.profilePhotoUrl
                              }
                              alt={name}
                            />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}{" "}
                        </div>{" "}
                        <div className="team-form__selected-info">
                          {" "}
                          <span>{name}</span>{" "}
                          <small>
                            {" "}
                            {getEmployeeDepartment(employee)} {" • "}{" "}
                            {getEmployeeCode(employee)}{" "}
                          </small>{" "}
                        </div>{" "}
                        <button
                          type="button"
                          onClick={() => removeMember(employeeId)}
                          disabled={loading}
                          aria-label={`Remove ${name}`}
                        >
                          {" "}
                          ×{" "}
                        </button>{" "}
                      </div>
                    );
                  })}{" "}
                </div>{" "}
              </div>
            )}{" "}
            {/* SEARCH RESULTS */}{" "}
            {memberSearch.trim() && (
              <div className="team-form__employee-list">
                {" "}
                {filteredEmployees.length === 0 ? (
                  <div className="team-form__employee-empty">
                    {" "}
                    No available employees found.{" "}
                  </div>
                ) : (
                  <>
                    {" "}
                    <div className="team-form__results-title">
                      {" "}
                      Search Results{" "}
                    </div>{" "}
                    {filteredEmployees.map((employee) => {
                      const employeeId = getEmployeeId(employee);
                      const name = getEmployeeName(employee);
                      return (
                        <button
                          type="button"
                          className="team-form__employee-option"
                          key={employeeId}
                          onClick={() => handleMemberToggle(employeeId)}
                          disabled={loading}
                        >
                          {" "}
                          <div className="team-form__selected-avatar">
                            {" "}
                            {employee.profile_photo_url ||
                            employee.profilePhotoUrl ? (
                              <img
                                src={
                                  employee.profile_photo_url ||
                                  employee.profilePhotoUrl
                                }
                                alt={name}
                              />
                            ) : (
                              name.charAt(0).toUpperCase()
                            )}{" "}
                          </div>{" "}
                          <div className="team-form__selected-info">
                            {" "}
                            <span>{name}</span>{" "}
                            <small>
                              {" "}
                              {getEmployeeDepartment(employee)} {" • "}{" "}
                              {getEmployeeCode(employee)}{" "}
                            </small>{" "}
                          </div>{" "}
                        </button>
                      );
                    })}{" "}
                  </>
                )}{" "}
              </div>
            )}{" "}
            {/* SEARCH HINT */}{" "}
            {!memberSearch.trim() && selectedEmployees.length === 0 && (
              <div className="team-form__search-hint">
                {" "}
                Start typing to search for employees.{" "}
              </div>
            )}{" "}
          </div>{" "}
        </FormField>{" "}
        {/* TEAM LEAD */}{" "}
        <FormField
          label="Team Lead"
          htmlFor="team-lead"
          required
          error={errors.teamLeadId}
          hint="This is a team position and does not change the employee's global role."
        >
          {" "}
          <Select
            id="team-lead"
            value={formData.teamLeadId}
            onChange={(value) => handleChange("teamLeadId", value)}
            options={selectedEmployees.map((employee) => ({
              value: getEmployeeId(employee),
              label: getEmployeeName(employee),
            }))}
            placeholder={
              selectedEmployees.length
                ? "Select team lead"
                : "Select members first"
            }
            disabled={loading || selectedEmployees.length === 0}
          />{" "}
        </FormField>{" "}
        {/* STATUS */}{" "}
        <FormField
          label="Status"
          hint="Inactive teams won't be available for new assignments."
        >
          {" "}
          <Toggle
            checked={formData.status === "active"}
            onChange={(checked) =>
              handleChange("status", checked ? "active" : "inactive")
            }
            label={formData.status === "active" ? "Active" : "Inactive"}
            disabled={loading}
          />{" "}
        </FormField>{" "}
      </div>{" "}
      {/* FOOTER */}{" "}
      <div className="team-form__footer">
        {" "}
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {" "}
          Cancel{" "}
        </Button>{" "}
        <Button type="submit" variant="primary" disabled={loading}>
          {" "}
          {loading
            ? "Saving..."
            : initialData?.id
              ? "Save Changes"
              : "Create Team"}{" "}
        </Button>{" "}
      </div>{" "}
    </form>
  );
};
export default TeamForm;
