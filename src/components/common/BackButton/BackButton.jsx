
import { ChevronLeft } from "lucide-react";
import "./BackButton.css";

const BackButton = ({
    label = "Back",
    onClick,
    type = "button",
    disabled = false,
    className = "",
}) => {
    return (
        <button
            type={type}
            className={`back-button ${className}`.trim()}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
        >
            <ChevronLeft
                size={16}
                strokeWidth={2}
                className="back-button__icon"
            />

            <span>{label}</span>
        </button>
    );
};

export default BackButton;

