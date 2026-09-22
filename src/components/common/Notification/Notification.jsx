import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";
import "./Notification.css";

const Notification = ({ type = "success", message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case "error":
        return <FiAlertCircle className="ignite-toast__icon" />;
      case "warning":
        return <FiAlertTriangle className="ignite-toast__icon" />;
      case "info":
        return <FiInfo className="ignite-toast__icon" />;
      case "success":
      default:
        return <FiCheckCircle className="ignite-toast__icon" />;
    }
  };

  return (
    <div className={`ignite-toast ignite-toast--${type}`} role="alert">
      {getIcon()}
      <span className="ignite-toast__message">{message}</span>
      {onClose && (
        <button
          type="button"
          className="ignite-toast__close"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <FiX />
        </button>
      )}
    </div>
  );
};

export default Notification;
