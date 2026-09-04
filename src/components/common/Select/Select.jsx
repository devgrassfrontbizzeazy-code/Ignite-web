import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import "./Select.css";

export default function Select({
  value = "",
  onChange,
  options = [],
  placeholder,
  label,
  disabled = false,
  className = "",
  name,
  id,
}) {
  const selectId = id || name;

  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [menuPosition, setMenuPosition] = useState(null);

  const selectClassName = ["select", className].filter(Boolean).join(" ");

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  const displayValue = selectedOption?.label || placeholder || "";

  const getFirstAvailableIndex = () => {
    const index = options.findIndex((option) => !option.disabled);
    return index >= 0 ? index : -1;
  };

  const updateMenuPosition = () => {
    if (!triggerRef.current || !open) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth =
      document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight =
      document.documentElement.clientHeight || window.innerHeight;
    const viewportPadding = 8;
    const gap = 4;

    const menuWidth = Math.min(
      Math.max(triggerRect.width, 180),
      viewportWidth - viewportPadding * 2
    );

    const estimatedOptionHeight = 40;
    const estimatedMenuHeight = Math.min(
      Math.max(options.length * estimatedOptionHeight + 8, 44),
      Math.max(viewportHeight - viewportPadding * 2, 44)
    );

    let left = triggerRect.left;

    if (left + menuWidth > viewportWidth - viewportPadding) {
      left = viewportWidth - menuWidth - viewportPadding;
    }

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    let top;

    if (spaceBelow >= estimatedMenuHeight + gap || spaceBelow >= spaceAbove) {
      top = triggerRect.bottom + gap;
    } else {
      top = triggerRect.top - estimatedMenuHeight - gap;
    }

    if (top + estimatedMenuHeight > viewportHeight - viewportPadding) {
      top = viewportHeight - estimatedMenuHeight - viewportPadding;
    }

    if (top < viewportPadding) {
      top = viewportPadding;
    }

    setMenuPosition({
      top: Math.round(top),
      left: Math.round(left),
      width: Math.round(menuWidth),
    });
  };

  const updatePositionAfterRender = () => {
    if (!menuRef.current || !triggerRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth =
      document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight =
      document.documentElement.clientHeight || window.innerHeight;
    const viewportPadding = 8;
    const gap = 4;

    let left = triggerRect.left;

    if (left + menuRect.width > viewportWidth - viewportPadding) {
      left = viewportWidth - menuRect.width - viewportPadding;
    }

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    let top;

    if (spaceBelow >= menuRect.height + gap || spaceBelow >= spaceAbove) {
      top = triggerRect.bottom + gap;
    } else {
      top = triggerRect.top - menuRect.height - gap;
    }

    if (top + menuRect.height > viewportHeight - viewportPadding) {
      top = viewportHeight - menuRect.height - viewportPadding;
    }

    if (top < viewportPadding) {
      top = viewportPadding;
    }

    setMenuPosition({
      top: Math.round(top),
      left: Math.round(left),
      width: Math.round(Math.max(menuRect.width, triggerRect.width)),
    });
  };

  const openMenu = () => {
    if (disabled || options.length === 0) {
      return;
    }

    const selectedIndex = options.findIndex(
      (option) => String(option.value) === String(value)
    );

    setHighlightedIndex(
      selectedIndex >= 0 ? selectedIndex : getFirstAvailableIndex()
    );

    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
    setMenuPosition(null);
  };

  const handleOptionSelect = (option) => {
    if (option.disabled) {
      return;
    }

    onChange?.(option.value);
    closeMenu();
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event) => {
    if (disabled) {
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "ArrowDown"
    ) {
      event.preventDefault();

      if (!open) {
        openMenu();
        return;
      }

      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        openMenu();
        return;
      }

      moveHighlight(-1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  };

  const moveHighlight = (direction) => {
    if (options.length === 0) {
      return;
    }

    let index = highlightedIndex;

    for (let i = 0; i < options.length; i += 1) {
      index += direction;

      if (index < 0) {
        index = options.length - 1;
      }

      if (index >= options.length) {
        index = 0;
      }

      if (!options[index]?.disabled) {
        setHighlightedIndex(index);
        return;
      }
    }
  };

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();

    requestAnimationFrame(() => {
      updateMenuPosition();
    });
  }, [open, options.length]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    requestAnimationFrame(() => {
      updatePositionAfterRender();
    });
  }, [open, highlightedIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (event) => {
      const target = event.target;

      if (
        wrapperRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      closeMenu();
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    const handleViewportChange = () => {
      if (!triggerRef.current) {
        closeMenu();
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth =
        document.documentElement.clientWidth || window.innerWidth;
      const viewportHeight =
        document.documentElement.clientHeight || window.innerHeight;

      const isCompletelyOffScreen =
        rect.bottom < 0 ||
        rect.top > viewportHeight ||
        rect.right < 0 ||
        rect.left > viewportWidth;

      if (isCompletelyOffScreen) {
        closeMenu();
        return;
      }

      updateMenuPosition();

      requestAnimationFrame(() => {
        updatePositionAfterRender();
      });
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  const menu =
    open && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            id={`${selectId}-menu`}
            className="select__menu"
            role="listbox"
            aria-labelledby={selectId}
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
            }}
          >
            {placeholder && (
              <button
                type="button"
                className={[
                  "select__option",
                  value === "" ? "select__option--selected" : "",
                  highlightedIndex === -1 ? "select__option--highlighted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                role="option"
                aria-selected={value === ""}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  onChange?.("");
                  closeMenu();
                  triggerRef.current?.focus();
                }}
              >
                {placeholder}
              </button>
            )}

            {options.map((option, index) => {
              const isSelected = String(option.value) === String(value);
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={[
                    "select__option",
                    isSelected ? "select__option--selected" : "",
                    isHighlighted ? "select__option--highlighted" : "",
                    option.disabled ? "select__option--disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => {
                    if (!option.disabled) {
                      setHighlightedIndex(index);
                    }
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div ref={wrapperRef} className="select-wrapper">
        {label && (
          <label htmlFor={selectId} className="select__label">
            {label}
          </label>
        )}

        <div className={selectClassName}>
          <button
            ref={triggerRef}
            id={selectId}
            name={name}
            type="button"
            className="select__field"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? `${selectId}-menu` : undefined}
            onClick={() => {
              if (open) {
                closeMenu();
              } else {
                openMenu();
              }
            }}
            onKeyDown={handleTriggerKeyDown}
          >
            <span className="select__field-text">{displayValue}</span>
          </button>

          <span className="select__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </div>
      </div>

      {menu}
    </>
  );
}
