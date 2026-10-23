import { useEffect, useState } from "react";

const toSeconds = (duration) => {
  const seconds = Number(duration);
  return Number.isFinite(seconds) ? Math.max(Math.floor(seconds), 0) : 0;
};

const useLiveAttendanceClock = ({
  workingDuration = 0,
  checkInAt = null,
  checkOutAt = null,
  status,
}) => {
  const baseWorkingSeconds = toSeconds(workingDuration);
  const hasActiveSession = Boolean(
    !checkOutAt &&
      (status === "WORKING" ||
        status === "ON_BREAK" ||
        (!status && checkInAt)),
  );
  const isWorking = !status
    ? Boolean(checkInAt && !checkOutAt)
    : status === "WORKING";

  const [clock, setClock] = useState(() => ({
    now: Date.now(),
    startedAt: 0,
    baseWorkingSeconds: null,
    checkInAt: null,
    checkOutAt: null,
    status: null,
  }));

  useEffect(() => {
    if (!hasActiveSession) {
      return undefined;
    }

    let firstTick = true;
    const interval = setInterval(() => {
      const now = Date.now();
      setClock((current) => ({
        now,
        startedAt: firstTick ? now : current.startedAt,
        baseWorkingSeconds,
        checkInAt,
        checkOutAt,
        status,
      }));
      firstTick = false;
    }, 1000);

    return () => clearInterval(interval);
  }, [
    baseWorkingSeconds,
    checkInAt,
    checkOutAt,
    hasActiveSession,
    status,
  ]);

  const hasCurrentClock =
    clock?.baseWorkingSeconds === baseWorkingSeconds &&
    clock?.checkInAt === checkInAt &&
    clock?.checkOutAt === checkOutAt &&
    clock?.status === status;
  const elapsedWorkingSeconds =
    hasCurrentClock && isWorking
      ? Math.max(
          Math.floor(
            (clock.now - (clock.startedAt ?? clock.now)) / 1000,
          ),
          0,
        )
      : 0;

  return {
    workingSeconds: baseWorkingSeconds + elapsedWorkingSeconds,
    currentTime: new Date(clock.now),
  };
};

export default useLiveAttendanceClock;
