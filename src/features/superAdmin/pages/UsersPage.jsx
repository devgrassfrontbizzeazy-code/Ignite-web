import { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Shield, Building2, Calendar, Clock } from "lucide-react";
import superAdminAPI from "../services/superAdminAPI";
import useDebounce from "../hooks/useDebounce";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import StatusBadge from "../components/StatusBadge";
import ErrorState from "../components/ErrorState";
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

  useEffect(() => {
    if (setHeaderInfo) {
      setHeaderInfo({
        title: "Platform User Accounts",
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
        render: (u) => u.email || "—",
      },
      {
        key: "owned_company",
        label: "Owned Tenant",
        render: (u) =>
          u.owned_company ? (
            <Link
              to={`/admin/companies/${u.owned_company.id}`}
              className="super-users-table__company-link"
            >
              <Building2 size={13} />
              <span>{u.owned_company.name}</span>
            </Link>
          ) : (
            <span className="super-users-table__muted">—</span>
          ),
      },
      {
        key: "linked_employee",
        label: "Linked Profile",
        render: (u) =>
          u.linked_employee ? (
            <div className="super-users-table__linked-emp">
              <span className="super-users-table__emp-code">
                {u.linked_employee.employee_code}
              </span>
              {u.linked_employee.company_name && (
                <span className="super-users-table__emp-comp">
                  {u.linked_employee.company_name}
                </span>
              )}
            </div>
          ) : (
            <span className="super-users-table__muted">—</span>
          ),
      },
      {
        key: "is_active",
        label: "Status",
        render: (u) => <StatusBadge type="active" value={u.is_active} />,
      },
      {
        key: "is_staff",
        label: "Staff Flag",
        render: (u) =>
          u.is_staff ? (
            <span className="super-users-table__staff-badge">Staff Member</span>
          ) : (
            <span className="super-users-table__muted">Standard</span>
          ),
      },
      {
        key: "is_superuser",
        label: "Platform Privilege",
        render: (u) => <StatusBadge type="superuser" value={u.is_superuser} />,
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
      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search accounts by username, email, name..."
        filters={filterConfigs}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        totalResults={totalCount}
      />

      {error && !loading && (
        <ErrorState
          title="User Accounts Query Failed"
          message={error}
          onRetry={fetchUsers}
        />
      )}

      {(!error || loading) && (
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          keyField="id"
          emptyTitle="No accounts found"
          emptyDescription={
            hasActiveFilters
              ? "No platform user accounts match the selected search or privilege criteria."
              : "No user accounts registered on the platform."
          }
          emptyActionLabel={hasActiveFilters ? "Reset Filters" : undefined}
          onEmptyAction={hasActiveFilters ? handleClearFilters : undefined}
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
