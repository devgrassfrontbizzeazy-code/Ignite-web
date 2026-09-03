import { useEffect } from "react";

import "./Modal.css";

const Modal = ({
  open = false,
  onClose,
  title,
  description,
  children,
  footer,
  size = "medium",
  showClose = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = "",
}) => {
  useEffect(() => {
    if (!open || !closeOnEscape) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, closeOnEscape, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const modalClassName = [
    "modal",
    `modal--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

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
      className="modal-backdrop"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        className={modalClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={
          description ? "modal-description" : undefined
        }
      >
        {(title || description || showClose) && (
          <div className="modal__header">
            <div className="modal__heading">
              {title && (
                <h2 id="modal-title" className="modal__title">
                  {title}
                </h2>
              )}

              {description && (
                <p
                  id="modal-description"
                  className="modal__description"
                >
                  {description}
                </p>
              )}
            </div>

            {showClose && (
              <button
                type="button"
                className="modal__close"
                onClick={onClose}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}

        <div className="modal__body">
          {children}
        </div>

        {footer && (
          <div className="modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;