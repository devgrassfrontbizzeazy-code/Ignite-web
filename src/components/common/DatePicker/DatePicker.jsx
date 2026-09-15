
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import "./DatePicker.css";

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const WEEKDAYS = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
];

const DatePicker = ({
    value = "",
    onChange,
    minDate,
    maxDate,
    placeholder = "Select date",
    disabled = false,
}) => {
    const wrapperRef = useRef(null);
    const triggerRef = useRef(null);

    const getInitialDate = () => {
        if (value) {
            const date = parseDate(value);

            if (date) {
                return date;
            }
        }

        return new Date();
    };

    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(getInitialDate);

    const [popupPosition, setPopupPosition] = useState({
        top: 0,
        left: 0,
    });

    useEffect(() => {
        if (value) {
            const selectedDate = parseDate(value);

            if (selectedDate) {
                setViewDate(selectedDate);
            }
        }
    }, [value]);

    // Close when clicking outside the DatePicker or calendar popup.
    useEffect(() => {
        const handleOutsideClick = (event) => {
            const clickedTrigger =
                wrapperRef.current?.contains(event.target);

            const clickedPopup =
                event.target.closest(".date-picker__popup");

            if (!clickedTrigger && !clickedPopup) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        document.addEventListener(
            "keydown",
            handleEscape
        );

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

    // Calculate popup position whenever the calendar opens.
    useEffect(() => {
        if (!isOpen || !triggerRef.current) {
            return;
        }

        const updatePopupPosition = () => {
            const rect =
                triggerRef.current.getBoundingClientRect();

            const popupWidth = 270;
            const popupHeight = 340;
            const gap = 6;

            const spaceBelow =
                window.innerHeight - rect.bottom;

            const openUpward =
                spaceBelow < popupHeight &&
                rect.top > popupHeight;

            let left = rect.left;

            // Keep popup inside the viewport horizontally.
            if (
                left + popupWidth >
                window.innerWidth - 12
            ) {
                left =
                    window.innerWidth -
                    popupWidth -
                    12;
            }

            setPopupPosition({
                top: openUpward
                    ? rect.top -
                    popupHeight -
                    gap
                    : rect.bottom + gap,

                left: Math.max(12, left),
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

    const calendarDays = generateCalendar(
        viewDate.getFullYear(),
        viewDate.getMonth()
    );

    const selectedDate = value
        ? parseDate(value)
        : null;

    const handlePreviousMonth = () => {
        setViewDate(
            new Date(
                viewDate.getFullYear(),
                viewDate.getMonth() - 1,
                1
            )
        );
    };

    const handleNextMonth = () => {
        setViewDate(
            new Date(
                viewDate.getFullYear(),
                viewDate.getMonth() + 1,
                1
            )
        );
    };

    const handleDateSelect = (date) => {
        if (isDateDisabled(date)) {
            return;
        }

        onChange?.(formatDate(date));
        setIsOpen(false);
    };

    const handleToday = () => {
        const today = new Date();

        if (!isDateDisabled(today)) {
            onChange?.(formatDate(today));

            setViewDate(
                new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                )
            );

            setIsOpen(false);
        }
    };

    const isDateDisabled = (date) => {
        const formattedDate = formatDate(date);

        if (
            minDate &&
            formattedDate < minDate
        ) {
            return true;
        }

        if (
            maxDate &&
            formattedDate > maxDate
        ) {
            return true;
        }

        return false;
    };

    return (
        <div
            className={`date-picker ${disabled
                    ? "date-picker--disabled"
                    : ""
                }`}
            ref={wrapperRef}
        >
            <button
                ref={triggerRef}
                type="button"
                className={`date-picker__trigger ${isOpen
                        ? "date-picker__trigger--open"
                        : ""
                    }`}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(
                            (previous) => !previous
                        );
                    }
                }}
                disabled={disabled}
            >
                <CalendarDays
                    className="date-picker__trigger-icon"
                    size={15}
                />

                <span
                    className={
                        value
                            ? "date-picker__value"
                            : "date-picker__placeholder"
                    }
                >
                    {value
                        ? formatDisplayDate(value)
                        : placeholder}
                </span>
            </button>

            {isOpen &&
                createPortal(
                    <div
                        className="date-picker__popup"
                        style={{
                            top: `${popupPosition.top}px`,
                            left: `${popupPosition.left}px`,
                        }}
                    >
                        {/* Calendar Header */}
                        <div className="date-picker__header">
                            <button
                                type="button"
                                className="date-picker__nav-button"
                                onClick={
                                    handlePreviousMonth
                                }
                                aria-label="Previous month"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="date-picker__month-year">
                                <span>
                                    {
                                        MONTHS[
                                        viewDate.getMonth()
                                        ]
                                    }
                                </span>

                                <strong>
                                    {viewDate.getFullYear()}
                                </strong>
                            </div>

                            <button
                                type="button"
                                className="date-picker__nav-button"
                                onClick={
                                    handleNextMonth
                                }
                                aria-label="Next month"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* Weekdays */}
                        <div className="date-picker__weekdays">
                            {WEEKDAYS.map((day) => (
                                <span key={day}>
                                    {day}
                                </span>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="date-picker__calendar">
                            {calendarDays.map(
                                (date, index) => {
                                    if (!date) {
                                        return (
                                            <span
                                                className="date-picker__empty"
                                                key={`empty-${index}`}
                                            />
                                        );
                                    }

                                    const isSelected =
                                        selectedDate &&
                                        isSameDate(
                                            date,
                                            selectedDate
                                        );

                                    const isToday =
                                        isSameDate(
                                            date,
                                            new Date()
                                        );

                                    const isDisabled =
                                        isDateDisabled(
                                            date
                                        );

                                    return (
                                        <button
                                            type="button"
                                            key={formatDate(
                                                date
                                            )}
                                            className={[
                                                "date-picker__day",
                                                isSelected
                                                    ? "date-picker__day--selected"
                                                    : "",
                                                isToday
                                                    ? "date-picker__day--today"
                                                    : "",
                                                isDisabled
                                                    ? "date-picker__day--disabled"
                                                    : "",
                                            ]
                                                .filter(
                                                    Boolean
                                                )
                                                .join(" ")}
                                            onClick={() =>
                                                handleDateSelect(
                                                    date
                                                )
                                            }
                                            disabled={
                                                isDisabled
                                            }
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                }
                            )}
                        </div>

                        {/* Footer */}
                        <div className="date-picker__footer">
                            <button
                                type="button"
                                className="date-picker__today-button"
                                onClick={handleToday}
                                disabled={isDateDisabled(
                                    new Date()
                                )}
                            >
                                Today
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};

function parseDate(value) {
    if (!value) {
        return null;
    }

    const [year, month, day] = value
        .split("-")
        .map(Number);

    if (!year || !month || !day) {
        return null;
    }

    return new Date(
        year,
        month - 1,
        day
    );
}

function formatDate(date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
    const date = parseDate(value);

    if (!date) {
        return value;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

function isSameDate(first, second) {
    return (
        first.getFullYear() ===
        second.getFullYear() &&
        first.getMonth() ===
        second.getMonth() &&
        first.getDate() ===
        second.getDate()
    );
}

function generateCalendar(year, month) {
    const firstDay = new Date(
        year,
        month,
        1
    );

    // Convert Sunday-first JS index to Monday-first.
    const firstDayIndex =
        (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    const days = [];

    for (
        let i = 0;
        i < firstDayIndex;
        i++
    ) {
        days.push(null);
    }

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {
        days.push(
            new Date(
                year,
                month,
                day
            )
        );
    }

    return days;
}

export default DatePicker;
