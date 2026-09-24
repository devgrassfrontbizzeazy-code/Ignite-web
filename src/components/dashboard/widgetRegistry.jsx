import {
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  FilePlus2,
  Umbrella,
  UserRoundCog,
  Users,
} from "lucide-react";

import AttendanceActionWidget from "./widgets/specialized/AttendanceActionWidget/AttendanceActionWidget";
import TeamTaskWidget from "./widgets/specialized/TeamTaskWidget/TeamTaskWidget";

import SummaryWidget from "./widgets/generic/SummaryWidget/SummaryWidget";
import ListWidget from "./widgets/generic/ListWidget/ListWidget";
import ActionWidget from "./widgets/generic/ActionWidget/ActionWidget";

import {
  canViewEmployees,
  canViewDepartments,
  canViewDesignations,
} from "../../utils/permissionUtils";

export const dashboardWidgets = [
  {
    key: "attendance",
    enabled: true,
    component: AttendanceActionWidget,
    config: {
      width: 4,
    },
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
        (sum, leave) =>
          sum + Number(leave?.total_entitlement || 0),
        0,
      );

      const remaining = leaveBalance.reduce(
        (sum, leave) =>
          sum + Number(leave?.remaining_balance || 0),
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
    key: "upcoming-holidays",
    enabled: true,
    component: ListWidget,
    config: {
      width: 4,
    },
    getProps: (data) => {
      const holidays = Array.isArray(data?.holidays)
        ? data.holidays
        : [];

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
                {holiday?.name ||
                  holiday?.holiday_name ||
                  "Holiday"}
              </strong>

              <span>
                {holiday?.holidayTypeLabel ||
                  holiday?.type ||
                  "Holiday"}
              </span>
            </div>

            <div className="upcoming-holiday-item__date">
              <strong>
                {holiday?.day || "--"}
              </strong>

              <span>
                {holiday?.date
                  ? new Date(
                      holiday.date,
                    ).toLocaleDateString("en-IN", {
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
    key: "team-tasks",
    enabled: true,
    component: TeamTaskWidget,

    canShow: (data) =>
      data?.teamAccess?.hasTeam === true,

    config: {
      width: 8,
    },
  },

  {
    key: "quick-actions",
    enabled: true,
    component: ActionWidget,
    config: {
      width: 4,
    },
    getProps: () => ({
      title: "Quick Actions",
      columns: 1,

      actions: [
        {
          key: "apply-leave",
          label: "Apply Leave",
          icon: FilePlus2,

          onClick: () => {
            window.location.href = "/leaves/apply";
          },
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

  // --------------------------------------------------
  // Organization Overview
  // --------------------------------------------------

  {
    key: "employees-summary",
    enabled: true,
    component: SummaryWidget,

    canShow: () => canViewEmployees(),

    config: {
      width: 3,
    },

    getProps: (data) => {
      const organization =
        data?.organization?.employees || {};

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
      width: 3,
    },

    getProps: (data) => {
      const organization =
        data?.organization?.departments || {};

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

    canShow: (data) => canViewDesignations(),

    config: {
      width: 3,
    },

    getProps: (data) => {
      const organization =
        data?.organization?.designations || {};

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