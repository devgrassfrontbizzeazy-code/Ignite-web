import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3, ChevronDown } from "lucide-react";

import "./TimePicker.css";

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = ["00", "15", "30", "45"];

function TimePicker({ value = "", onChange, disabled = false }) {
    const wrapperRef = useRef(null);
    const triggerRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [popupPosition, setPopupPosition] = useState({
        top: 0,
        left: 0,
    });

    const parsed = parseTime(value);

    const [hour, setHour] = useState(parsed.hour);
    const [minute, setMinute] = useState(parsed.minute);
    const [period, setPeriod] = useState(parsed.period);

    useEffect(() => {
        const next = parseTime(value);

        setHour(next.hour);
        setMinute(next.minute);
        setPeriod(next.period);
    }, [value]);

    /* Close on outside click / Escape */
    useEffect(() => {
        const handleOutsideClick = (event) => {
            const clickedTrigger =
                wrapperRef.current?.contains(event.target);

            const clickedPopup =
                event.target.closest(".time-picker__popup");

            if (!clickedTrigger && !clickedPopup) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, []);

    /* Position popup */
    useEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const updatePopupPosition = () => {
            const rect =
                triggerRef.current.getBoundingClientRect();

            const popupWidth = 280;
            const popupHeight = 330;
            const gap = 6;
            const viewportPadding = 12;

            const spaceBelow =
                window.innerHeight - rect.bottom;

            const spaceAbove = rect.top;

            const openUpward =
                spaceBelow < popupHeight &&
                spaceAbove > popupHeight;

            let left = rect.left;

            /* Keep popup inside viewport horizontally */
            if (
                left + popupWidth >
                window.innerWidth - viewportPadding
            ) {
                left =
                    window.innerWidth -
                    popupWidth -
                    viewportPadding;
            }

            left = Math.max(viewportPadding, left);

            const top = openUpward
                ? rect.top - popupHeight - gap
                : rect.bottom + gap;

            setPopupPosition({
                top: Math.max(
                    viewportPadding,
                    top
                ),
                left,
            });
        };

        updatePopupPosition();

        window.addEventListener(
            "resize",
            updatePopupPosition
        );

        window.addEventListener(
            "scroll",
            updatePopupPosition,
            true
        );

        return () => {
            window.removeEventListener(
                "resize",
                updatePopupPosition
            );

            window.removeEventListener(
                "scroll",
                updatePopupPosition,
                true
            );
        };
    }, [isOpen]);

    const updateTime = (
        nextHour,
        nextMinute,
        nextPeriod
    ) => {
        setHour(nextHour);
        setMinute(nextMinute);
        setPeriod(nextPeriod);

        onChange?.(
            `${String(nextHour).padStart(
                2,
                "0"
            )}:${nextMinute} ${nextPeriod}`
        );
    };

    return (
        <div
            ref={wrapperRef}
            className={`time-picker ${disabled
                ? "time-picker--disabled"
                : ""
                }`}
        >
            <button
                ref={triggerRef}
                type="button"
                className={`time-picker__trigger ${isOpen
                    ? "time-picker__trigger--open"
                    : ""
                    }`}
                onClick={() =>
                    !disabled &&
                    setIsOpen((previous) => !previous)
                }
                disabled={disabled}
            >
                <Clock3
                    size={15}
                    className="time-picker__icon"
                />

                <span
                    className={
                        value
                            ? "time-picker__value"
                            : "time-picker__placeholder"
                    }
                >
                    {value || "Select time"}
                </span>

                <ChevronDown
                    size={14}
                    className={`time-picker__chevron ${isOpen
                        ? "time-picker__chevron--open"
                        : ""
                        }`}
                />
            </button>

            {isOpen &&
                createPortal(
                    <div
                        className="time-picker__popup"
                        style={{
                            top: `${popupPosition.top}px`,
                            left: `${popupPosition.left}px`,
                        }}
                    >
                        <div className="time-picker__header">
                            <div>
                                <span className="time-picker__header-label">
                                    Select time
                                </span>

                                <strong>
                                    {formatDisplayTime(
                                        hour,
                                        minute,
                                        period
                                    )}
                                </strong>
                            </div>

                            <Clock3 size={16} />
                        </div>

                        <div className="time-picker__selectors">
                            <TimeColumn
                                label="Hour"
                                options={HOURS}
                                value={hour}
                                onChange={(value) =>
                                    updateTime(
                                        Number(value),
                                        minute,
                                        period
                                    )
                                }
                            />

                            <div className="time-picker__colon">
                                :
                            </div>

                            <TimeColumn
                                label="Minute"
                                options={MINUTES}
                                value={minute}
                                onChange={(value) =>
                                    updateTime(
                                        hour,
                                        value,
                                        period
                                    )
                                }
                            />

                            <TimeColumn
                                label="Period"
                                options={["AM", "PM"]}
                                value={period}
                                onChange={(value) =>
                                    updateTime(
                                        hour,
                                        minute,
                                        value
                                    )
                                }
                            />
                        </div>

                        <div className="time-picker__footer">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                            >
                                Done
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}

function TimeColumn({
    label,
    options,
    value,
    onChange,
}) {
    return (
        <div className="time-picker__column">
            <span className="time-picker__column-label">
                {label}
            </span>

            <div className="time-picker__options">
                {options.map((option) => {
                    const optionValue = String(option);

                    return (
                        <button
                            type="button"
                            key={optionValue}
                            className={
                                String(value) === optionValue
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                onChange(optionValue)
                            }
                        >
                            {optionValue}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function parseTime(value) {
    if (!value) {
        return {
            hour: 10,
            minute: "00",
            period: "AM",
        };
    }

    const match = value.match(
        /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i
    );

    if (match) {
        return {
            hour: Number(match[1]),
            minute: match[2],
            period: match[3].toUpperCase(),
        };
    }

    const twentyFourHourMatch = value.match(
        /^(\d{1,2}):(\d{2})$/
    );

    if (twentyFourHourMatch) {
        let hour = Number(
            twentyFourHourMatch[1]
        );

        const minute =
            twentyFourHourMatch[2];

        const period =
            hour >= 12 ? "PM" : "AM";

        if (hour === 0) hour = 12;
        if (hour > 12) hour -= 12;

        return {
            hour,
            minute,
            period,
        };
    }

    return {
        hour: 10,
        minute: "00",
        period: "AM",
    };
}

function formatDisplayTime(
    hour,
    minute,
    period
) {
    return `${String(hour).padStart(
        2,
        "0"
    )}:${minute} ${period}`;
}

export default TimePicker;