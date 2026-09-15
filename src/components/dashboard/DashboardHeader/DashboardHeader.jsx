import "./DashboardHeader.css";

const DashboardHeader = () => {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__content">
        <h1 className="dashboard-header__title">
          Good Morning, Anu! <span>👋</span>
        </h1>

        <p className="dashboard-header__subtitle">
          Have a productive day ahead.
        </p>
      </div>
    </header>
  );
};

export default DashboardHeader;