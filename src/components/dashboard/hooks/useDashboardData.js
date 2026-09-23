import { useCallback, useEffect, useState } from "react";

import attendanceAPI from "../../../services/api/attendanceAPI";
import leaveApplicationAPI from "../../../services/api/leaveApplicationAPI";
import taskAPI from "../../../services/api/taskAPI";

const useDashboardData = () => {
    const [data, setData] = useState({
        attendance: null,
        leaves: [],
        tasks: [],
    });

    const [loading, setLoading] = useState(true);
    const [attendanceActionLoading, setAttendanceActionLoading] =
        useState(false);
    const [error, setError] = useState(null);

    const refreshAttendance = useCallback(async () => {
        const response = await attendanceAPI.getTodayAttendance();

        setData((current) => ({
            ...current,
            attendance: response?.data || null,
        }));

        return response;
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [attendance, leaves, tasksResponse] = await Promise.all([
                    attendanceAPI.getTodayAttendance(),
                    leaveApplicationAPI.getMyLeaves(),
                    taskAPI.getTasks(),
                ]);

                if (!isMounted) return;

                const taskPayload = tasksResponse?.data;

                setData({
                    attendance: attendance?.data || null,
                    leaves: leaves?.data || [],
                    tasks: Array.isArray(taskPayload?.data)
                        ? taskPayload.data
                        : Array.isArray(taskPayload)
                            ? taskPayload
                            : [],
                });
            } catch (err) {
                if (!isMounted) return;

                console.error("Failed to load dashboard data:", err);
                setError(err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDashboardData();

        return () => {
            isMounted = false;
        };
    }, []);

    const punchIn = async () => {
        try {
            setAttendanceActionLoading(true);
            setError(null);

            await attendanceAPI.punchIn();
            await refreshAttendance();
        } catch (err) {
            console.error("Failed to punch in:", err);
            setError(err);
            throw err;
        } finally {
            setAttendanceActionLoading(false);
        }
    };

    const punchOut = async () => {
        try {
            setAttendanceActionLoading(true);
            setError(null);

            await attendanceAPI.punchOut();
            await refreshAttendance();
        } catch (err) {
            console.error("Failed to punch out:", err);
            setError(err);
            throw err;
        } finally {
            setAttendanceActionLoading(false);
        }
    };

    return {
        ...data,
        loading,
        error,
        attendanceActionLoading,
        punchIn,
        punchOut,
        refreshAttendance,
    };
};

export default useDashboardData;