import { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { Eye, MapPin } from "lucide-react";
import superAdminAPI from "../services/superAdminAPI";
import useDebounce from "../hooks/useDebounce";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import StatusBadge from "../components/StatusBadge";
import ErrorState from "../components/ErrorState";
import "./CompaniesPage.css";

export default function CompaniesPage() {
  const { setHeaderInfo } = useOutletContext() || {};
  const navigate = useNavigate();

  // Filters state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [industryFilter, setIndustryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [fieldSalesFilter, setFieldSalesFilter] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Data state
  const [companies, setCompanies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic filter dropdown options derived from observed companies
  const [availableIndustries, setAvailableIndustries] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);

  useEffect(() => {
    if (setHeaderInfo) {
      setHeaderInfo({
        title: "Organizations Directory",
        breadcrumbs: ["Platform", "Companies"],
      });
    }
  }, [setHeaderInfo]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, industryFilter, typeFilter, countryFilter, fieldSalesFilter, ordering]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: debouncedSearch,
        industry: industryFilter,
        company_type: typeFilter,
        country: countryFilter,
        field_sales_enabled: fieldSalesFilter,
        ordering,
        page: currentPage,
        page_size: pageSize,
      };

      const res = await superAdminAPI.getCompanies(params);

      // Paginated response envelope: { status, success, count, total_pages, current_page, page_size, data }
      const list = Array.isArray(res.data) ? res.data : [];
      setCompanies(list);
      setTotalCount(res.count ?? list.length);
      setTotalPages(res.total_pages ?? (Math.ceil((res.count ?? list.length) / pageSize) || 1));

      // Extract distinct filter values to populate dropdowns dynamically without guessing
      if (list.length > 0) {
        setAvailableIndustries((prev) => {
          const set = new Set(prev);
          list.forEach((c) => c.industry && set.add(c.industry));
          return Array.from(set);
        });
        setAvailableTypes((prev) => {
          const set = new Set(prev);
          list.forEach((c) => c.company_type && set.add(c.company_type));
          return Array.from(set);
        });
        setAvailableCountries((prev) => {
          const set = new Set(prev);
          list.forEach((c) => c.country && set.add(c.country));
          return Array.from(set);
        });
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          "Unable to load companies directory."
      );
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    industryFilter,
    typeFilter,
    countryFilter,
    fieldSalesFilter,
    ordering,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleClearFilters = () => {
    setSearchInput("");
    setIndustryFilter("");
    setTypeFilter("");
    setCountryFilter("");
    setFieldSalesFilter("");
    setOrdering("-created_at");
  };

  const hasActiveFilters = Boolean(
    searchInput ||
      industryFilter ||
      typeFilter ||
      countryFilter ||
      fieldSalesFilter ||
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
        key: "name",
        label: "Organization",
        sortKey: "name",
        render: (comp) => (
          <div className="super-comp-table__cell">
            {comp.logo_url ? (
              <img src={comp.logo_url} alt="" className="super-comp-table__logo" />
            ) : (
              <div className="super-comp-table__avatar">
                {comp.name ? comp.name.charAt(0).toUpperCase() : "C"}
              </div>
            )}
            <div className="super-comp-table__info">
              <Link
                to={`/admin/companies/${comp.id}`}
                className="super-comp-table__name"
                onClick={(e) => e.stopPropagation()}
              >
                {comp.name}
              </Link>
              <span className="super-comp-table__email">{comp.company_email || "No email"}</span>
            </div>
          </div>
        ),
      },
      {
        key: "code",
        label: "Code",
        sortKey: "code",
        render: (comp) => (
          <span className="super-comp-table__code-pill">{comp.code || "—"}</span>
        ),
      },
      {
        key: "industry",
        label: "Industry",
        render: (comp) => comp.industry || "—",
      },
      {
        key: "company_type",
        label: "Type",
        render: (comp) => comp.company_type || "—",
      },
      {
        key: "location",
        label: "Location",
        render: (comp) => {
          const parts = [comp.city, comp.state, comp.country].filter(Boolean);
          return parts.length > 0 ? (
            <span className="super-comp-table__location" title={comp.full_address}>
              <MapPin size={12} />
              {parts.join(", ")}
            </span>
          ) : (
            "—"
          );
        },
      },
      {
        key: "owner",
        label: "Owner Account",
        render: (comp) => (
          <div className="super-comp-table__owner">
            <span className="super-comp-table__owner-name">
              {comp.owner?.first_name || comp.owner?.last_name
                ? `${comp.owner.first_name || ""} ${comp.owner.last_name || ""}`.trim()
                : comp.owner?.username || "—"}
            </span>
            {comp.owner?.email && (
              <span className="super-comp-table__owner-email">{comp.owner.email}</span>
            )}
          </div>
        ),
      },
      {
        key: "employee_count",
        label: "Employees",
        sortKey: "employee_count",
        render: (comp) => (
          <span className="super-comp-table__count-pill">
            {(comp.employee_count ?? 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "field_sales_enabled",
        label: "Field Sales",
        render: (comp) => (
          <StatusBadge type="fieldSales" value={comp.field_sales_enabled} />
        ),
      },
      {
        key: "created_at",
        label: "Registered",
        sortKey: "created_at",
        render: (comp) =>
          comp.created_at ? new Date(comp.created_at).toLocaleDateString() : "—",
      },
      {
        key: "actions",
        label: "Actions",
        render: (comp) => (
          <Link
            to={`/admin/companies/${comp.id}`}
            className="super-comp-table__inspect-btn"
            title="Inspect Company Profile"
          >
            <Eye size={14} />
            <span>Inspect</span>
          </Link>
        ),
      },
    ],
    []
  );

  const filterConfigs = [
    {
      key: "industry",
      label: "All Industries",
      value: industryFilter,
      options: availableIndustries.map((ind) => ({ label: ind, value: ind })),
      onChange: setIndustryFilter,
    },
    {
      key: "type",
      label: "All Company Types",
      value: typeFilter,
      options: availableTypes.map((typ) => ({ label: typ, value: typ })),
      onChange: setTypeFilter,
    },
    {
      key: "country",
      label: "All Countries",
      value: countryFilter,
      options: availableCountries.map((c) => ({ label: c, value: c })),
      onChange: setCountryFilter,
    },
    {
      key: "field_sales",
      label: "Field Sales (All)",
      value: fieldSalesFilter,
      options: [
        { label: "Enabled", value: "true" },
        { label: "Disabled", value: "false" },
      ],
      onChange: setFieldSalesFilter,
    },
  ];

  const currentSortKey = ordering.startsWith("-") ? ordering.slice(1) : ordering;
  const currentSortOrder = ordering.startsWith("-") ? "desc" : "asc";

  return (
    <div className="super-companies-page">
      {/* Search & Filter Header Bar */}
      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search organizations by name, code, email, city, country..."
        filters={filterConfigs}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        totalResults={totalCount}
      />

      {/* Error state if API call failed */}
      {error && !loading && (
        <ErrorState
          title="Directory Query Failed"
          message={error}
          onRetry={fetchCompanies}
        />
      )}

      {/* Real Data Table */}
      {(!error || loading) && (
        <DataTable
          columns={columns}
          data={companies}
          loading={loading}
          keyField="id"
          emptyTitle="No organizations found"
          emptyDescription={
            hasActiveFilters
              ? "No companies match the selected search or filter parameters. Try broadening your criteria."
              : "No organizations exist on this platform yet."
          }
          emptyActionLabel={hasActiveFilters ? "Reset Filters" : undefined}
          onEmptyAction={hasActiveFilters ? handleClearFilters : undefined}
          onRowClick={(comp) => navigate(`/admin/companies/${comp.id}`)}
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
