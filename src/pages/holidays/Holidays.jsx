
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  List,
  Search,
  Sun,
} from "lucide-react";

import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import StatCard from "../../components/common/StatCard/StatCard";
import HolidayTable from "../../components/holidays/HolidayTable/HolidayTable";
import HolidayForm from "../../components/holidays/HolidayForm/HolidayForm";
import HolidayCalendar from "../../components/holidays/HolidayCalendar/HolidayCalendar";
import HolidayImportModal from "../../components/holidays/HolidayImportModal/HolidayImportModal";

import { canCreateHolidays } from "../../utils/permissionUtils";

import "../../styles/variables.css";
import "../../styles/global.css";
import "./Holidays.css";

const getYearFromDate = (date) => Number(date.split("-")[0]);

const formatHolidayDate = (date) => {
  const holidayDate = new Date(`${date}T00:00:00`);

  return holidayDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Holidays = () => {
  // Start with no demo holidays.
  // These will later be populated from the backend API.
  const [holidays, setHolidays] = useState([]);

  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedType, setSelectedType] = useState("All Types");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const holidayTypes = useMemo(() => {
    return ["All Types", ...new Set(holidays.map((holiday) => holiday.type))];
  }, [holidays]);

  const yearHolidays = useMemo(() => {
    return holidays.filter(
      (holiday) => getYearFromDate(holiday.date) === selectedYear,
    );
  }, [holidays, selectedYear]);

  const filteredHolidays = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return yearHolidays
      .filter((holiday) => {
        if (selectedType === "All Types") {
          return true;
        }

        return holiday.type === selectedType;
      })
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
  }, [yearHolidays, selectedType, searchTerm]);

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

    setHolidays((current) => current.filter((item) => item.id !== holidayId));
  };

  const handleToggleStatus = (holidayId) => {
    setHolidays((current) =>
      current.map((holiday) =>
        holiday.id === holidayId
          ? {
              ...holiday,
              status: holiday.status === "Active" ? "Inactive" : "Active",
            }
          : holiday,
      ),
    );
  };

  const handleImport = (importedHolidays) => {
    setHolidays((current) => [
      ...current,
      ...importedHolidays.map((holiday) => ({
        id: Date.now() + Math.random(),
        ...holiday,
      })),
    ]);

    setShowImport(false);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSearchTerm("");
    setSelectedType("All Types");
  };

  return (
    <div className="holidays-page">
      <PageHeader
        eyebrow="Organization"
        title="Holiday Configuration"
        description="Manage your company's holidays and yearly holiday calendar."
        action={
          canCreateHolidays() ? (
            <div className="holidays-header-actions">
              <Button
                variant="secondary"
                onClick={() => setShowImport(true)}
              >
                Import CSV
              </Button>

              <Button variant="primary" onClick={handleOpenAdd}>
                + Add Holiday
              </Button>
            </div>
          ) : null
        }
      />

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
          <div className="holidays-section-heading">
            <h2>Holiday Calendar</h2>

            <p>Configure the holidays observed by your organization.</p>
          </div>

          <div className="holidays-section-controls">
            <div className="holidays-year-control">
              <label htmlFor="holiday-year">Year</label>

              <div className="holidays-select-wrapper">
                <select
                  id="holiday-year"
                  value={selectedYear}
                  onChange={(event) =>
                    handleYearChange(Number(event.target.value))
                  }
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <ChevronDown size={14} />
              </div>
            </div>

            <div className="holidays-filter-wrapper">
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                aria-label="Filter by holiday type"
              >
                {holidayTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <ChevronDown size={14} />
            </div>

            <div className="holidays-search">
              <Search size={15} strokeWidth={2} />

              <input
                type="text"
                placeholder="Search holidays..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="holidays-view-toggle">
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                aria-label="List view"
                title="List view"
              >
                <List size={15} strokeWidth={2} />
              </button>

              <button
                type="button"
                className={viewMode === "calendar" ? "active" : ""}
                onClick={() => setViewMode("calendar")}
                aria-label="Calendar view"
                title="Calendar view"
              >
                <CalendarDays size={15} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <HolidayTable
            holidays={filteredHolidays.map((holiday) => ({
              ...holiday,
              date: formatHolidayDate(holiday.date),
            }))}
            onEdit={(holiday) => {
              const originalHoliday = holidays.find(
                (item) => item.id === holiday.id,
              );

              if (originalHoliday) {
                handleEdit(originalHoliday);
              }
            }}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        ) : (
          <HolidayCalendar
            holidays={filteredHolidays}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
          />
        )}
      </section>

      {showImport && (
        <HolidayImportModal
          existingHolidays={holidays}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

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

