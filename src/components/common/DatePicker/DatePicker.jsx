
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
    placeholder,
    disabled = false,
    mode = "date", // 'date' | 'month'
    className = "",
}) => {
    const wrapperRef = useRef(null);
    const triggerRef = useRef(null);

    const defaultPlaceholder = mode === "month" ? "Select month" : "Select date";
    const activePlaceholder = placeholder || defaultPlaceholder;

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

            const popupWidth = mode === "month" ? 270 : 280;
            const popupHeight = mode === "month" ? 260 : 340;
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
    }, [isOpen, mode]);

    const calendarDays = generateCalendar(
        viewDate.getFullYear(),
        viewDate.getMonth()
    );

    const selectedDate = value
        ? parseDate(value)
        : null;

    const handleMonthChange = (e) => {
        const newMonth = parseInt(e.target.value, 10);
        setViewDate(
            new Date(
                viewDate.getFullYear(),
                newMonth,
                1
            )
        );
    };

    const handleYearChange = (e) => {
        const newYear = parseInt(e.target.value, 10);
        setViewDate(
            new Date(
                newYear,
                viewDate.getMonth(),
                1
            )
        );
    };

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

    const handlePreviousYear = () => {
        setViewDate(
            new Date(
                viewDate.getFullYear() - 1,
                viewDate.getMonth(),
                1
            )
        );
    };

    const handleNextYear = () => {
        setViewDate(
            new Date(
                viewDate.getFullYear() + 1,
                viewDate.getMonth(),
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

    const handleMonthSelect = (monthIndex) => {
        const year = viewDate.getFullYear();
        const monthStr = String(monthIndex + 1).padStart(2, "0");
        const formatted = `${year}-${monthStr}`;

        if (isMonthDisabled(year, monthIndex)) {
            return;
        }

        onChange?.(formatted);
        setViewDate(new Date(year, monthIndex, 1));
        setIsOpen(false);
    };

    const handleToday = () => {
        const today = new Date();

        if (mode === "month") {
            const year = today.getFullYear();
            const monthStr = String(today.getMonth() + 1).padStart(2, "0");
            const formatted = `${year}-${monthStr}`;
            onChange?.(formatted);
            setViewDate(new Date(year, today.getMonth(), 1));
            setIsOpen(false);
            return;
        }

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

    const isMonthDisabled = (year, monthIndex) => {
        const monthStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
        if (minDate && monthStr < minDate.slice(0, 7)) {
            return true;
        }
        if (maxDate && monthStr > maxDate.slice(0, 7)) {
            return true;
        }
        return false;
    };

    const currentYear = new Date().getFullYear();

    return (
        <div
            className={`date-picker ${disabled
                    ? "date-picker--disabled"
                    : ""
                } ${mode === "month" ? "date-picker--month-mode" : ""} ${className}`}
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
                        ? formatDisplayDate(value, mode)
                        : activePlaceholder}
                </span>
            </button>

            {isOpen &&
                createPortal(
                    <div
                        className={`date-picker__popup ${mode === "month" ? "date-picker__popup--month" : ""}`}
                        style={{
                            top: `${popupPosition.top}px`,
                            left: `${popupPosition.left}px`,
                        }}
                    >
                        {mode === "month" ? (
                            <>
                                {/* Month mode header */}
                                <div className="date-picker__header">
                                    <button
                                        type="button"
                                        className="date-picker__nav-button"
                                        onClick={handlePreviousYear}
                                        aria-label="Previous year"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    <div className="date-picker__month-year">
                                        <select
                                            className="date-picker__select date-picker__select--year"
                                            value={viewDate.getFullYear()}
                                            onChange={handleYearChange}
                                            aria-label="Select year"
                                        >
                                            {Array.from({ length: 120 }, (_, i) => {
                                                const year = currentYear + 10 - i;
                                                return (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        className="date-picker__nav-button"
                                        onClick={handleNextYear}
                                        aria-label="Next year"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                                {/* Month Grid */}
                                <div className="date-picker__months-grid">
                                    {MONTHS.map((monthName, idx) => {
                                        const isSelected =
                                            selectedDate &&
                                            selectedDate.getFullYear() === viewDate.getFullYear() &&
                                            selectedDate.getMonth() === idx;

                                        const now = new Date();
                                        const isCurrent =
                                            now.getFullYear() === viewDate.getFullYear() &&
                                            now.getMonth() === idx;

                                        const isDisabled = isMonthDisabled(
                                            viewDate.getFullYear(),
                                            idx
                                        );

                                        return (
                                            <button
                                                type="button"
                                                key={monthName}
                                                className={`date-picker__month-cell ${
                                                    isSelected ? "date-picker__month-cell--selected" : ""
                                                } ${
                                                    isCurrent ? "date-picker__month-cell--current" : ""
                                                }`}
                                                onClick={() => handleMonthSelect(idx)}
                                                disabled={isDisabled}
                                            >
                                                {monthName.slice(0, 3)}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="date-picker__footer">
                                    <button
                                        type="button"
                                        className="date-picker__today-button"
                                        onClick={handleToday}
                                    >
                                        This Month
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
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
                                        <select
                                            className="date-picker__select date-picker__select--month"
                                            value={viewDate.getMonth()}
                                            onChange={handleMonthChange}
                                            aria-label="Select month"
                                        >
                                            {MONTHS.map((monthName, idx) => (
                                                <option key={monthName} value={idx}>
                                                    {monthName}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            className="date-picker__select date-picker__select--year"
                                            value={viewDate.getFullYear()}
                                            onChange={handleYearChange}
                                            aria-label="Select year"
                                        >
                                            {Array.from({ length: 120 }, (_, i) => {
                                                const year = currentYear + 10 - i;
                                                return (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                );
                                            })}
                                        </select>
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
                            </>
                        )}
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

    if (value instanceof Date) {
        return value;
    }

    const parts = String(value).split("-").map(Number);

    if (parts.length >= 2 && parts[0] && parts[1]) {
        return new Date(
            parts[0],
            parts[1] - 1,
            parts[2] || 1
        );
    }

    return null;
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

function formatDisplayDate(value, mode = "date") {
    const date = parseDate(value);

    if (!date) {
        return value;
    }

    if (mode === "month") {
        return date.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric",
            }
        );
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
