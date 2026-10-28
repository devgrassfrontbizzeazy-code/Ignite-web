/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Download,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import superAdminAPI from "../services/superAdminAPI";
import useDebounce from "../hooks/useDebounce";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import StatusBadge from "../components/StatusBadge";
import ErrorState from "../components/ErrorState";
import StatCard from "../components/StatCard";
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

  // Dynamic companies list for company filter dropdown
  const [companiesList, setCompaniesList] = useState([]);

  // Employee Detail Modal state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (setHeaderInfo) {
      setHeaderInfo({
        title: "Employees",
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

  // Summary counts for compact cards
  const summaryMetrics = useMemo(() => {
    const activeOnPage = employees.filter((e) => e.is_active && e.employment_status === "Active").length;
    const inactiveOnPage = employees.filter((e) => !e.is_active || e.employment_status !== "Active").length;
    return {
      activeOnPage,
      inactiveOnPage,
    };
  }, [employees]);

  // Real Excel Export (.xlsx)
  const handleExportExcel = () => {
    if (employees.length === 0) {
      alert("No employee records available to export.");
      return;
    }

    const rows = employees.map((emp) => ({
      "Employee ID": emp.id,
      "Employee Code": emp.employee_code || "—",
      "Full Name": emp.full_name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "—",
      "Organization": emp.company?.name || "Unassigned",
      "Department": emp.department?.name || "—",
      "Designation": emp.designation?.name || "—",
      "Email Address": emp.email || "—",
      "Phone": emp.phone || "—",
      "Employment Type": emp.employment_type || "—",
      "Employment Status": emp.employment_status || "—",
      "Active Status": emp.is_active ? "Active" : "Inactive",
      "Joining Date": emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString() : "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Ignite_Employees_Directory_Page_${currentPage}_${dateStr}.xlsx`);
  };

  const handleOpenDetailModal = (emp, e) => {
    if (e) e.stopPropagation();
    setSelectedEmployee(emp);
    setIsDetailModalOpen(true);
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
                onClick={(e) => e.stopPropagation()}
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
        render: (emp) => (
          <span className="super-emp-table__dept-text" title={emp.department?.name}>
            {emp.department?.name || "—"}
          </span>
        ),
      },
      {
        key: "designation",
        label: "Designation",
        render: (emp) => (
          <span className="super-emp-table__desig-text" title={emp.designation?.name}>
            {emp.designation?.name || "—"}
          </span>
        ),
      },
      {
        key: "contact",
        label: "Contact",
        render: (emp) => (
          <div className="super-emp-table__contact">
            {emp.email && (
              <span className="super-emp-table__contact-item" title={emp.email}>
                <Mail size={12} />
                <span>{emp.email}</span>
              </span>
            )}
            {emp.phone && (
              <span className="super-emp-table__contact-item">
                <Phone size={12} />
                <span>{emp.phone}</span>
              </span>
            )}
            {!emp.email && !emp.phone && "—"}
          </div>
        ),
      },
      {
        key: "employment_type",
        label: "Type",
        render: (emp) => (
          <span className="super-emp-table__type-tag">
            {emp.employment_type || "Standard"}
          </span>
        ),
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
        label: "Active State",
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
      {
        key: "actions",
        label: "Actions",
        render: (emp) => (
          <button
            type="button"
            className="super-emp-table__inspect-btn"
            onClick={(e) => handleOpenDetailModal(emp, e)}
            title="Inspect Employee Details"
          >
            <Eye size={13} />
            <span>Inspect</span>
          </button>
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
      {/* Page Header */}
      <div className="super-employees-page__top-bar">
        <div className="super-employees-page__titles">
          <h1 className="super-employees-page__title">Employees</h1>
          <span className="super-employees-page__subtitle">
            Global workforce records, department allocations, and employment classifications across all tenants
          </span>
        </div>

        <div className="super-employees-page__actions">
          <button
            type="button"
            className="super-employees-page__btn-outline"
            onClick={fetchEmployees}
            title="Refresh workforce directory"
          >
            <RefreshCw size={14} className={loading ? "super-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="super-employees-page__btn-primary"
            onClick={handleExportExcel}
            title="Export filtered records to Excel (.xlsx)"
          >
            <Download size={14} />
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards Grid */}
      <section className="super-employees-page__summary-grid" aria-label="Workforce Statistics">
        <StatCard
          title="Total Workforce"
          value={totalCount}
          subtext="Total employee profiles registered on platform"
          icon={Users}
          variant="teal"
        />
        <StatCard
          title="Active Staff"
          value={activeFilter === "true" ? totalCount : summaryMetrics.activeOnPage}
          subtext={`${activeFilter === "true" ? "Filtered view" : "Active staff on current page"}`}
          icon={UserCheck}
          variant="emerald"
        />
        <StatCard
          title="Inactive / On Leave"
          value={activeFilter === "false" ? totalCount : summaryMetrics.inactiveOnPage}
          subtext="Terminated, on leave, or inactive profiles"
          icon={UserX}
          variant="neutral"
        />
        <StatCard
          title="Organizations With Staff"
          value={companiesList.length}
          subtext="Tenant entities with active rosters"
          icon={Building2}
          variant="gold"
        />
      </section>

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

      {/* Data Table */}
      {(!error || loading) && (
        <DataTable
          columns={columns}
          data={employees}
          loading={loading}
          keyField="id"
          emptyTitle="No employees found"
          emptyDescription={
            hasActiveFilters
              ? "No employee records match the selected filter criteria. Try broadening your search or resetting filters."
              : "No employees are registered across any company on the platform yet."
          }
          emptyActionLabel={hasActiveFilters ? "Reset Filters" : undefined}
          onEmptyAction={hasActiveFilters ? handleClearFilters : undefined}
          onRowClick={(emp) => handleOpenDetailModal(emp)}
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

      {/* Employee Inspection Modal */}
      {isDetailModalOpen && selectedEmployee && (
        <div className="super-modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div className="super-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="super-modal-header">
              <div className="super-modal-titles">
                <h3 className="super-modal-title">Employee Record Profile</h3>
                <span className="super-modal-subtitle">
                  Employee ID #{selectedEmployee.id} • {selectedEmployee.employee_code || "No Code"}
                </span>
              </div>
              <button
                type="button"
                className="super-modal-close-btn"
                onClick={() => setIsDetailModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="super-modal-body">
              {/* Header Hero */}
              <div className="super-emp-detail__hero">
                {selectedEmployee.profile_photo_url ? (
                  <img
                    src={selectedEmployee.profile_photo_url}
                    alt=""
                    className="super-emp-detail__photo"
                  />
                ) : (
                  <div className="super-emp-detail__avatar">
                    {((selectedEmployee.first_name?.[0] || "") + (selectedEmployee.last_name?.[0] || "") || "E").toUpperCase()}
                  </div>
                )}

                <div className="super-emp-detail__hero-info">
                  <div className="super-emp-detail__name-row">
                    <h4 className="super-emp-detail__name">
                      {selectedEmployee.full_name ||
                        `${selectedEmployee.first_name || ""} ${selectedEmployee.last_name || ""}`.trim() ||
                        "Unnamed Employee"}
                    </h4>
                    {selectedEmployee.employee_code && (
                      <span className="super-emp-detail__code-badge">{selectedEmployee.employee_code}</span>
                    )}
                  </div>
                  <div className="super-emp-detail__badge-row">
                    <StatusBadge type="employment" value={selectedEmployee.employment_status} />
                    <StatusBadge type="active" value={selectedEmployee.is_active} />
                    {selectedEmployee.employment_type && (
                      <span className="super-emp-table__type-tag">{selectedEmployee.employment_type}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="super-emp-detail__grid">
                <div className="super-emp-detail__card">
                  <h5 className="super-emp-detail__section-title">
                    <Building2 size={13} /> Organization &amp; Placement
                  </h5>
                  <div className="super-emp-detail__info-list">
                    <div className="super-emp-detail__info-item">
                      <span className="super-emp-detail__label">Company:</span>
                      <span className="super-emp-detail__val">
                        {selectedEmployee.company ? (
                          <Link
                            to={`/admin/companies/${selectedEmployee.company.id}`}
                            className="super-emp-table__company-link"
                          >
                            {selectedEmployee.company.name} ({selectedEmployee.company.code})
                          </Link>
                        ) : (
                          "Unassigned"
                        )}
                      </span>
                    </div>

                    <div className="super-emp-detail__info-item">
                      <span className="super-emp-detail__label">Department:</span>
                      <span className="super-emp-detail__val">
                        {selectedEmployee.department?.name || "—"}
                      </span>
                    </div>

                    <div className="super-emp-detail__info-item">
                      <span className="super-emp-detail__label">Designation:</span>
                      <span className="super-emp-detail__val">
                        {selectedEmployee.designation?.name || "—"}
                      </span>
                    </div>

                    <div className="super-emp-detail__info-item">
                      <span className="super-emp-detail__label">Work Location:</span>
                      <span className="super-emp-detail__val">
                        {selectedEmployee.work_location || "Headquarters / On-site"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="super-emp-detail__card">
                  <h5 className="super-emp-detail__section-title">
                    <Mail size={13} /> Contact &amp; Identity
                  </h5>
                  <div className="super-emp-detail__info-list">
                    <div className="super-emp-detail__info-item">
                      <span className="super-emp-detail__label">Email Address:</span>
                      <span className="super-emp-detail__val">
                        {selectedEmployee.email || "—"}
                      </span>
                    </div>

                    <div className="super-emp-detail__info-item">
                      <span className="super-emp-detail__label">Phone Number:</span>
                      <span className="super-emp-detail__val">
                        {selectedEmployee.phone || "—"}
                      </span>
                    </div>

                    <div className="super-emp-detail__info-item">
                      <span className="super-emp-detail__label">Joining Date:</span>
                      <span className="super-emp-detail__val">
                        {selectedEmployee.date_of_joining
                          ? new Date(selectedEmployee.date_of_joining).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>

                    <div className="super-emp-detail__info-item">
                      <span className="super-emp-detail__label">User Account ID:</span>
                      <span className="super-emp-detail__val">
                        {selectedEmployee.user_id ? `#${selectedEmployee.user_id}` : "No linked user account"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="super-modal-footer">
              <button
                type="button"
                className="super-modal-btn-cancel"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
