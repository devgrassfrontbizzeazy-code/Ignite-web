import { useEffect } from "react";
import NotificationItem from "../NotificationItem/NotificationItem";
import { useUserNotifications } from "../../../context/UserNotificationContext";
import "./NotificationDropdown.css";

export default function NotificationDropdown() {
    const {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useUserNotifications();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return (
        <div className="notification-dropdown">
            <div className="notification-dropdown__header">
                <div>
                    <h2>Notifications</h2>

                    {unreadCount > 0 && (
                        <span>
                            {unreadCount} unread
                        </span>
                    )}
                </div>

                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={markAllAsRead}
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="notification-dropdown__list">
                {loading && notifications.length === 0 ? (
                    <div className="notification-dropdown__empty">
                        <p>Loading notifications...</p>
                    </div>
                ) : error && notifications.length === 0 ? (
                    <div className="notification-dropdown__empty">
                        <p>{error}</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notification-dropdown__empty">
                        <p>No notifications</p>
                        <span>You're all caught up.</span>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkRead={markAsRead}
                            onDelete={deleteNotification}
                        />
                    ))
                )}
            </div>

            <div className="notification-dropdown__footer">
                <button type="button">
                    View all notifications
                </button>
            </div>
        </div>
    );
}
