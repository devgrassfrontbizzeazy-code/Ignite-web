import { useEffect, useState } from "react";
import NotificationItem from "../NotificationItem/NotificationItem";
import notificationAPI from "../../../services/api/notificationAPI";
import "./NotificationDropdown.css";


export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await notificationAPI.getNotifications();

                console.log("Notifications API response:", response);

                const notificationsData = Array.isArray(response)
                    ? response
                    : response?.data || [];

                setNotifications(notificationsData);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
                setError("Unable to load notifications.");
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const unreadCount = notifications.filter(
        (notification) => !notification.is_read
    ).length;

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllAsRead();

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    is_read: true,
                }))
            );
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification.id === id
                        ? {
                            ...notification,
                            is_read: true,
                        }
                        : notification
                )
            );
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationAPI.deleteNotification(id);

            setNotifications((current) =>
                current.filter((notification) => notification.id !== id)
            );
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

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
                        onClick={handleMarkAllRead}
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="notification-dropdown__list">
                {loading ? (
                    <div className="notification-dropdown__empty">
                        <p>Loading notifications...</p>
                    </div>
                ) : error ? (
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
                            onMarkRead={handleMarkRead}
                            onDelete={handleDelete}
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