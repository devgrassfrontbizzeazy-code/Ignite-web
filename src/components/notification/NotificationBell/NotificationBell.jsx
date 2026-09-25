import { useEffect, useRef, useState } from "react";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import notificationAPI from "../../../services/api/notificationAPI";
import "./NotificationBell.css";

const iconProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

const BellIcon = () => (
    <svg {...iconProps}>
        <path d="M5 8.5a5 5 0 0 1 10 0c0 3.2 1 4.3 1.6 5H3.4c.6-.7 1.6-1.8 1.6-5Z" />
        <path d="M8.3 16.5a1.8 1.8 0 0 0 3.4 0" />
    </svg>
);

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationRef = useRef(null);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await notificationAPI.getUnreadCount();

                console.log("Unread count response:", response);

                const count =
                    typeof response === "number"
                        ? response
                        : response?.unread_count ?? 0;

                setUnreadCount(count);
            } catch (error) {
                console.error("Failed to fetch unread notification count:", error);
            }
        };

        fetchUnreadCount();
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    return (
        <div className="notification-bell" ref={notificationRef}>
            <button
                type="button"
                className="top-navbar__notification"
                aria-label="Notifications"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((previous) => !previous)}
            >
                <BellIcon />

                {unreadCount > 0 && (
                    <span className="top-navbar__notification-dot">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && <NotificationDropdown />}
        </div>
    );
}