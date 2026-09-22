import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiMoreVertical } from "react-icons/fi";
import "./RowActions.css";

const RowActions = ({
  items = [],
  actions,
  title = "Actions",
  triggerClassName = "",
  menuClassName = "",
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: "down",
  });

  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const actionList = actions || items;
  const activeItems = actionList.filter((item) => item && !item.hidden);

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuWidth = menuEl?.offsetWidth || 165;

    const itemCount = activeItems.filter((i) => !i.isDivider).length;
    const dividerCount = activeItems.filter((i) => i.isDivider).length;
    const estimatedHeight = itemCount * 36 + dividerCount * 9 + 12;

    const menuHeight = menuEl?.offsetHeight || estimatedHeight;
    const gap = 4;
    const padding = 8;

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove >= menuHeight;

    let top = shouldOpenUp
      ? triggerRect.top - menuHeight - gap
      : triggerRect.bottom + gap;

    let left = triggerRect.right - menuWidth;
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    setPosition({
      top: Math.round(top),
      left: Math.round(left),
      placement: shouldOpenUp ? "up" : "down",
    });
  };

  useEffect(() => {
    if (!open) return;

    calculatePosition();
    const animId = requestAnimationFrame(() => {
      calculatePosition();
    });

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, activeItems.length]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      const clickedTrigger = triggerRef.current?.contains(event.target);
      const clickedMenu = menuRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const handleToggle = (e) => {
    e?.stopPropagation();
    if (!open) calculatePosition();
    setOpen((prev) => !prev);
  };

  const handleItemClick = (e, onClick) => {
    e?.stopPropagation();
    setOpen(false);
    if (typeof onClick === "function") {
      onClick();
    }
  };

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          className={`row-actions__menu row-actions__menu--${position.placement} ${menuClassName}`.trim()}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {activeItems.map((item, index) => {
            if (item.isDivider || item.type === "divider") {
              return (
                <div
                  key={item.key || `divider-${index}`}
                  className="row-actions__divider"
                />
              );
            }

            const Icon = item.icon;
            const isDanger =
              item.isDanger || item.variant === "danger" || item.danger;

            return (
              <button
                key={item.key || item.label || index}
                type="button"
                className={isDanger ? "row-actions__danger" : ""}
                onClick={(e) => handleItemClick(e, item.onClick)}
                disabled={item.disabled}
              >
                {Icon && (typeof Icon === "function" || typeof Icon === "object" ? <Icon /> : Icon)}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="row-actions">
        <button
          ref={triggerRef}
          type="button"
          className={`row-actions__trigger ${
            open ? "row-actions__trigger--active" : ""
          } ${triggerClassName}`.trim()}
          onClick={handleToggle}
          title={title}
          aria-label={title}
          aria-expanded={open}
        >
          <FiMoreVertical />
        </button>
      </div>
      {menu}
    </>
  );
};

export default RowActions;
