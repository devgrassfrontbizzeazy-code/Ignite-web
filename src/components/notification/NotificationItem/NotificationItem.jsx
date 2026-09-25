import "./NotificationItem.css";

const getTimeAgo = (date) => {
    const difference = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(difference / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);

    return `${days}d`;
};

export default function NotificationItem({
    notification,
    onMarkRead,
    onDelete,
}) {
    return (
        <div
            className={`notification-item ${!notification.is_read ? "notification-item--unread" : ""
                }`}
        >
            <div className="notification-item__indicator">
                {!notification.is_read && <span />}
            </div>

            <div className="notification-item__content">
                <div className="notification-item__top">
                    <h3>{notification.title}</h3>

                    <span className="notification-item__time">
                        {getTimeAgo(notification.created_at)}
                    </span>
                </div>

                <p>{notification.message}</p>

                {notification.sender_info?.name && (
                    <span className="notification-item__sender">
                        {notification.sender_info.name}
                    </span>
                )}

                <div className="notification-item__actions">
                    {!notification.is_read && (
                        <button
                            type="button"
                            onClick={() => onMarkRead(notification.id)}
                        >
                            Mark as read
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onDelete(notification.id)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}