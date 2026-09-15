import logo from "../../../assets/logo.png";
import "./IgniteLoader.css";

/**
 * IgniteLoader
 *
 * A premium Ignite-branded page-level loading state.
 * Replaces generic spinners for important data-fetching operations.
 *
 * Props:
 *   text {string} — Optional loading text. Defaults to "Loading details..."
 *   className {string} — Optional extra class on the wrapper.
 */
const IgniteLoader = ({
    text = "Loading details...",
    className = "",
}) => {
    return (
        <div
            className={`ignite-loader ${className}`.trim()}
            role="status"
            aria-live="polite"
            aria-label={text}
        >
            <div className="ignite-loader__content">
                {/* Logo — gentle breathing animation */}
                <img
                    src={logo}
                    alt="Ignite"
                    className="ignite-loader__logo"
                    aria-hidden="true"
                />

                {/* Three staggered teal dots */}
                <div className="ignite-loader__dots" aria-hidden="true">
                    <span className="ignite-loader__dot ignite-loader__dot--1" />
                    <span className="ignite-loader__dot ignite-loader__dot--2" />
                    <span className="ignite-loader__dot ignite-loader__dot--3" />
                </div>

                {/* Loading text — screen-reader accessible */}
                <p className="ignite-loader__text">{text}</p>
            </div>
        </div>
    );
};

export default IgniteLoader;
