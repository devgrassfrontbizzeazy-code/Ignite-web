import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyState from "./EmptyState";
import "./DataTable.css";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display.",
  onEmptyAction,
  emptyActionLabel,
  // Pagination
  pagination = null, // { count, totalPages, currentPage, pageSize, onPageChange, onPageSizeChange }
  // Sorting
  sortField,
  sortOrder, // "asc" | "desc"
  onSort,
  // Row click
  onRowClick,
  keyField = "id",
}) {
  if (loading) {
    return <LoadingSkeleton type="table" rows={pagination?.pageSize || 8} cols={columns.length} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="super-data-table-container">
      <div className="super-data-table-wrapper">
        <table className="super-data-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sortField && sortField === col.sortKey;
                const canSort = Boolean(col.sortKey && onSort);

                return (
                  <th
                    key={col.key || col.label}
                    style={{ width: col.width }}
                    className={`super-data-table__th ${canSort ? "super-data-table__th--sortable" : ""}`}
                    onClick={() => canSort && onSort(col.sortKey)}
                  >
                    <div className="super-data-table__th-content">
                      <span>{col.label}</span>
                      {canSort && (
                        <span className="super-data-table__sort-icon">
                          {isSorted ? (
                            sortOrder === "asc" ? (
                              <ArrowUp size={14} />
                            ) : (
                              <ArrowDown size={14} />
                            )
                          ) : (
                            <ArrowUpDown size={13} className="super-data-table__sort-icon--idle" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const rowKey = row[keyField] ?? index;
              return (
                <tr
                  key={rowKey}
                  className={`super-data-table__tr ${onRowClick ? "super-data-table__tr--clickable" : ""}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key || col.label} className="super-data-table__td">
                      {col.render ? col.render(row) : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <div className="super-data-table__pagination">
          <div className="super-data-table__pagination-info">
            Showing{" "}
            <strong>
              {Math.min(
                pagination.count,
                (pagination.currentPage - 1) * pagination.pageSize + 1
              )}
            </strong>{" "}
            to{" "}
            <strong>
              {Math.min(
                pagination.count,
                pagination.currentPage * pagination.pageSize
              )}
            </strong>{" "}
            of <strong>{pagination.count.toLocaleString()}</strong> results
          </div>

          <div className="super-data-table__pagination-controls">
            {pagination.onPageSizeChange && (
              <div className="super-data-table__page-size">
                <label htmlFor="super-table-page-size" className="super-data-table__page-size-label">
                  Rows per page:
                </label>
                <select
                  id="super-table-page-size"
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                  className="super-data-table__page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}

            <div className="super-data-table__nav-buttons">
              <button
                type="button"
                className="super-data-table__page-btn"
                disabled={pagination.currentPage <= 1}
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                title="Previous page"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="super-data-table__page-indicator">
                Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
              </span>

              <button
                type="button"
                className="super-data-table__page-btn"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                title="Next page"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
