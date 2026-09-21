
import { useEffect, useMemo, useState } from "react";
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
import holidayAPI from "../../services/api/holidayAPI";

import "../../styles/variables.css";
import "../../styles/global.css";
import "./Holidays.css";

const getYearFromDate = (date) => {
  if (!date) return null;

  const match = String(date).match(/^(\d{4})/);

  return match ? Number(match[1]) : null;
};

const formatHolidayDate = (date) => {
  const holidayDate = new Date(`${date}T00:00:00`);

  return holidayDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeHoliday = (holiday) => ({
  ...holiday,

  name:
    holiday.name ||
    holiday.holiday_name ||
    holiday.holidayName ||
    "",

  type:
    holiday.holidayTypeLabel ||
    holiday.holiday_type_label ||
    holiday.holiday_type ||
    holiday.holidayType ||
    "",

  description: holiday.description || "",

  recurringEveryYear:
    holiday.recurring_every_year ??
    holiday.recurringEveryYear ??
    false,
});

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await holidayAPI.getHolidays({
        year: selectedYear,
      });

      const holidayData = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setHolidays(holidayData.map(normalizeHoliday));
    } catch (error) {
      console.error("Failed to fetch holidays:", error);

      setError("Failed to load holidays. Please try again.");
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const holidayTypes = useMemo(() => {
    return [
      "All Types",
      ...new Set(
        holidays
          .map((holiday) => holiday.type)
          .filter(Boolean),
      ),
    ];
  }, [holidays]);

  const yearHolidays = useMemo(() => {
    return holidays.filter(
      (holiday) =>
        getYearFromDate(holiday.date) === selectedYear,
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
          holiday.name
            .toLowerCase()
            .includes(normalizedSearch) ||
          holiday.type
            .toLowerCase()
            .includes(normalizedSearch) ||
          holiday.description
            .toLowerCase()
            .includes(normalizedSearch)
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [yearHolidays, selectedType, searchTerm]);

  const stats = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const upcoming = yearHolidays.filter((holiday) => {
      const holidayDate = new Date(
        `${holiday.date}T00:00:00`,
      );

      return holidayDate >= today;
    });

    const publicHolidays = yearHolidays.filter(
      (holiday) =>
        holiday.holiday_type === "PUBLIC_HOLIDAY" ||
        holiday.type === "Public Holiday",
    );

    const optionalHolidays = yearHolidays.filter(
      (holiday) =>
        holiday.holiday_type === "OPTIONAL_HOLIDAY" ||
        holiday.type === "Optional Holiday",
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
      description: "Public holidays",
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

  const handleSave = async (holidayData) => {
    try {
      setError("");

      if (editingHoliday) {
        const response = await holidayAPI.updateHoliday(
          editingHoliday.id,
          holidayData,
        );

        const updatedHoliday =
          response?.data || response;

        setHolidays((current) =>
          current.map((holiday) =>
            holiday.id === editingHoliday.id
              ? normalizeHoliday(updatedHoliday)
              : holiday,
          ),
        );
      } else {
        const response =
          await holidayAPI.createHoliday(holidayData);

        const createdHoliday =
          response?.data || response;

        setHolidays((current) => [
          ...current,
          normalizeHoliday(createdHoliday),
        ]);
      }

      handleCloseForm();
    } catch (error) {
      console.error("Failed to save holiday:", error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error;

      setError(
        backendMessage ||
        "Failed to save holiday. Please try again.",
      );
    }
  };

  const handleDelete = async (holidayId) => {
    const holiday = holidays.find(
      (item) => item.id === holidayId,
    );

    if (!holiday) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${holiday.name}"? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setError("");

      await holidayAPI.deleteHoliday(holidayId);

      setHolidays((current) =>
        current.filter(
          (item) => item.id !== holidayId,
        ),
      );
    } catch (error) {
      console.error(
        "Failed to delete holiday:",
        error,
      );

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error;

      setError(
        backendMessage ||
        "Failed to delete holiday. Please try again.",
      );
    }
  };

  /*
   * CSV IMPORT
   *
   * The modal only validates and prepares the rows.
   * This function is responsible for actually
   * creating every holiday through the backend API.
   */
  const handleImport = async (importedHolidays) => {
    if (
      !Array.isArray(importedHolidays) ||
      !importedHolidays.length
    ) {
      return;
    }

    try {
      setError("");
      setLoading(true);

      /*
       * Create every imported holiday through the API.
       *
       * Using Promise.all ensures all rows are sent
       * to the backend instead of only updating local state.
       */
      await Promise.all(
        importedHolidays.map((holiday) =>
          holidayAPI.createHoliday({
            name: holiday.name.trim(),
            date: holiday.date,
            holiday_type:
              holiday.holiday_type ||
              "PUBLIC_HOLIDAY",
            description:
              holiday.description?.trim() || "",
            recurring_every_year:
              holiday.recurring_every_year ?? false,
          }),
        ),
      );

      /*
       * Close the modal only after all API calls succeed.
       */
      setShowImport(false);

      /*
       * Reload from backend so the table contains
       * the actual persisted records and IDs.
       */
      await fetchHolidays();

      setSearchTerm("");
      setSelectedType("All Types");
    } catch (error) {
      console.error(
        "Failed to import holidays:",
        error,
      );

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error;

      setError(
        backendMessage ||
        "Failed to import holidays. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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

              <Button
                variant="primary"
                onClick={handleOpenAdd}
              >
                + Add Holiday
              </Button>
            </div>
          ) : null
        }
      />

      {error && (
        <div className="holidays-error" role="alert">
          {error}
        </div>
      )}

      <div className="stats-grid stats-grid--4">
        {holidayStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <StatCard
              key={stat.label}
              title={stat.label}
              value={stat.value}
              description={stat.description}
              icon={
                <Icon
                  size={18}
                  strokeWidth={2}
                />
              }
              variant={stat.variant}
            />
          );
        })}
      </div>

      <section className="holidays-section">
        <div className="holidays-section-header">
          <div className="holidays-section-heading">
            <h2>Holiday Calendar</h2>

            <p>
              Configure the holidays observed by your
              organization.
            </p>
          </div>

          <div className="holidays-section-controls">
            <div className="holidays-year-control">
              <label htmlFor="holiday-year">
                Year
              </label>

              <div className="holidays-select-wrapper">
                <select
                  id="holiday-year"
                  value={selectedYear}
                  onChange={(event) =>
                    handleYearChange(
                      Number(event.target.value),
                    )
                  }
                >
                  {years.map((year) => (
                    <option
                      key={year}
                      value={year}
                    >
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
                onChange={(event) =>
                  setSelectedType(event.target.value)
                }
                aria-label="Filter by holiday type"
              >
                {holidayTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>

              <ChevronDown size={14} />
            </div>

            <div className="holidays-search">
              <Search
                size={15}
                strokeWidth={2}
              />

              <input
                type="text"
                placeholder="Search holidays..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

            <div className="holidays-view-toggle">
              <button
                type="button"
                className={
                  viewMode === "list"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setViewMode("list")
                }
                aria-label="List view"
                title="List view"
              >
                <List
                  size={15}
                  strokeWidth={2}
                />
              </button>

              <button
                type="button"
                className={
                  viewMode === "calendar"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setViewMode("calendar")
                }
                aria-label="Calendar view"
                title="Calendar view"
              >
                <CalendarDays
                  size={15}
                  strokeWidth={2}
                />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="holidays-loading">
            Loading holidays...
          </div>
        ) : viewMode === "list" ? (
          <HolidayTable
            holidays={filteredHolidays.map(
              (holiday) => ({
                ...holiday,
                date: formatHolidayDate(
                  holiday.date,
                ),
              }),
            )}
            onEdit={(holiday) => {
              const originalHoliday =
                holidays.find(
                  (item) =>
                    item.id === holiday.id,
                );

              if (originalHoliday) {
                handleEdit(originalHoliday);
              }
            }}
            onDelete={handleDelete}
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
          onClose={() =>
            setShowImport(false)
          }
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
