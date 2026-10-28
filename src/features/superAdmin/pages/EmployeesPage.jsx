import { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Building2, Mail, Phone, Calendar } from "lucide-react";
import superAdminAPI from "../services/superAdminAPI";
import useDebounce from "../hooks/useDebounce";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import StatusBadge from "../components/StatusBadge";
import ErrorState from "../components/ErrorState";
import "./EmployeesPage.css";

export default function EmployeesPage() {
  const { setHeaderInfo } = useOutletContext() || {};

  // Search & Filter state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Data state
  const [employees, setEmployees] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic companies list for company filter
  const [companiesList, setCompaniesList] = useState([]);

  useEffect(() => {
    if (setHeaderInfo) {
      setHeaderInfo({
        title: "Platform Workforce Directory",
        breadcrumbs: ["Platform", "Employees"],
      });
    }
  }, [setHeaderInfo]);

  // Load companies for the company filter dropdown
  useEffect(() => {
    let isMounted = true;
    superAdminAPI
      .getCompanies({ page_size: 100 })
      .then((res) => {
        if (isMounted && res && Array.isArray(res.data)) {
          setCompaniesList(res.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, companyFilter, statusFilter, typeFilter, activeFilter, ordering]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: debouncedSearch,
        company_id: companyFilter,
        employment_status: statusFilter,
        employment_type: typeFilter,
        is_active: activeFilter,
        ordering,
        page: currentPage,
        page_size: pageSize,
      };

      const res = await superAdminAPI.getEmployees(params);

      const list = Array.isArray(res.data) ? res.data : [];
      setEmployees(list);
      setTotalCount(res.count ?? list.length);
      setTotalPages(res.total_pages ?? (Math.ceil((res.count ?? list.length) / pageSize) || 1));
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          "Unable to load employee directory."
      );
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    companyFilter,
    statusFilter,
    typeFilter,
    activeFilter,
    ordering,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleClearFilters = () => {
    setSearchInput("");
    setCompanyFilter("");
    setStatusFilter("");
    setTypeFilter("");
    setActiveFilter("");
    setOrdering("-created_at");
  };

  const hasActiveFilters = Boolean(
    searchInput ||
      companyFilter ||
      statusFilter ||
      typeFilter ||
      activeFilter ||
      ordering !== "-created_at"
  );

  const handleSort = (sortKey) => {
    if (ordering === sortKey) {
      setOrdering(`-${sortKey}`);
    } else if (ordering === `-${sortKey}`) {
      setOrdering("created_at");
    } else {
      setOrdering(sortKey);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "full_name",
        label: "Employee",
        sortKey: "first_name",
        render: (emp) => {
          const initials =
            (emp.first_name?.[0] || "") + (emp.last_name?.[0] || "") || "E";

          return (
            <div className="super-emp-table__cell">
              {emp.profile_photo_url ? (
                <img
                  src={emp.profile_photo_url}
                  alt=""
                  className="super-emp-table__photo"
                />
              ) : (
                <div className="super-emp-table__avatar">{initials.toUpperCase()}</div>
              )}
              <div className="super-emp-table__name-info">
                <span className="super-emp-table__full-name">
                  {emp.full_name ||
                    `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
                    "Unnamed Employee"}
                </span>
                <span className="super-emp-table__code">{emp.employee_code || "No Code"}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "company",
        label: "Organization",
        render: (emp) =>
          emp.company ? (
            <div className="super-emp-table__company">
              <Link
                to={`/admin/companies/${emp.company.id}`}
                className="super-emp-table__company-link"
              >
                <Building2 size={13} />
                <span>{emp.company.name}</span>
              </Link>
              {emp.company.code && (
                <span className="super-emp-table__company-code">({emp.company.code})</span>
              )}
            </div>
          ) : (
            <span className="super-emp-table__muted">Unassigned</span>
          ),
      },
      {
        key: "department",
        label: "Department",
        render: (emp) => emp.department?.name || "—",
      },
      {
        key: "designation",
        label: "Designation",
        render: (emp) => emp.designation?.name || "—",
      },
      {
        key: "contact",
        label: "Contact",
        render: (emp) => (
          <div className="super-emp-table__contact">
            {emp.email && (
              <span className="super-emp-table__contact-item">
                <Mail size={12} />
                {emp.email}
              </span>
            )}
            {emp.phone && (
              <span className="super-emp-table__contact-item">
                <Phone size={12} />
                {emp.phone}
              </span>
            )}
            {!emp.email && !emp.phone && "—"}
          </div>
        ),
      },
      {
        key: "employment_type",
        label: "Type",
        render: (emp) => emp.employment_type || "—",
      },
      {
        key: "employment_status",
        label: "Status",
        render: (emp) => (
          <StatusBadge type="employment" value={emp.employment_status} />
        ),
      },
      {
        key: "is_active",
        label: "Active",
        render: (emp) => <StatusBadge type="active" value={emp.is_active} />,
      },
      {
        key: "date_of_joining",
        label: "Joining Date",
        sortKey: "date_of_joining",
        render: (emp) =>
          emp.date_of_joining ? (
            <span className="super-emp-table__date">
              <Calendar size={12} />
              {new Date(emp.date_of_joining).toLocaleDateString()}
            </span>
          ) : (
            "—"
          ),
      },
    ],
    []
  );

  const filterConfigs = [
    {
      key: "company",
      label: "All Organizations",
      value: companyFilter,
      options: companiesList.map((c) => ({
        label: c.name,
        value: String(c.id),
      })),
      onChange: setCompanyFilter,
    },
    {
      key: "status",
      label: "All Statuses",
      value: statusFilter,
      options: [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
        { label: "On Leave", value: "On Leave" },
        { label: "Probation", value: "Probation" },
        { label: "Terminated", value: "Terminated" },
      ],
      onChange: setStatusFilter,
    },
    {
      key: "type",
      label: "All Types",
      value: typeFilter,
      options: [
        { label: "Full Time", value: "Full Time" },
        { label: "Part Time", value: "Part Time" },
        { label: "Contract", value: "Contract" },
        { label: "Internship", value: "Internship" },
      ],
      onChange: setTypeFilter,
    },
    {
      key: "is_active",
      label: "Active State (All)",
      value: activeFilter,
      options: [
        { label: "Active Only", value: "true" },
        { label: "Inactive Only", value: "false" },
      ],
      onChange: setActiveFilter,
    },
  ];

  const currentSortKey = ordering.startsWith("-") ? ordering.slice(1) : ordering;
  const currentSortOrder = ordering.startsWith("-") ? "desc" : "asc";

  return (
    <div className="super-employees-page">
      {/* Search & Filter Header Bar */}
      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search employees by name, code, email, phone..."
        filters={filterConfigs}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        totalResults={totalCount}
      />

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="Employee Directory Query Failed"
          message={error}
          onRetry={fetchEmployees}
        />
      )}

      {/* Real Data Table */}
      {(!error || loading) && (
        <DataTable
          columns={columns}
          data={employees}
          loading={loading}
          keyField="id"
          emptyTitle="No employees found"
          emptyDescription={
            hasActiveFilters
              ? "No employee records match the selected filter criteria."
              : "No employees are registered across any company on the platform yet."
          }
          emptyActionLabel={hasActiveFilters ? "Reset Filters" : undefined}
          onEmptyAction={hasActiveFilters ? handleClearFilters : undefined}
          sortField={currentSortKey}
          sortOrder={currentSortOrder}
          onSort={handleSort}
          pagination={{
            count: totalCount,
            totalPages,
            currentPage,
            pageSize,
            onPageChange: setCurrentPage,
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            },
          }}
        />
      )}
    </div>
  );
}
