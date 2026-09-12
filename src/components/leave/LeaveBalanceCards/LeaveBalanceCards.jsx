import {
  CalendarDays,
  HeartPulse,
  BriefcaseBusiness,
  MoreHorizontal,
} from "lucide-react";

import StatCard from "../../common/StatCard/StatCard";
import "./LeaveBalanceCards.css";

const LeaveBalanceCards = ({ balances = [] }) => {
  const icons = {
    casual: CalendarDays,
    sick: HeartPulse,
    earned: BriefcaseBusiness,
    other: MoreHorizontal,
  };

  return (
    <div className="leave-balance-grid">
      {balances.map((balance) => {
        const Icon = icons[balance.id] || CalendarDays;
        const percentage =
          balance.total > 0
            ? Math.min((balance.available / balance.total) * 100, 100)
            : 0;

        return (
          <StatCard
            key={balance.id}
            title="Available"
            value={`${balance.available}`}
            description={`${balance.used} days used • ${balance.total} total`}
            icon={<Icon size={18} strokeWidth={2} />}
            variant={
              balance.id === "casual"
                ? "blue"
                : balance.id === "sick"
                  ? "emerald"
                  : balance.id === "earned"
                    ? "gold"
                    : "teal"
            }
            action={
              <span className="leave-balance-card__mini-trend">
                {Math.round(percentage)}%
              </span>
            }
          />
        );
      })}
    </div>
  );
};

export default LeaveBalanceCards;