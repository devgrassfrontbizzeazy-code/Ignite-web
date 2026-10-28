import { AlertCircle, RefreshCw } from "lucide-react";
import "./ErrorState.css";

export default function ErrorState({
  title = "Failed to load data",
  message = "An error occurred while fetching information from the server.",
  onRetry,
}) {
  return (
    <div className="super-error-state">
      <div className="super-error-state__icon-wrap">
        <AlertCircle size={28} />
      </div>
      <h3 className="super-error-state__title">{title}</h3>
      <p className="super-error-state__message">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="super-error-state__retry-btn"
          onClick={onRetry}
        >
          <RefreshCw size={15} />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
}
