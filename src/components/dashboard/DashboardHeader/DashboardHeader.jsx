import "./DashboardHeader.css";

const DashboardHeader = () => {
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const user = getUser();

  const firstName =
    user.first_name ||
    user.firstName ||
    user.full_name?.split(" ")[0] ||
    "there";

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__content">
        <h1 className="dashboard-header__title">
          {getGreeting()}, {firstName}! 
        </h1>

        <p className="dashboard-header__subtitle">
          Here's your workspace overview for {formattedDate}.
        </p>
      </div>
    </header>
  );
};

export default DashboardHeader;