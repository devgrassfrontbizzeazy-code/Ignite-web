import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FiMoreVertical,
  FiEye,
  FiEdit2,
  FiPower,
  FiSlash,
  FiLogOut,
  FiTrash2,
} from "react-icons/fi";
import "./EmployeeRowActions.css";

const EmployeeRowActions = ({
  employee,
  onView,
  onEdit,
  onToggleStatus,
  onTerminate,
  onResign,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: "down",
  });

  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const isActive = employee.employment_status === "ACTIVE";

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect =
      triggerRef.current.getBoundingClientRect();

    const menuWidth = 165;
    const menuHeight = isActive ? 225 : 165;
    const gap = 7;

    const spaceBelow =
      window.innerHeight - triggerRect.bottom;

    const spaceAbove = triggerRect.top;

    const shouldOpenUp =
      spaceBelow < menuHeight && spaceAbove > spaceBelow;

    let top;

    if (shouldOpenUp) {
      top = triggerRect.top - menuHeight - gap;
    } else {
      top = triggerRect.bottom + gap;
    }

    /*
     * Keep menu inside viewport horizontally.
     */
    let left = triggerRect.right - menuWidth;

    if (left < 8) {
      left = 8;
    }

    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    setPosition({
      top,
      left,
      placement: shouldOpenUp ? "up" : "down",
    });
  };

  useEffect(() => {
    if (!open) return;

    calculatePosition();

    const handleResize = () => {
      calculatePosition();
    };

    const handleScroll = () => {
      calculatePosition();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, isActive]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      const clickedTrigger =
        triggerRef.current?.contains(event.target);

      const clickedMenu =
        menuRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      calculatePosition();
    }

    setOpen((prev) => !prev);
  };

  const handleAction = (action) => {
    setOpen(false);

    if (typeof action === "function") {
      action(employee);
    }
  };

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          className={`employee-row-actions__menu employee-row-actions__menu--${position.placement}`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <button
            type="button"
            onClick={() => handleAction(onView)}
          >
            <FiEye />
            <span>View</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onEdit)}
          >
            <FiEdit2 />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onToggleStatus)}
          >
            <FiPower />
            <span>
              {isActive ? "Deactivate" : "Activate"}
            </span>
          </button>

          {isActive && (
            <>
              <button
                type="button"
                className="employee-row-actions__danger"
                onClick={() =>
                  handleAction(onTerminate)
                }
              >
                <FiSlash />
                <span>Terminate</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onResign)}
              >
                <FiLogOut />
                <span>Resign</span>
              </button>
            </>
          )}

          <div className="employee-row-actions__divider" />

          <button
            type="button"
            className="employee-row-actions__danger"
            onClick={() => handleAction(onDelete)}
          >
            <FiTrash2 />
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="employee-row-actions">
        <button
          ref={triggerRef}
          type="button"
          className={`employee-row-actions__trigger ${
            open
              ? "employee-row-actions__trigger--active"
              : ""
          }`}
          onClick={handleToggle}
          title="Employee actions"
          aria-label="Employee actions"
          aria-expanded={open}
        >
          <FiMoreVertical />
        </button>
      </div>

      {menu}
    </>
  );
};

export default EmployeeRowActions;