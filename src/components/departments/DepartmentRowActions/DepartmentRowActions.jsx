import { useEffect, useRef, useState } from "react";

import "./DepartmentRowActions.css";

const DepartmentRowActions = ({
  department,
  onView,
  onEdit,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    placement: "bottom",
  });

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuPosition = () => {
    if (!triggerRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();

    const menuWidth = 140;
    const menuHeight = 130;
    const gap = 6;
    const viewportPadding = 8;

    let left = triggerRect.right - menuWidth;

    // Keep menu inside horizontal viewport
    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (left + menuWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - menuWidth - viewportPadding;
    }

    const spaceBelow =
      window.innerHeight - triggerRect.bottom;

    const spaceAbove = triggerRect.top;

    let top;
    let placement;

    // Prefer opening below
    if (spaceBelow >= menuHeight + gap) {
      top = triggerRect.bottom + gap;
      placement = "bottom";
    } else if (spaceAbove >= menuHeight + gap) {
      // Open above when there isn't enough room below
      top = triggerRect.top - menuHeight - gap;
      placement = "top";
    } else {
      // Very small viewport: keep it inside the viewport
      top = Math.max(
        viewportPadding,
        Math.min(
          triggerRect.bottom + gap,
          window.innerHeight - menuHeight - viewportPadding,
        ),
      );

      placement = "bottom";
    }

    setMenuPosition({
      top,
      left,
      placement,
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

    window.addEventListener(
      "scroll",
      handlePositionUpdate,
      true,
    );

    window.addEventListener(
      "resize",
      handlePositionUpdate,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      window.removeEventListener(
        "scroll",
        handlePositionUpdate,
        true,
      );

      window.removeEventListener(
        "resize",
        handlePositionUpdate,
      );
    };
  }, [open]);

  const handleAction = (callback) => {
    setOpen(false);

    if (typeof callback === "function") {
      callback(department);
    }
  };

  return (
    <div className="department-row-actions">
      <button
        ref={triggerRef}
        type="button"
        className="department-row-actions__trigger"
        onClick={handleToggle}
        aria-label={`Actions for ${department.name}`}
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

          <button
            type="button"
            onClick={() => handleAction(onEdit)}
          >
            Edit
          </button>

          <button
            type="button"
            className="department-row-actions__delete"
            onClick={() => handleAction(onDelete)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default DepartmentRowActions;

