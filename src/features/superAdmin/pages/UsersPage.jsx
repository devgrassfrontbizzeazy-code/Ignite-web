/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Shield,
  Building2,
  Calendar,
  Clock,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Download,
  Eye,
  X,
  RefreshCw,
  Mail,
  Briefcase,
} from "lucide-react";
import * as XLSX from "xlsx";
import superAdminAPI from "../services/superAdminAPI";
import useDebounce from "../hooks/useDebounce";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import StatusBadge from "../components/StatusBadge";
import ErrorState from "../components/ErrorState";
import StatCard from "../components/StatCard";
import "./UsersPage.css";

export default function UsersPage() {
  const { setHeaderInfo } = useOutletContext() || {};

  // Search & Filter state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [activeFilter, setActiveFilter] = useState("");
  const [superuserFilter, setSuperuserFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Data state
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal inspection state
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (setHeaderInfo) {
      setHeaderInfo({
        title: "User Accounts",
        breadcrumbs: ["Platform", "User Accounts"],
      });
    }
  }, [setHeaderInfo]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeFilter, superuserFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: debouncedSearch,
        is_active: activeFilter,
        is_superuser: superuserFilter,
        page: currentPage,
        page_size: pageSize,
      };

      const res = await superAdminAPI.getUsers(params);

      const list = Array.isArray(res.data) ? res.data : [];
      setUsers(list);
      setTotalCount(res.count ?? list.length);
      setTotalPages(res.total_pages ?? (Math.ceil((res.count ?? list.length) / pageSize) || 1));
    } catch (err) {
      console.error("Failed to fetch platform users:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          "Unable to load platform users directory."
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeFilter, superuserFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleClearFilters = () => {
    setSearchInput("");
    setActiveFilter("");
    setSuperuserFilter("");
  };

  const hasActiveFilters = Boolean(searchInput || activeFilter || superuserFilter);

  // Derived Summary Counts for the compact cards
  const summaryMetrics = useMemo(() => {
    const activeOnPage = users.filter((u) => u.is_active).length;
    const inactiveOnPage = users.filter((u) => !u.is_active).length;
    const superusersOnPage = users.filter((u) => u.is_superuser).length;
    return {
      activeOnPage,
      inactiveOnPage,
      superusersOnPage,
    };
  }, [users]);

  // Real Excel Export (.xlsx)
  const handleExportExcel = () => {
    if (users.length === 0) {
      alert("No user records available to export.");
      return;
    }

    const rows = users.map((u) => ({
      "Account ID": u.id,
      "Username": u.username || "—",
      "Full Name": `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—",
      "Email Address": u.email || "—",
      "Account Status": u.is_active ? "Active" : "Inactive",
      "Platform Superuser": u.is_superuser ? "Yes" : "No",
      "Staff Privilege": u.is_staff ? "Yes" : "No",
      "Owned Organization": u.owned_company?.name || "None",
      "Linked Employee Code": u.linked_employee?.employee_code || "None",
      "Registration Date": u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "—",
      "Last Login": u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UserAccounts");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Ignite_User_Accounts_Page_${currentPage}_${dateStr}.xlsx`);
  };

  const handleOpenDetailModal = (u, e) => {
    if (e) e.stopPropagation();
    setSelectedUser(u);
    setIsDetailModalOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "User",
        render: (u) => {
          const fullName =
            u.first_name || u.last_name
              ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
              : u.username || "Account";

          const initials =
            (u.first_name?.[0] || "") + (u.last_name?.[0] || "") ||
            u.username?.slice(0, 2) ||
            "U";

          return (
            <div className="super-users-table__cell">
              <div
                className={`super-users-table__avatar ${
                  u.is_superuser ? "super-users-table__avatar--superuser" : ""
                }`}
              >
                {u.is_superuser ? (
                  <Shield size={16} />
                ) : (
                  initials.toUpperCase()
                )}
              </div>
              <div className="super-users-table__user-info">
                <span className="super-users-table__full-name">{fullName}</span>
                <span className="super-users-table__username">@{u.username}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "email",
        label: "Email Address",
        render: (u) => (
          <span className="super-users-table__email" title={u.email}>
            {u.email || "—"}
          </span>
        ),
      },
      {
        key: "owned_company",
        label: "Associated Tenant",
        render: (u) =>
          u.owned_company ? (
            <Link
              to={`/admin/companies/${u.owned_company.id}`}
              className="super-users-table__company-link"
              onClick={(e) => e.stopPropagation()}
            >
              <Building2 size={13} />
              <span>{u.owned_company.name}</span>
            </Link>
          ) : u.linked_employee?.company_name ? (
            <Link
              to={`/admin/companies/${u.linked_employee.company_id}`}
              className="super-users-table__company-link"
              onClick={(e) => e.stopPropagation()}
            >
              <Building2 size={13} />
              <span>{u.linked_employee.company_name}</span>
            </Link>
          ) : (
            <span className="super-users-table__muted">Unassigned</span>
          ),
      },
      {
        key: "role",
        label: "Role & Privilege",
        render: (u) => {
          if (u.is_superuser) {
            return (
              <span className="super-users-table__role-pill super-users-table__role-pill--super">
                <ShieldCheck size={12} />
                <span>Super Admin</span>
              </span>
            );
          }
          if (u.is_staff) {
            return (
              <span className="super-users-table__role-pill super-users-table__role-pill--staff">
                <span>Staff Member</span>
              </span>
            );
          }
          if (u.owned_company) {
            return (
              <span className="super-users-table__role-pill super-users-table__role-pill--owner">
                <span>Tenant Owner</span>
              </span>
            );
          }
          return (
            <span className="super-users-table__role-pill super-users-table__role-pill--standard">
              <span>Standard User</span>
            </span>
          );
        },
      },
      {
        key: "is_active",
        label: "Status",
        render: (u) => <StatusBadge type="active" value={u.is_active} />,
      },
      {
        key: "date_joined",
        label: "Registered",
        render: (u) =>
          u.date_joined ? (
            <span className="super-users-table__date" title={u.date_joined}>
              <Calendar size={12} />
              {new Date(u.date_joined).toLocaleDateString()}
            </span>
          ) : (
            "—"
          ),
      },
      {
        key: "last_login",
        label: "Last Login",
        render: (u) =>
          u.last_login ? (
            <span className="super-users-table__date" title={u.last_login}>
              <Clock size={12} />
              {new Date(u.last_login).toLocaleDateString()}
            </span>
          ) : (
            <span className="super-users-table__muted">Never</span>
          ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (u) => (
          <button
            type="button"
            className="super-users-table__inspect-btn"
            onClick={(e) => handleOpenDetailModal(u, e)}
            title="Inspect Account Details"
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
      key: "is_active",
      label: "Active Status (All)",
      value: activeFilter,
      options: [
        { label: "Active Accounts Only", value: "true" },
        { label: "Inactive Accounts Only", value: "false" },
      ],
      onChange: setActiveFilter,
    },
    {
      key: "is_superuser",
      label: "Privilege (All)",
      value: superuserFilter,
      options: [
        { label: "Platform Superusers Only", value: "true" },
        { label: "Standard Users Only", value: "false" },
      ],
      onChange: setSuperuserFilter,
    },
  ];

  return (
    <div className="super-users-page">
      {/* Page Header */}
      <div className="super-users-page__top-bar">
        <div className="super-users-page__titles">
          <h1 className="super-users-page__title">User Accounts</h1>
          <span className="super-users-page__subtitle">
            Manage authenticated platform users, role assignments, and tenant owner credentials
          </span>
        </div>

        <div className="super-users-page__actions">
          <button
            type="button"
            className="super-users-page__btn-outline"
            onClick={fetchUsers}
            title="Refresh directory data"
          >
            <RefreshCw size={14} className={loading ? "super-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="super-users-page__btn-primary"
            onClick={handleExportExcel}
            title="Export filtered accounts to Excel (.xlsx)"
          >
            <Download size={14} />
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Compact Summary Cards Grid */}
      <section className="super-users-page__summary-grid" aria-label="User Account Statistics">
        <StatCard
          title="Total Accounts"
          value={totalCount}
          subtext="Total registered platform user accounts"
          icon={Users}
          variant="teal"
        />
        <StatCard
          title="Active Accounts"
          value={activeFilter === "true" ? totalCount : summaryMetrics.activeOnPage}
          subtext={`${activeFilter === "true" ? "Filtered view" : "Accounts active on current page"}`}
          icon={UserCheck}
          variant="emerald"
        />
        <StatCard
          title="Inactive Accounts"
          value={activeFilter === "false" ? totalCount : summaryMetrics.inactiveOnPage}
          subtext={`${activeFilter === "false" ? "Filtered view" : "Deactivated / unverified accounts"}`}
          icon={UserX}
          variant="neutral"
        />
        <StatCard
          title="Platform Superusers"
          value={superuserFilter === "true" ? totalCount : summaryMetrics.superusersOnPage}
          subtext="Administrative privilege credentials"
          icon={Shield}
          variant="gold"
        />
      </section>

      {/* Filter and Search Bar */}
      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search accounts by username, email, full name..."
        filters={filterConfigs}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        totalResults={totalCount}
      />

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="User Accounts Query Failed"
          message={error}
          onRetry={fetchUsers}
        />
      )}

      {/* Data Table */}
      {(!error || loading) && (
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          keyField="id"
          emptyTitle="No user accounts found"
          emptyDescription={
            hasActiveFilters
              ? "No platform user accounts match the selected search or privilege criteria. Try clearing your filters."
              : "No user accounts registered on the platform."
          }
          emptyActionLabel={hasActiveFilters ? "Reset Filters" : undefined}
          onEmptyAction={hasActiveFilters ? handleClearFilters : undefined}
          onRowClick={(u) => handleOpenDetailModal(u)}
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

      {/* Account Inspection Modal */}
      {isDetailModalOpen && selectedUser && (
        <div className="super-modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div className="super-modal-card super-modal-card--compact" onClick={(e) => e.stopPropagation()}>
            <div className="super-modal-header">
              <div className="super-modal-titles">
                <h3 className="super-modal-title">User Account Profile</h3>
                <span className="super-modal-subtitle">
                  Account ID #{selectedUser.id} • Registered Platform Identity
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
              {/* Profile Card Header */}
              <div className="super-user-detail__hero">
                <div
                  className={`super-user-detail__avatar ${
                    selectedUser.is_superuser ? "super-user-detail__avatar--superuser" : ""
                  }`}
                >
                  {selectedUser.is_superuser ? (
                    <Shield size={24} />
                  ) : (
                    (selectedUser.first_name?.[0] || selectedUser.username?.[0] || "U").toUpperCase()
                  )}
                </div>
                <div className="super-user-detail__hero-info">
                  <h4 className="super-user-detail__name">
                    {selectedUser.first_name || selectedUser.last_name
                      ? `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim()
                      : selectedUser.username}
                  </h4>
                  <span className="super-user-detail__username">@{selectedUser.username}</span>
                  <div className="super-user-detail__badge-row">
                    <StatusBadge type="active" value={selectedUser.is_active} />
                    {selectedUser.is_superuser && (
                      <span className="super-users-table__role-pill super-users-table__role-pill--super">
                        <ShieldCheck size={12} /> Super Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Details List */}
              <div className="super-user-detail__info-list">
                <div className="super-user-detail__info-item">
                  <span className="super-user-detail__info-label">
                    <Mail size={13} /> Email Address:
                  </span>
                  <span className="super-user-detail__info-val">
                    {selectedUser.email || "—"}
                  </span>
                </div>

                <div className="super-user-detail__info-item">
                  <span className="super-user-detail__info-label">
                    <Building2 size={13} /> Owned Tenant:
                  </span>
                  <span className="super-user-detail__info-val">
                    {selectedUser.owned_company ? (
                      <Link
                        to={`/admin/companies/${selectedUser.owned_company.id}`}
                        className="super-users-table__company-link"
                      >
                        {selectedUser.owned_company.name} ({selectedUser.owned_company.code})
                      </Link>
                    ) : (
                      "None"
                    )}
                  </span>
                </div>

                <div className="super-user-detail__info-item">
                  <span className="super-user-detail__info-label">
                    <Briefcase size={13} /> Linked Employee:
                  </span>
                  <span className="super-user-detail__info-val">
                    {selectedUser.linked_employee ? (
                      <span>
                        <code>{selectedUser.linked_employee.employee_code}</code>
                        {selectedUser.linked_employee.company_name && ` (${selectedUser.linked_employee.company_name})`}
                      </span>
                    ) : (
                      "No linked employee profile"
                    )}
                  </span>
                </div>

                <div className="super-user-detail__info-item">
                  <span className="super-user-detail__info-label">
                    <Calendar size={13} /> Registered Date:
                  </span>
                  <span className="super-user-detail__info-val">
                    {selectedUser.date_joined
                      ? new Date(selectedUser.date_joined).toLocaleString()
                      : "—"}
                  </span>
                </div>

                <div className="super-user-detail__info-item">
                  <span className="super-user-detail__info-label">
                    <Clock size={13} /> Last Login:
                  </span>
                  <span className="super-user-detail__info-val">
                    {selectedUser.last_login
                      ? new Date(selectedUser.last_login).toLocaleString()
                      : "Never logged in"}
                  </span>
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
