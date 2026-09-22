import { createContext, useContext, useState, useCallback } from "react";
import Notification from "../components/common/Notification/Notification";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((options) => {
    let type = "info";
    let message = "";
    let duration = 4500;

    if (typeof options === "string") {
      message = options;
    } else if (typeof options === "object" && options !== null) {
      type = options.type || "info";
      message = options.message || options.text || "";
      if (options.duration) duration = options.duration;
    }

    const id = Date.now() + Math.random().toString(36).substring(2, 9);

    const newNotification = { id, type, message };

    setNotifications((prev) => [...prev, newNotification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [removeNotification]);

  const notify = {
    show: showNotification,
    success: (message, options) => showNotification({ type: "success", message, ...options }),
    error: (message, options) => showNotification({ type: "error", message, ...options }),
    warning: (message, options) => showNotification({ type: "warning", message, ...options }),
    info: (message, options) => showNotification({ type: "info", message, ...options }),
    remove: removeNotification,
  };

  return (
    <NotificationContext.Provider value={{ showNotification, notify, removeNotification }}>
      {children}
      <div className="ignite-notification-container">
        {notifications.map((n) => (
          <Notification
            key={n.id}
            type={n.type}
            message={n.message}
            onClose={() => removeNotification(n.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showNotification: (opts) => {
        const msg = typeof opts === "string" ? opts : opts?.message;
        console.log("Notification (no provider):", msg);
      },
      notify: {
        success: (msg) => console.log("Success:", msg),
        error: (msg) => console.error("Error:", msg),
        warning: (msg) => console.warn("Warning:", msg),
        info: (msg) => console.log("Info:", msg),
      },
    };
  }
  return context;
};
