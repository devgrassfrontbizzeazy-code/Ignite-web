import TodayOverview from "./widgets/TodayOverview/TodayOverview";
import MyTasks from "./widgets/MyTasks/MyTasks";

export const dashboardWidgets = [
  {
    key: "today-overview",
    enabled: true,
    component: TodayOverview,
    config: {
      width: 8,
    },
  },
  {
    key: "my-tasks",
    enabled: true,
    component: MyTasks,
    config: {
      width: 12,
    },
  },
];