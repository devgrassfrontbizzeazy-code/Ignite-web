import { useEffect } from "react";
import { X } from "lucide-react";

import "./Drawer.css";

const Drawer = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "480px",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showClose = true,
  className = "",
}) => {
  useEffect(() => {
    if (!open || !closeOnEscape) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, closeOnEscape, onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (
      closeOnBackdrop &&
      event.target === event.currentTarget
    ) {
      onClose?.();
    }
  };

  return (
    <div
      className="drawer__backdrop"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <aside
        className={`drawer ${className}`}
        style={{ "--drawer-width": width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* HEADER */}

        <header className="drawer__header">
          <div className="drawer__heading">
            {title && (
              <h2
                id="drawer-title"
                className="drawer__title"
              >
                {title}
              </h2>
            )}

            {description && (
              <p className="drawer__description">
                {description}
              </p>
            )}
          </div>

          {showClose && (
            <button
              type="button"
              className="drawer__close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={19} />
            </button>
          )}
        </header>

        {/* CONTENT */}

        <div className="drawer__content">
          {children}
        </div>

        {/* FOOTER */}

        {footer && (
          <footer className="drawer__footer">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
};

export default Drawer;