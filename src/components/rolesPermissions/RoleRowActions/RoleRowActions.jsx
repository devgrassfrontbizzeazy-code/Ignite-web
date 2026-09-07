import { useEffect, useRef, useState } from "react";

import "./RoleRowActions.css";

const RoleRowActions = ({
    role,
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

    const updateMenuPosition = () => {
        if (!triggerRef.current) {
            return;
        }

        const triggerRect =
            triggerRef.current.getBoundingClientRect();

        const menuWidth = 140;
        const menuHeight = 165;
        const gap = 6;
        const viewportPadding = 8;

        let left = triggerRect.right - menuWidth;

        if (left < viewportPadding) {
            left = viewportPadding;
        }

        if (
            left + menuWidth >
            window.innerWidth - viewportPadding
        ) {
            left =
                window.innerWidth -
                menuWidth -
                viewportPadding;
        }

        const spaceBelow =
            window.innerHeight - triggerRect.bottom;

        const spaceAbove = triggerRect.top;

        let top;
        let placement;

        if (spaceBelow >= menuHeight + gap) {
            top = triggerRect.bottom + gap;
            placement = "bottom";
        } else if (spaceAbove >= menuHeight + gap) {
            top =
                triggerRect.top -
                menuHeight -
                gap;

            placement = "top";
        } else {
            top = Math.max(
                viewportPadding,
                Math.min(
                    triggerRect.bottom + gap,
                    window.innerHeight -
                    menuHeight -
                    viewportPadding,
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
                triggerRef.current?.contains(
                    event.target,
                )
            ) {
                return;
            }

            if (
                menuRef.current?.contains(
                    event.target,
                )
            ) {
                return;
            }

            setOpen(false);
        };

        const handlePositionUpdate = () => {
            updateMenuPosition();
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick,
        );

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
            callback(role);
        }
    };

    const isActive = role.status === "active";

    return (
        <div className="role-row-actions">
            <button
                ref={triggerRef}
                type="button"
                className="role-row-actions__trigger"
                onClick={handleToggle}
                aria-label={`Actions for ${role.roleName || "role"
                    }`}
                aria-expanded={open}
            >
                ⋮
            </button>

            {open && (
                <div
                    ref={menuRef}
                    className={`role-row-actions__menu role-row-actions__menu--${menuPosition.placement}`}
                    style={{
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                    }}
                >
                    <button
                        type="button"
                        onClick={() =>
                            handleAction(onView)
                        }
                    >
                        View
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            handleAction(onEdit)
                        }
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            handleAction(onToggleStatus)
                        }
                    >
                        {isActive
                            ? "Deactivate"
                            : "Activate"}
                    </button>

                    <button
                        type="button"
                        className="role-row-actions__delete"
                        onClick={() =>
                            handleAction(onDelete)
                        }
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoleRowActions;