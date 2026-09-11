import { employeeMockData } from "../data/employeeMockData";

const STORAGE_KEY = "ignite_employees";

/*
 * Load employees from localStorage.
 * If no data exists yet, initialize it from employeeMockData.
 */
const getStoredEmployees = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return JSON.parse(stored);
    }

    const initialData = [...employeeMockData];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(initialData)
    );

    return initialData;
  } catch (error) {
    console.error(
      "Failed to load employees:",
      error
    );

    return [...employeeMockData];
  }
};

/*
 * Save complete employee collection.
 */
const saveEmployees = (employees) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(employees)
  );
};

/*
 * Generate temporary frontend ID.
 * Backend will eventually generate the real ID.
 */
const generateId = () => {
  return `emp-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
};

const employeeService = {
  /*
   * GET ALL EMPLOYEES
   *
   * Returns only employees that have not been
   * soft deleted.
   */
  getAll() {
    return getStoredEmployees().filter(
      (employee) => !employee.deleted_at
    );
  },

  /*
   * GET EMPLOYEE BY ID
   */
  getById(id) {
    const employees = getStoredEmployees();

    return (
      employees.find(
        (employee) =>
          String(employee.id) === String(id) &&
          !employee.deleted_at
      ) || null
    );
  },

  /*
   * CREATE EMPLOYEE
   */
  create(data) {
    const employees = getStoredEmployees();

    const now = new Date().toISOString();

    const newEmployee = {
      ...data,

      id: generateId(),

      company_id:
        data.company_id || "company-001",

      created_at: now,
      updated_at: now,

      deleted_at: null,
    };

    const updatedEmployees = [
      ...employees,
      newEmployee,
    ];

    saveEmployees(updatedEmployees);

    return newEmployee;
  },

  /*
   * UPDATE EMPLOYEE
   */
  update(id, data) {
    const employees = getStoredEmployees();

    const index = employees.findIndex(
      (employee) =>
        String(employee.id) === String(id) &&
        !employee.deleted_at
    );

    if (index === -1) {
      throw new Error("Employee not found");
    }

    const updatedEmployee = {
      ...employees[index],
      ...data,

      // Never allow these to change during edit.
      id: employees[index].id,
      company_id: employees[index].company_id,

      updated_at: new Date().toISOString(),
    };

    employees[index] = updatedEmployee;

    saveEmployees(employees);

    return updatedEmployee;
  },

  /*
   * SOFT DELETE EMPLOYEE
   */
  delete(id) {
    const employees = getStoredEmployees();

    const index = employees.findIndex(
      (employee) =>
        String(employee.id) === String(id) &&
        !employee.deleted_at
    );

    if (index === -1) {
      throw new Error("Employee not found");
    }

    const now = new Date().toISOString();

    employees[index] = {
      ...employees[index],
      deleted_at: now,
      updated_at: now,
    };

    saveEmployees(employees);

    return true;
  },

  /*
   * ACTIVATE / DEACTIVATE
   */
  changeStatus(id, status) {
    return this.update(id, {
      employment_status: status,
    });
  },

  /*
   * TERMINATE EMPLOYEE
   */
  terminate(id, dateOfExit = null) {
    return this.update(id, {
      employment_status: "TERMINATED",

      date_of_exit:
        dateOfExit ||
        new Date()
          .toISOString()
          .split("T")[0],
    });
  },

  /*
   * RESIGN EMPLOYEE
   */
  resign(id, dateOfExit = null) {
    return this.update(id, {
      employment_status: "RESIGNED",

      date_of_exit:
        dateOfExit ||
        new Date()
          .toISOString()
          .split("T")[0],
    });
  },

  /*
   * RESET FRONTEND DATA
   *
   * Useful during development/testing.
   */
  reset() {
    const freshData = [...employeeMockData];

    saveEmployees(freshData);

    return freshData;
  },
};

export default employeeService;