import DesignationRowActions from "../DesignationRowActions/DesignationRowActions";

import "./DesignationTable.css";

const DesignationTable = ({
  designations = [],
  onView,
  onEdit,
  onDelete,
}) => {
  if (!designations.length) {
    return null;
  }

  return (
    <div className="designation-table-wrapper">
      <table className="designation-table">
        <thead>
          <tr>
            <th>Designation</th>
            <th>Department</th>
            <th>Employees</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {designations.map((designation) => (
            <tr key={designation.id}>
              <td>
                <div className="designation-table__name">
                  <span className="designation-table__name-text">
                    {designation.name}
                  </span>
                </div>
              </td>

              <td>
                {designation.departmentName || "—"}
              </td>

              <td>
                {designation.employeeCount ?? 0}
              </td>

              <td>
                <span
                  className={`designation-table__status designation-table__status--${
                    designation.status === "active"
                      ? "active"
                      : "inactive"
                  }`}
                >
                  <span className="designation-table__status-dot" />

                  {designation.status === "active"
                    ? "Active"
                    : "Inactive"}
                </span>
              </td>

              <td>
                {designation.createdAt || "—"}
              </td>

              <td>
                <DesignationRowActions
                  designation={designation}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DesignationTable;