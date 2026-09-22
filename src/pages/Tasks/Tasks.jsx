import { useEffect, useMemo, useState } from "react";
import { ListTodo, Plus, Search } from "lucide-react";

import Button from "../../components/common/Button/Button";
import Drawer from "../../components/common/Drawer/Drawer";
import TaskForm from "../../components/tasks/TaskForm/TaskForm";
import TaskTable from "../../components/tasks/TaskTable/TaskTable";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";

import employeeService from "../../services/employeeService";
import { useNotification } from "../../context/NotificationContext";

import "./Tasks.css";

const INITIAL_TEAMS = [
  {
    id: "team-1",
    name: "HR Operations",
    description: "HR and employee operations team",
    memberIds: ["1", "2", "3"],
    status: "active",
  },
  {
    id: "team-2",
    name: "Product Team",
    description: "Product and development team",
    memberIds: ["2", "4", "5"],
    status: "active",
  },
  {
    id: "team-3",
    name: "Management Team",
    description: "Management and coordination team",
    memberIds: ["1", "4"],
    status: "active",
  },
];

const INITIAL_TASKS = [
  {
    id: "task-1",
    title: "Complete employee onboarding",
    description:
      "Finish onboarding documentation for the new employees.",
    teamId: "team-1",
    teamName: "HR Operations",
    assignedTo: "1",
    assignedToName: "Rahul Kumar",
    priority: "High",
    dueDate: "2026-09-25",
    status: "To Do",
  },
  {
    id: "task-2",
    title: "Prepare monthly attendance report",
    description:
      "Prepare and verify the attendance report.",
    teamId: "team-1",
    teamName: "HR Operations",
    assignedTo: "2",
    assignedToName: "Priya Sharma",
    priority: "Medium",
    dueDate: "2026-09-27",
    status: "In Progress",
  },
  {
    id: "task-3",
    title: "Update team documentation",
    description:
      "Review and update the team documentation.",
    teamId: "team-2",
    teamName: "Product Team",
    assignedTo: "4",
    assignedToName: "Aman Verma",
    priority: "Low",
    dueDate: "2026-09-30",
    status: "Completed",
  },
];

const STATUS_OPTIONS = [
  "All",
  "To Do",
  "In Progress",
  "Completed",
];

const Tasks = () => {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [teams] = useState(INITIAL_TEAMS);

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showCreateDrawer, setShowCreateDrawer] =
    useState(false);

  const { showNotification } = useNotification();

  /*
   * Load employees from existing employee API/service.
   */
  useEffect(() => {
    let isMounted = true;

    const loadEmployees = async () => {
      try {
        setEmployeesLoading(true);

        const response = await employeeService.getAll();

        if (!isMounted) return;

        /*
         * Supports both:
         * response = []
         * response.data = []
         * response.data.results = []
         */
        const employeeList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.results)
              ? response.data.results
              : Array.isArray(response?.results)
                ? response.results
                : [];

        setEmployees(employeeList);
      } catch (error) {
        console.error("Failed to fetch employees:", error);

        if (isMounted) {
          showNotification({ type: "error", message: "Unable to load employees. Please try again." });
        }
      } finally {
        if (isMounted) {
          setEmployeesLoading(false);
        }
      }
    };

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * Search + status filtering.
   */
  const filteredTasks = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !searchValue ||
        task.title?.toLowerCase().includes(searchValue) ||
        task.description?.toLowerCase().includes(searchValue) ||
        task.teamName?.toLowerCase().includes(searchValue) ||
        task.assignedToName?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  /*
   * Create task.
   */
  const handleCreateTask = (formData) => {
    const newTask = {
      id: `task-${Date.now()}`,
      ...formData,
    };

    setTasks((currentTasks) => [
      newTask,
      ...currentTasks,
    ]);

    setShowCreateDrawer(false);
    showNotification({ type: "success", message: "Task created successfully." });
  };

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    taskId: null,
    taskTitle: "",
  });

  /*
   * Delete task.
   */
  const handleDeleteTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    setDeleteModal({
      open: true,
      taskId,
      taskTitle: task?.title || "",
    });
  };

  const handleConfirmDeleteTask = () => {
    const { taskId, taskTitle } = deleteModal;
    if (!taskId) return;

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId)
    );

    setDeleteModal({ open: false, taskId: null, taskTitle: "" });
    showNotification({ type: "success", message: `Task "${taskTitle || "item"}" deleted successfully.` });
  };

  /*
   * View task.
   */
  const handleViewTask = (task) => {
    showNotification({
      type: "info",
      message: `Task: "${task.title}" — Assigned to ${task.assignedToName} (${task.status})`,
    });
  };

  /*
   * Edit placeholder for now.
   */
  const handleEditTask = (task) => {
    console.log("Edit task:", task);
    showNotification({ type: "info", message: "Task editing will be connected in the next step." });
  };

  return (
    <div className="tasks-page">
      {/* =========================
          HEADER
      ========================= */}

      <div className="tasks-page__header">
        <div className="tasks-page__heading">
          <div className="tasks-page__eyebrow">
            <ListTodo size={15} />
            Task Management
          </div>

          <h1>Tasks</h1>

          <p>
            Create, assign and manage tasks across your teams.
          </p>
        </div>

        <div className="tasks-page__actions">
          <span className="tasks-page__date">
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateDrawer(true)}
          >
            <Plus size={17} />
            Create Task
          </Button>
        </div>
      </div>

      {/* =========================
          TOOLBAR
      ========================= */}

      <div className="tasks-page__toolbar">
        <div className="tasks-page__search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search tasks, teams or assignees..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="tasks-page__filters">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              className={`tasks-page__filter ${statusFilter === status
                  ? "tasks-page__filter--active"
                  : ""
                }`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* =========================
          TABLE
      ========================= */}

      <div className="tasks-page__content">
        <TaskTable
          tasks={filteredTasks}
          onView={handleViewTask}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
      </div>

      {/* =========================
          CREATE TASK DRAWER
      ========================= */}

      <Drawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        title="Create Task"
        description="Create a task and assign it to a member of your team."
        width="520px"
      >
        <TaskForm
          teams={teams}
          employees={employees}
          loading={employeesLoading}
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateDrawer(false)}
        />
      </Drawer>

      {deleteModal.open && (
        <ConfirmModal
          open={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, taskId: null, taskTitle: "" })}
          onConfirm={handleConfirmDeleteTask}
          title="Delete Task?"
          itemName={deleteModal.taskTitle}
          confirmText="Delete"
        />
      )}
    </div>
  );
};

export default Tasks;