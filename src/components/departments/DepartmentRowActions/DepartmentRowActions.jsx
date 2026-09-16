
import { useEffect, useRef, useState } from "react";
import {
  canUpdateDepartments,
  canDeleteDepartments,
} from "../../../utils/permissionUtils";

import "./DepartmentRowActions.css";

const DepartmentRowActions = ({
  department,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    placement: "bottom",
  });

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const canEdit = canUpdateDepartments();
  const canDelete = canDeleteDepartments();

  const updateMenuPosition = () => {
    if (!triggerRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuWidth = menuEl?.offsetWidth || 140;

    let itemCount = 1; // View
    if (canEdit) itemCount += 2; // Edit, Status
    if (canDelete) itemCount += 1; // Delete

    const menuHeight = menuEl?.offsetHeight || (itemCount * 36 + 12);
    const gap = 4;
    const viewportPadding = 8;

    let left = triggerRect.right - menuWidth;

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (left + menuWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - menuWidth - viewportPadding;
    }

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove >= menuHeight;

    let top = shouldOpenUp
      ? triggerRect.top - menuHeight - gap
      : triggerRect.bottom + gap;

    setMenuPosition({
      top: Math.round(top),
      left: Math.round(left),
      placement: shouldOpenUp ? "top" : "bottom",
    });
  };

  const handleToggle = () => {
    if (!open) {
      updateMenuPosition();
    }

    setOpen((previous) => !previous);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();
    const animId = requestAnimationFrame(() => {
      updateMenuPosition();
    });

    const handleOutsideClick = (event) => {
      if (
        triggerRef.current &&
        triggerRef.current.contains(event.target)
      ) {
        return;
      }

      if (
        menuRef.current &&
        menuRef.current.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handlePositionUpdate = () => {
      updateMenuPosition();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handlePositionUpdate, true);
    window.addEventListener("resize", handlePositionUpdate);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handlePositionUpdate, true);
      window.removeEventListener("resize", handlePositionUpdate);
    };
  }, [open, canEdit, canDelete]);

  const handleAction = (callback) => {
    setOpen(false);

    if (typeof callback === "function") {
      callback(department);
    }
  };

  const isActive = department.status === "active";

  return (
    <div className="department-row-actions">
      <button
        ref={triggerRef}
        type="button"
        className="department-row-actions__trigger"
        onClick={handleToggle}
        aria-label={`Actions for ${department.departmentName || "department"}`}
        aria-expanded={open}
      >
        ⋮
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`department-row-actions__menu department-row-actions__menu--${menuPosition.placement}`}
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          <button
            type="button"
            onClick={() => handleAction(onView)}
          >
            View
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => handleAction(onEdit)}
            >
              Edit
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => handleAction(onToggleStatus)}
            >
              {isActive ? "Deactivate" : "Activate"}
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="department-row-actions__delete"
              onClick={() => handleAction(onDelete)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentRowActions;

