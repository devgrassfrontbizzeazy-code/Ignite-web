
import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Search, Sun } from "lucide-react";

import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import StatCard from "../../components/common/StatCard/StatCard";
import HolidayTable from "../../components/holidays/HolidayTable/HolidayTable";
import HolidayForm from "../../components/holidays/HolidayForm/HolidayForm";

import "../../styles/variables.css";
import "../../styles/global.css";
import "./Holidays.css";

const initialHolidays = [
  {
    id: 1,
    name: "Republic Day",
    date: "2026-01-26",
    day: "Monday",
    type: "Public Holiday",
    description: "National holiday celebrating the Republic of India.",
    recurring: true,
    status: "Active",
  },
  {
    id: 2,
    name: "Holi",
    date: "2026-03-04",
    day: "Wednesday",
    type: "Public Holiday",
    description: "Festival of colours.",
    recurring: true,
    status: "Active",
  },
  {
    id: 3,
    name: "Good Friday",
    date: "2026-04-03",
    day: "Friday",
    type: "Public Holiday",
    description: "Christian observance.",
    recurring: true,
    status: "Active",
  },
  {
    id: 4,
    name: "Company Foundation Day",
    date: "2026-04-15",
    day: "Wednesday",
    type: "Company Holiday",
    description: "Annual company foundation day.",
    recurring: true,
    status: "Active",
  },
  {
    id: 5,
    name: "Independence Day",
    date: "2026-08-15",
    day: "Saturday",
    type: "Public Holiday",
    description: "National holiday celebrating India's independence.",
    recurring: true,
    status: "Active",
  },
  {
    id: 6,
    name: "Gandhi Jayanti",
    date: "2026-10-02",
    day: "Friday",
    type: "Public Holiday",
    description: "Birth anniversary of Mahatma Gandhi.",
    recurring: true,
    status: "Active",
  },
  {
    id: 7,
    name: "Diwali",
    date: "2026-11-08",
    day: "Sunday",
    type: "Public Holiday",
    description: "Festival of lights.",
    recurring: true,
    status: "Active",
  },
  {
    id: 8,
    name: "Christmas",
    date: "2026-12-25",
    day: "Friday",
    type: "Public Holiday",
    description: "Christmas Day.",
    recurring: true,
    status: "Active",
  },
];

const getYearFromDate = (date) => {
  return Number(date.split("-")[0]);
};

const formatHolidayDate = (date) => {
  const holidayDate = new Date(`${date}T00:00:00`);

  return holidayDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Holidays = () => {
  const [holidays, setHolidays] = useState(initialHolidays);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const filteredHolidays = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return holidays
      .filter(
        (holiday) => getYearFromDate(holiday.date) === selectedYear,
      )
      .filter((holiday) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          holiday.name.toLowerCase().includes(normalizedSearch) ||
          holiday.type.toLowerCase().includes(normalizedSearch) ||
          holiday.description.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, selectedYear, searchTerm]);

  const yearHolidays = useMemo(() => {
    return holidays.filter(
      (holiday) => getYearFromDate(holiday.date) === selectedYear,
    );
  }, [holidays, selectedYear]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = yearHolidays.filter((holiday) => {
      const holidayDate = new Date(`${holiday.date}T00:00:00`);

      return holidayDate >= today && holiday.status === "Active";
    });

    const publicHolidays = yearHolidays.filter(
      (holiday) =>
        holiday.type === "Public Holiday" && holiday.status === "Active",
    );

    const optionalHolidays = yearHolidays.filter(
      (holiday) =>
        holiday.type === "Optional Holiday" && holiday.status === "Active",
    );

    return {
      total: yearHolidays.length,
      upcoming: upcoming.length,
      public: publicHolidays.length,
      optional: optionalHolidays.length,
    };
  }, [yearHolidays]);

  // Stats are declared AFTER `stats` so they can safely use its values.
  const holidayStats = [
    {
      label: "Total Holidays",
      value: stats.total,
      description: `Configured for ${selectedYear}`,
      icon: CalendarDays,
      variant: "blue",
    },
    {
      label: "Upcoming Holidays",
      value: stats.upcoming,
      description: `Remaining in ${selectedYear}`,
      icon: Sun,
      variant: "emerald",
    },
    {
      label: "Public Holidays",
      value: stats.public,
      description: "Active public holidays",
      icon: CheckCircle2,
      variant: "gold",
    },
    {
      label: "Optional Holidays",
      value: stats.optional,
      description: "Employee-selectable holidays",
      icon: CalendarDays,
      variant: "teal",
    },
  ];

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setShowForm(true);
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingHoliday(null);
  };

  const handleSave = (holidayData) => {
    if (editingHoliday) {
      setHolidays((current) =>
        current.map((holiday) =>
          holiday.id === editingHoliday.id
            ? {
                ...holiday,
                ...holidayData,
              }
            : holiday,
        ),
      );
    } else {
      const newHoliday = {
        id: Date.now(),
        ...holidayData,
        status: "Active",
      };

      setHolidays((current) => [...current, newHoliday]);
    }

    handleCloseForm();
  };

  const handleDelete = (holidayId) => {
    const holiday = holidays.find((item) => item.id === holidayId);

    if (!holiday) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${holiday.name}"? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setHolidays((current) =>
      current.filter((item) => item.id !== holidayId),
    );
  };

  const handleToggleStatus = (holidayId) => {
    setHolidays((current) =>
      current.map((holiday) =>
        holiday.id === holidayId
          ? {
              ...holiday,
              status:
                holiday.status === "Active" ? "Inactive" : "Active",
            }
          : holiday,
      ),
    );
  };

  return (
    <div className="holidays-page">
      <PageHeader
        eyebrow="Organization"
        title="Holiday Configuration"
        description="Manage your company's holidays and yearly holiday calendar."
        action={
          <Button variant="primary" onClick={handleOpenAdd}>
            + Add Holiday
          </Button>
        }
      />

      {/* Shared Ignite Stat Cards */}
      <div className="stats-grid stats-grid--4">
        {holidayStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <StatCard
              key={stat.label}
              title={stat.label}
              value={stat.value}
              description={stat.description}
              icon={<Icon size={18} strokeWidth={2} />}
              variant={stat.variant}
            />
          );
        })}
      </div>

      <section className="holidays-section">
        <div className="holidays-section-header">
          <div>
            <h2>Holiday Calendar</h2>

            <p>
              Configure the holidays observed by your organization.
            </p>
          </div>

          <div className="holidays-section-controls">
            <div className="holidays-year-control">
              <label htmlFor="holiday-year">Year</label>

              <select
                id="holiday-year"
                value={selectedYear}
                onChange={(event) =>
                  setSelectedYear(Number(event.target.value))
                }
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="holidays-search">
              <Search size={15} strokeWidth={2} />

              <input
                type="text"
                placeholder="Search holidays..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>
          </div>
        </div>

        <HolidayTable
          holidays={filteredHolidays.map((holiday) => ({
            ...holiday,
            date: formatHolidayDate(holiday.date),
          }))}
          onEdit={(holiday) => {
            const originalHoliday = holidays.find(
              (item) => item.id === holiday.id,
            );

            handleEdit(originalHoliday);
          }}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      </section>

      {showForm && (
        <HolidayForm
          holiday={editingHoliday}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Holidays;

