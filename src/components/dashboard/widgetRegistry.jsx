import {
  Building2,
  CalendarDays,
  CalendarCheck,
  ClipboardList,
  Clock3,
  FilePlus2,
  Umbrella,
  UserRoundCog,
  Users,
} from "lucide-react";

import AttendanceActionWidget from "./widgets/specialized/AttendanceActionWidget/AttendanceActionWidget";
import TeamTaskWidget from "./widgets/specialized/TeamTaskWidget/TeamTaskWidget";
import TeamTaskOverviewWidget from "./widgets/specialized/TeamTaskOverviewWidget/TeamTaskOverviewWidget";
import OrganizationSetupProgressWidget from "./widgets/specialized/OrganizationSetupProgressWidget/OrganizationSetupProgressWidget";

import SummaryWidget from "./widgets/generic/SummaryWidget/SummaryWidget";
import ListWidget from "./widgets/generic/ListWidget/ListWidget";
import ActionWidget from "./widgets/generic/ActionWidget/ActionWidget";
import ChartWidget from "./widgets/generic/ChartWidget/ChartWidget";

import {
  canViewEmployees,
  canViewDepartments,
  canViewDesignations,
  isSuperOrAdmin,
} from "../../utils/permissionUtils";

export const dashboardWidgets = [
  // ==================================================
  // Personal / Actions
  // ==================================================

  {
    key: "attendance",
    enabled: true,
    component: AttendanceActionWidget,

    config: {
      width: 4,
    },

    getProps: (data) => ({
      data,
    }),
  },

  {
    key: "leave-balance",
    enabled: true,
    component: SummaryWidget,

    config: {
      width: 4,
    },

    getProps: (data) => {
      const leaveBalance = Array.isArray(data?.leaveBalance)
        ? data.leaveBalance
        : [];

      const total = leaveBalance.reduce(
        (sum, leave) => sum + Number(leave?.total_entitlement || 0),
        0,
      );

      const remaining = leaveBalance.reduce(
        (sum, leave) => sum + Number(leave?.remaining_balance || 0),
        0,
      );

      const used = Math.max(total - remaining, 0);

      return {
        title: "Leave Balance",
        value: remaining,
        subtitle: "Days remaining",
        icon: Umbrella,

        action: "View All",

        onAction: () => {
          window.location.href = "/leaves";
        },

        stats: [
          {
            key: "total",
            label: "Total",
            value: total,
          },
          {
            key: "used",
            label: "Used",
            value: used,
          },
          {
            key: "remaining",
            label: "Remaining",
            value: remaining,
          },
        ],
      };
    },
  },

  {
    key: "quick-actions",
    enabled: true,
    component: ActionWidget,

    config: {
      width: 4,
    },

    getProps: (data, actions) => ({
      title: "Quick Actions",
      columns: 1,

      actions: [
        {
          key: "apply-leave",
          label: "Apply Leave",
          icon: FilePlus2,
          onClick: actions?.onApplyLeave,
        },
        {
          key: "attendance",
          label: "View Attendance",
          icon: Clock3,
          onClick: () => {
            window.location.href = "/attendance";
          },
        },
        {
          key: "tasks",
          label: "View Tasks",
          icon: ClipboardList,
          onClick: () => {
            window.location.href = "/tasks";
          },
        },
        {
          key: "holidays",
          label: "View Holidays",
          icon: CalendarDays,
          onClick: () => {
            window.location.href = "/holidays";
          },
        },
      ],
    }),
  },

  // ==================================================
  // Attendance
  // ==================================================

  {
    key: "attendance-trend",
    enabled: true,
    component: ChartWidget,

    config: {
      width: 8,
    },

    getProps: (data) => {
      const attendanceData = Array.isArray(data?.attendanceHistory?.data)
        ? data.attendanceHistory.data
        : [];

      const chartData = attendanceData
        .filter((item) => item?.status !== "Holiday")
        .map((item) => ({
          date: item?.attendanceDate || "--",
          hours: Number(
            (Number(item?.workingSeconds || 0) / 3600).toFixed(2),
          ),
        }));

      return {
        title: "Working Hours",
        description: "Daily working hours for the selected period.",
        data: chartData,
        type: "line",
        xKey: "date",
        dataKey: "hours",
        color: "#0BA37F",

        valueFormatter: (value) => `${Number(value).toFixed(1)}h`,

        emptyMessage: "No working hours data available.",
      };
    },
  },

  {
    key: "last-month-attendance",
    enabled: true,
    component: SummaryWidget,

    config: {
      width: 4,
    },

    getProps: (data) => {
      const stats = Array.isArray(data?.attendanceHistory?.stats)
        ? data.attendanceHistory.stats
        : [];

      const attendanceRate = stats.find(
        (item) => item?.label === "Attendance Rate",
      );

      const presentDays = stats.find(
        (item) => item?.label === "Present Days",
      );

      const absentDays = stats.find((item) => item?.label === "Absent Days");

      return {
        title: "Last Month Attendance",
        value: attendanceRate?.value || "0%",
        subtitle: "Attendance rate",
        icon: CalendarCheck,

        stats: [
          {
            key: "present",
            label: "Present",
            value: presentDays?.value || "0",
          },
          {
            key: "absent",
            label: "Absent",
            value: absentDays?.value || "0",
          },
        ],
      };
    },
  },

  // ==================================================
  // Work Management / Leave
  // ==================================================

  {
    key: "team-tasks",
    enabled: true,
    component: TeamTaskWidget,

    canShow: (data) =>
      data?.teamAccess?.hasTeam === true &&
      data?.teamAccess?.isAdminOrHr !== true,

    config: {
      width: 8,
    },

    getProps: (data) => ({
      data,
    }),
  },

  {
    key: "team-task-overview",
    enabled: true,
    component: TeamTaskOverviewWidget,

    canShow: (data) => data?.teamAccess?.isAdminOrHr === true,

    config: {
      width: 8,
    },

    getProps: (data) => ({
      data,
    }),
  },

  {
    key: "applied-leaves",
    enabled: true,
    component: ListWidget,

    config: {
      width: 4,
    },

    getProps: (data) => {
      const leaves = Array.isArray(data?.leaves) ? data.leaves : [];

      return {
        title: "Applied Leave",

        items: leaves.slice(0, 4),

        action: "View All",

        onAction: () => {
          window.location.href = "/leaves";
        },

        emptyMessage: "No leave applications.",

        renderItem: (leave) => {
          const status = String(leave?.status || "PENDING").toLowerCase();

          const statusLabel =
            status.charAt(0).toUpperCase() + status.slice(1);

          return (
            <div className="applied-leave-item">
              <div className="applied-leave-item__info">
                <strong>{leave?.leave_policy_name || "Leave"}</strong>

                <span>
                  {leave?.from_date === leave?.to_date
                    ? leave?.from_date
                    : `${leave?.from_date || "--"} - ${leave?.to_date || "--"
                    }`}
                </span>
              </div>

              <div className="applied-leave-item__meta">
                <span className="applied-leave-item__duration">
                  {Number(leave?.duration || 0)}{" "}
                  {Number(leave?.duration || 0) === 1 ? "day" : "days"}
                </span>

                <span
                  className={`applied-leave-item__status applied-leave-item__status--${status}`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          );
        },
      };
    },
  },

  // ==================================================
  // Holidays / Employee Distribution
  // ==================================================

  {
    key: "upcoming-holidays",
    enabled: true,
    component: ListWidget,

    config: {
      width: 4,
    },

    getProps: (data) => {
      const holidays = Array.isArray(data?.holidays) ? data.holidays : [];

      return {
        title: "Upcoming Holidays",

        items: holidays,

        action: "View All",

        onAction: () => {
          window.location.href = "/holidays";
        },

        emptyMessage: "No upcoming holidays.",

        renderItem: (holiday) => (
          <div className="upcoming-holiday-item">
            <div className="upcoming-holiday-item__icon">
              <CalendarDays size={16} />
            </div>

            <div className="upcoming-holiday-item__info">
              <strong>
                {holiday?.name || holiday?.holiday_name || "Holiday"}
              </strong>

              <span>
                {holiday?.holidayTypeLabel || holiday?.type || "Holiday"}
              </span>
            </div>

            <div className="upcoming-holiday-item__date">
              <strong>{holiday?.day || "--"}</strong>

              <span>
                {holiday?.date
                  ? new Date(holiday.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })
                  : "--"}
              </span>
            </div>
          </div>
        ),
      };
    },
  },

  {
    key: "employee-distribution",
    enabled: true,
    component: ChartWidget,

    canShow: () =>
      canViewEmployees() &&
      (canViewDepartments() || canViewDesignations()),

    config: {
      width: 8,
    },

    getProps: (data) => {
      const employees = Array.isArray(data?.employees)
        ? data.employees
        : [];

      // ----------------------------------------------
      // Collect unique designations
      // ----------------------------------------------

      const designationMap = {};

      employees.forEach((employee) => {
        const department = employee?.department;
        const designation = employee?.designation;

        if (
          !department?.id ||
          !department?.name ||
          !designation?.id ||
          !designation?.name
        ) {
          return;
        }

        const designationKey = String(designation.id);

        if (!designationMap[designationKey]) {
          designationMap[designationKey] = {
            id: designation.id,
            name: designation.name,
          };
        }
      });

      const designations = Object.values(designationMap);

      // ----------------------------------------------
      // Build department-based stacked data
      // ----------------------------------------------

      const departmentMap = {};

      employees.forEach((employee) => {
        const department = employee?.department;
        const designation = employee?.designation;

        if (!department?.id || !department?.name || !designation?.id) {
          return;
        }

        const departmentKey = String(department.id);
        const designationKey = String(designation.id);

        if (!departmentMap[departmentKey]) {
          departmentMap[departmentKey] = {
            department: department.name,
          };
        }

        departmentMap[departmentKey][designationKey] =
          (departmentMap[departmentKey][designationKey] || 0) + 1;
      });

      const chartData = Object.values(departmentMap);

      // ----------------------------------------------
      // Designation colors
      // ----------------------------------------------

      const shades = [
        "#0BA37F",
        "#0F6B68",
        "#3FAF96",
        "#D4AF37",
        "#A98721",
        "#6FC7B0",
        "#8A6B16",
        "#1A7F78",
      ];

      return {
        title: "Employees by Department",

        description:
          "Employee distribution across departments and designations.",

        data: chartData,

        type: "bar",

        xKey: "department",

        series: designations.map((designation, index) => ({
          dataKey: String(designation.id),
          name: designation.name,
          color: shades[index % shades.length],
        })),

        emptyMessage: "No employee data available.",
      };
    },
  },

  // ==================================================
  // Organization Overview
  // ==================================================

  {
    key: "organization-setup-progress",
    enabled: true,
    component: OrganizationSetupProgressWidget,

    // Organization setup progress is only relevant to
    // Super Admin / Admin users.
    canShow: () => isSuperOrAdmin(),

    config: {
      width: 8,
    },

    getProps: (data) => ({
      data,
    }),
  },

  {
    key: "employees-summary",
    enabled: true,
    component: SummaryWidget,

    canShow: () => canViewEmployees(),

    config: {
      width: 4,
    },

    getProps: (data) => {
      const organization = data?.organization?.employees || {};

      const total = organization.total ?? 0;
      const inactive = organization.inactive ?? 0;

      return {
        title: "Employees",
        value: total,
        subtitle: "Total employees",
        icon: Users,

        action: "View All",

        onAction: () => {
          window.location.href = "/employees";
        },

        stats: [
          {
            key: "active",
            label: "Active",
            value: Math.max(total - inactive, 0),
          },
          {
            key: "inactive",
            label: "Inactive",
            value: inactive,
          },
        ],
      };
    },
  },

  {
    key: "departments-summary",
    enabled: true,
    component: SummaryWidget,

    canShow: () => canViewDepartments(),

    config: {
      width: 4,
    },

    getProps: (data) => {
      const organization = data?.organization?.departments || {};

      const total = organization.total ?? 0;
      const inactive = organization.inactive ?? 0;

      return {
        title: "Departments",
        value: total,
        subtitle: "Total departments",
        icon: Building2,

        action: "View All",

        onAction: () => {
          window.location.href = "/departments";
        },

        stats: [
          {
            key: "active",
            label: "Active",
            value: Math.max(total - inactive, 0),
          },
          {
            key: "inactive",
            label: "Inactive",
            value: inactive,
          },
        ],
      };
    },
  },

  {
    key: "designations-summary",
    enabled: true,
    component: SummaryWidget,

    canShow: () => canViewDesignations(),

    config: {
      width: 4,
    },

    getProps: (data) => {
      const organization = data?.organization?.designations || {};

      const total = organization.total ?? 0;
      const inactive = organization.inactive ?? 0;

      return {
        title: "Designations",
        value: total,
        subtitle: "Total designations",
        icon: UserRoundCog,

        action: "View All",

        onAction: () => {
          window.location.href = "/designations";
        },

        stats: [
          {
            key: "active",
            label: "Active",
            value: Math.max(total - inactive, 0),
          },
          {
            key: "inactive",
            label: "Inactive",
            value: inactive,
          },
        ],
      };
    },
  },
];