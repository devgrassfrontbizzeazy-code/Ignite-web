import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import notificationAPI from "../services/api/notificationAPI";
import { useNotification } from "./NotificationContext";

const UserNotificationContext = createContext(null);

const isUserLoggedIn = () => {
  try {
    return Boolean(localStorage.getItem("token") || localStorage.getItem("accessToken"));
  } catch {
    return false;
  }
};

export const UserNotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { showNotification } = useNotification();

  // Keep a ref to notifications for rollback on failure
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  const unreadCountRef = useRef(unreadCount);
  unreadCountRef.current = unreadCount;

  // 1. Fetch unread count from API
  const fetchUnreadCount = useCallback(async () => {
    if (!isUserLoggedIn()) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await notificationAPI.getUnreadCount();
      const count =
        typeof response === "number"
          ? response
          : typeof response?.unread_count === "number"
          ? response.unread_count
          : 0;
      setUnreadCount(count);
    } catch (err) {
      // Quiet fail on network/unauth without crashing UI
      if (err?.response?.status === 401) {
        setUnreadCount(0);
      }
    }
  }, []);

  // 2. Fetch full notifications list from API
  const fetchNotifications = useCallback(async () => {
    if (!isUserLoggedIn()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await notificationAPI.getNotifications();
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setNotifications(list);

      // Keep unread count synchronized with fetched notification payload
      const unreadFromList = list.filter((n) => !n.is_read).length;
      setUnreadCount(unreadFromList);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount & tab focus listener
  useEffect(() => {
    fetchUnreadCount();

    const handleFocus = () => {
      fetchUnreadCount();
    };

    const handleCustomUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("ignite:notification-update", handleCustomUpdate);

    // Light periodic sync every 60s
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("ignite:notification-update", handleCustomUpdate);
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  // 3. Mark single notification as read (OPTIMISTIC)
  const markAsRead = useCallback(
    async (id) => {
      const prevNotifications = [...notificationsRef.current];
      const prevCount = unreadCountRef.current;

      const target = prevNotifications.find((n) => n.id === id);
      // If already read, do nothing to prevent duplicate decrements
      if (!target || target.is_read) {
        return;
      }

      // 1. Optimistically update local state immediately
      setNotifications((curr) =>
        curr.map((n) =>
          n.id === id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((curr) => Math.max(0, curr - 1));

      // 2. Send API request
      try {
        await notificationAPI.markAsRead(id);
      } catch (err) {
        console.error("Failed to mark notification as read on server:", err);
        // 3. Rollback state on error
        setNotifications(prevNotifications);
        setUnreadCount(prevCount);
        if (showNotification) {
          showNotification({
            type: "error",
            message: "Failed to mark notification as read. Please try again.",
          });
        }
      }
    },
    [showNotification]
  );

  // 4. Mark all notifications as read (OPTIMISTIC)
  const markAllAsRead = useCallback(async () => {
    const prevNotifications = [...notificationsRef.current];
    const prevCount = unreadCountRef.current;

    const hasUnread =
      prevCount > 0 || prevNotifications.some((n) => !n.is_read);
    if (!hasUnread) {
      return;
    }

    // 1. Optimistically mark all read immediately
    setNotifications((curr) =>
      curr.map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at || new Date().toISOString(),
      }))
    );
    setUnreadCount(0);

    // 2. Send API request
    try {
      await notificationAPI.markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read on server:", err);
      // 3. Rollback on failure
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
      if (showNotification) {
        showNotification({
          type: "error",
          message: "Failed to mark all notifications as read.",
        });
      }
    }
  }, [showNotification]);

  // 5. Delete notification (OPTIMISTIC)
  const deleteNotification = useCallback(
    async (id) => {
      const prevNotifications = [...notificationsRef.current];
      const prevCount = unreadCountRef.current;
      const target = prevNotifications.find((n) => n.id === id);

      // 1. Optimistically remove
      setNotifications((curr) => curr.filter((n) => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount((curr) => Math.max(0, curr - 1));
      }

      // 2. Send API request
      try {
        await notificationAPI.deleteNotification(id);
      } catch (err) {
        console.error("Failed to delete notification on server:", err);
        // 3. Rollback on failure
        setNotifications(prevNotifications);
        setUnreadCount(prevCount);
        if (showNotification) {
          showNotification({
            type: "error",
            message: "Failed to delete notification.",
          });
        }
      }
    },
    [showNotification]
  );

  const value = {
    unreadCount,
    notifications,
    loading,
    error,
    isOpen,
    setIsOpen,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <UserNotificationContext.Provider value={value}>
      {children}
    </UserNotificationContext.Provider>
  );
};

export const useUserNotifications = () => {
  const context = useContext(UserNotificationContext);
  if (!context) {
    throw new Error(
      "useUserNotifications must be used within a UserNotificationProvider"
    );
  }
  return context;
};

export default UserNotificationContext;

