import {
    ShieldCheck,
    CheckCircle2,
    KeyRound,
    Users,
} from "lucide-react";

import StatCard from "../../common/StatCard/StatCard";
import "./RoleStats.css";

const RoleStats = ({
    total = 0,
    active = 0,
    permissions = 0,
    employees = 0,
}) => {
    const stats = [
        {
            title: "Total Roles",
            value: total,
            icon: <ShieldCheck size={20} />,
            variant: "primary",
        },
        {
            title: "Active Roles",
            value: active,
            icon: <CheckCircle2 size={20} />,
            variant: "secondary",
        },
        {
            title: "Permissions",
            value: permissions,
            icon: <KeyRound size={20} />,
            variant: "accent",
        },
        {
            title: "Assigned Employees",
            value: employees,
            icon: <Users size={20} />,
            variant: "primary",
        },
    ];

    return (
        <section className="role-stats">
            {stats.map((stat) => (
                <StatCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    variant={stat.variant}
                />
            ))}
        </section>
    );
};

export default RoleStats;