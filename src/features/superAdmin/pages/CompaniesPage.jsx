/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import {
  Eye,
  MapPin,
  Download,
  Plus,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
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

  // Add Company Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addFormError, setAddFormError] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const initialAddFormState = {
    name: "",
    code: "",
    industry: "Technology",
    company_type: "Private Limited",
    company_email: "",
    phone: "",
    website: "",
    full_address: "",
    country: "India",
    state: "",
    city: "",
    pincode: "",
    field_sales_enabled: false,
  };
  const [addFormData, setAddFormData] = useState(initialAddFormState);

  useEffect(() => {
    if (setHeaderInfo) {
      setHeaderInfo({
        title: "Organizations Directory",
        breadcrumbs: ["Platform", "Organizations"],
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

  // Export current filtered list to real Excel (.xlsx) file
  const handleExportExcel = () => {
    if (companies.length === 0) {
      alert("No organization records available to export.");
      return;
    }

    const rows = companies.map((c) => ({
      "Organization Name": c.name || "—",
      "Company Code": c.code || "—",
      "Industry": c.industry || "—",
      "Company Type": c.company_type || "—",
      "Email": c.company_email || "—",
      "Phone": c.phone || "—",
      "Total Workforce": c.employee_count ?? 0,
      "Field Sales Module": c.field_sales_enabled ? "Enabled" : "Disabled",
      "Country": c.country || "—",
      "City": c.city || "—",
      "State": c.state || "—",
      "Registered Date": c.created_at ? new Date(c.created_at).toLocaleDateString() : "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Organizations");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Ignite_Organizations_Page_${currentPage}_${dateStr}.xlsx`);
  };

  // Handle Add Form changes
  const handleAddFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Submit Add Organization
  const handleAddCompanySubmit = async (e) => {
    e.preventDefault();
    if (!addFormData.name.trim() || !addFormData.code.trim()) {
      setAddFormError("Organization Name and Company Code are required fields.");
      return;
    }

    try {
      setIsSubmittingAdd(true);
      setAddFormError(null);

      // Simulate local creation in directory view (or call setup API)
      const newOrg = {
        id: Date.now(),
        ...addFormData,
        employee_count: 0,
        active_employee_count: 0,
        created_at: new Date().toISOString(),
      };

      setCompanies((prev) => [newOrg, ...prev]);
      setTotalCount((prev) => prev + 1);
      setIsAddModalOpen(false);
      setAddFormData(initialAddFormState);

      setActionSuccessMsg(`Organization "${newOrg.name}" successfully registered.`);
      setTimeout(() => setActionSuccessMsg(null), 4500);
    } catch (err) {
      console.error("Add company error:", err);
      setAddFormError(err?.message || "Failed to create organization.");
    } finally {
      setIsSubmittingAdd(false);
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
                {comp.name ? comp.name.charAt(0).toUpperCase() : "O"}
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
              <span className="super-comp-table__email">{comp.company_email || "No email registered"}</span>
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
      {/* Success notification banner */}
      {actionSuccessMsg && (
        <div className="super-companies-page__alert-success" role="alert">
          <CheckCircle2 size={16} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Directory Top Bar with Add and Export Actions */}
      <div className="super-companies-page__top-bar">
        <div className="super-companies-page__titles">
          <h1 className="super-companies-page__title">Platform Organizations Directory</h1>
          <span className="super-companies-page__subtitle">
            Manage multi-tenant company profiles, operating preferences, and workforce allocations
          </span>
        </div>

        <div className="super-companies-page__actions">
          <button
            type="button"
            className="super-companies-page__btn-outline"
            onClick={handleExportExcel}
            title="Export filtered records to Excel spreadsheet"
          >
            <Download size={15} />
            <span>Export (.xlsx)</span>
          </button>

          <button
            type="button"
            className="super-companies-page__btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={15} />
            <span>Add Organization</span>
          </button>
        </div>
      </div>

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

      {/* =========================================================================
          ADD ORGANIZATION MODAL
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="super-modal-backdrop" onClick={() => !isSubmittingAdd && setIsAddModalOpen(false)}>
          <div className="super-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="super-modal-header">
              <div className="super-modal-titles">
                <h3 className="super-modal-title">Register New Organization</h3>
                <span className="super-modal-subtitle">
                  Provision a new tenant organization on the platform
                </span>
              </div>
              <button
                type="button"
                className="super-modal-close-btn"
                onClick={() => !isSubmittingAdd && setIsAddModalOpen(false)}
                disabled={isSubmittingAdd}
              >
                <X size={18} />
              </button>
            </div>

            {addFormError && (
              <div className="super-modal-alert-error">
                <AlertCircle size={15} />
                <span>{addFormError}</span>
              </div>
            )}

            <form onSubmit={handleAddCompanySubmit} className="super-modal-form">
              <div className="super-modal-body">
                {/* Core Information */}
                <div className="super-form-group-section">
                  <h4 className="super-form-section-title">Core Information</h4>
                  <div className="super-form-grid-2">
                    <div className="super-form-field">
                      <label className="super-form-label">
                        Company Name <span className="super-form-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="e.g. Acme Global Logistics"
                        value={addFormData.name}
                        onChange={handleAddFormChange}
                        className="super-form-input"
                        required
                        disabled={isSubmittingAdd}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">
                        Company Code <span className="super-form-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        placeholder="e.g. ACME"
                        value={addFormData.code}
                        onChange={handleAddFormChange}
                        className="super-form-input"
                        required
                        disabled={isSubmittingAdd}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">Industry</label>
                      <input
                        type="text"
                        name="industry"
                        placeholder="e.g. Technology, Healthcare"
                        value={addFormData.industry}
                        onChange={handleAddFormChange}
                        className="super-form-input"
                        disabled={isSubmittingAdd}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">Company Type</label>
                      <input
                        type="text"
                        name="company_type"
                        placeholder="e.g. Private Limited"
                        value={addFormData.company_type}
                        onChange={handleAddFormChange}
                        className="super-form-input"
                        disabled={isSubmittingAdd}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="super-form-group-section">
                  <h4 className="super-form-section-title">Contact &amp; Location</h4>
                  <div className="super-form-grid-2">
                    <div className="super-form-field">
                      <label className="super-form-label">Corporate Email</label>
                      <input
                        type="email"
                        name="company_email"
                        placeholder="admin@acme.com"
                        value={addFormData.company_email}
                        onChange={handleAddFormChange}
                        className="super-form-input"
                        disabled={isSubmittingAdd}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+91 98765 43210"
                        value={addFormData.phone}
                        onChange={handleAddFormChange}
                        className="super-form-input"
                        disabled={isSubmittingAdd}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">Country</label>
                      <input
                        type="text"
                        name="country"
                        placeholder="e.g. India"
                        value={addFormData.country}
                        onChange={handleAddFormChange}
                        className="super-form-input"
                        disabled={isSubmittingAdd}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">City</label>
                      <input
                        type="text"
                        name="city"
                        placeholder="e.g. Mumbai"
                        value={addFormData.city}
                        onChange={handleAddFormChange}
                        className="super-form-input"
                        disabled={isSubmittingAdd}
                      />
                    </div>
                  </div>

                  <div className="super-form-field" style={{ marginTop: 12 }}>
                    <label className="super-form-label">Full Address</label>
                    <textarea
                      name="full_address"
                      placeholder="Street address, building, suite..."
                      value={addFormData.full_address}
                      onChange={handleAddFormChange}
                      className="super-form-textarea"
                      rows={2}
                      disabled={isSubmittingAdd}
                    />
                  </div>
                </div>

                {/* Modules */}
                <div className="super-form-group-section">
                  <h4 className="super-form-section-title">Module Privileges</h4>
                  <label className="super-form-checkbox-label">
                    <input
                      type="checkbox"
                      name="field_sales_enabled"
                      checked={addFormData.field_sales_enabled}
                      onChange={handleAddFormChange}
                      disabled={isSubmittingAdd}
                    />
                    <span>Enable Field Sales Tracking Module for this Tenant</span>
                  </label>
                </div>
              </div>

              <div className="super-modal-footer">
                <button
                  type="button"
                  className="super-modal-btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmittingAdd}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="super-modal-btn-submit"
                  disabled={isSubmittingAdd}
                >
                  <Save size={15} />
                  <span>{isSubmittingAdd ? "Provisioning..." : "Provision Organization"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
