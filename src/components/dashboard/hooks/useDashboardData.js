import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import attendanceAPI from "../../../services/api/attendanceAPI";
import leaveApplicationAPI from "../../../services/api/leaveApplicationAPI";
import { getDashboard } from "../../../services/api/dashboardAPI";

import holidayAPI from "../../../services/api/holidayAPI";

import { getDepartments } from "../../../services/api/departmentAPI";
import { getDesignations } from "../../../services/api/designationAPI";
import { getRoles } from "../../../services/api/roleAPI";
import leavePolicyApi from "../../../services/api/leavePolicyAPI";
import { getWorkSchedule } from "../../../services/api/workScheduleAPI";
import { getPayrollOverview } from "../../../services/api/accountAPI";

import { useTeamsTasks } from "../../../context/TeamsTasksContext";

import {
    canViewEmployees,
    canViewDepartments,
    canViewDesignations,
} from "../../../utils/permissionUtils";

import { useOrganization } from "../../../context/OrganizationContext/OrganizationContext";
import { calculateOrganizationSetupProgress } from "../../../utils/setupProgressUtils";

const getArrayData = (response) => {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.results)) {
        return response.results;
    }

    return [];
};

const getInactiveCount = (items) => {
    return items.filter(
        (item) => item?.is_active === false
    ).length;
};

const getDeviceLocationPayload = () => {
    return new Promise((resolve) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            resolve({});
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: Math.round(pos.coords.accuracy),
                });
            },
            () => resolve({}),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
    });
};

const useDashboardData = () => {
    const { company } = useOrganization() || {};

    const {
        teams,
        tasks: teamTasks,
        workManagementAccess,
        loading: contextLoading,
        employees: contextEmployees,
    } = useTeamsTasks();

    const [fetchedData, setFetchedData] = useState({
        attendance: null,
        attendanceHistory: null,

        departments: [],
        designations: [],
        roles: [],
        workSchedule: null,
        payrollSettings: null,
        leavePolicies: [],
        holidaysList: [],

        leaveBalance: [],
        leaves: [],
        holidays: [],

        employeeOverview: {
            total: 0,
            present: 0,
            absent: 0,
            onLeave: 0,
            late: 0,
        },

        organization: {
            departments: {
                total: 0,
                inactive: 0,
            },
            designations: {
                total: 0,
                inactive: 0,
            },
            roles: {
                total: 0,
                inactive: 0,
            },
        },
    });

    const [loading, setLoading] = useState(true);
    const [attendanceActionLoading, setAttendanceActionLoading] =
        useState(false);
    const [error, setError] = useState(null);

    const hasFetchedRef = useRef(false);

    const refreshAttendance = useCallback(async () => {
        const response =
            await attendanceAPI.getTodayAttendance();

        setFetchedData((current) => ({
            ...current,
            attendance: response?.data || null,
        }));

        return response;
    }, []);

    const refreshLeaveData = useCallback(async () => {
        const [leaveBalance, leaves] = await Promise.all([
            leaveApplicationAPI.getApplyOptions(),
            leaveApplicationAPI.getMyLeaves(),
        ]);

        setFetchedData((current) => ({
            ...current,
            leaveBalance: Array.isArray(leaveBalance?.data)
                ? leaveBalance.data
                : [],
            leaves: Array.isArray(leaves?.data)
                ? leaves.data
                : [],
        }));

        return {
            leaveBalance,
            leaves,
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const loadDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch unified dashboard endpoint (single fast roundtrip)
                try {
                    const unifiedResponse = await getDashboard({ signal: controller.signal });
                    const d = unifiedResponse?.data || unifiedResponse;

                    if (d && (d.attendance !== undefined || d.leaveBalance !== undefined || d.holidays !== undefined)) {
                        setFetchedData({
                            attendance: d.attendance || null,
                            attendanceHistory: d.attendanceHistory || null,
                            departments: getArrayData(d.departments),
                            designations: getArrayData(d.designations),
                            roles: getArrayData(d.roles),
                            workSchedule: d.workSchedule || null,
                            payrollSettings: d.payrollSettings || null,
                            leavePolicies: getArrayData(d.leavePolicies),
                            holidaysList: getArrayData(d.holidaysList),
                            leaveBalance: getArrayData(d.leaveBalance),
                            leaves: getArrayData(d.leaves),
                            holidays: getArrayData(d.holidays),
                            employeeOverview: {
                                total: 0,
                                present: 0,
                                absent: 0,
                                onLeave: 0,
                                late: 0,
                            },
                            organization: d.organization || {
                                departments: {
                                    total: getArrayData(d.departments).length,
                                    inactive: getInactiveCount(getArrayData(d.departments)),
                                },
                                designations: {
                                    total: getArrayData(d.designations).length,
                                    inactive: getInactiveCount(getArrayData(d.designations)),
                                },
                                roles: {
                                    total: getArrayData(d.roles).length,
                                    inactive: getInactiveCount(getArrayData(d.roles)),
                                },
                            },
                        });
                        setLoading(false);
                        return;
                    }
                } catch (dashboardApiErr) {
                    if (dashboardApiErr?.name === 'CanceledError' || dashboardApiErr?.code === 'ERR_CANCELED') {
                        return;
                    }
                    console.warn("Unified dashboard API unavailable, falling back to individual calls:", dashboardApiErr);
                }

                /*
                 * Fallback: Individual calls if unified endpoint fails
                 */
                const [
                    attendance,
                    attendanceHistory,
                    leaveBalance,
                    leaves,
                    holidays,
                ] = await Promise.all([
                    attendanceAPI.getTodayAttendance(),
                    attendanceAPI.getAttendanceHistory("1m"),
                    leaveApplicationAPI.getApplyOptions(),
                    leaveApplicationAPI.getMyLeaves(),
                    holidayAPI.getUpcomingHolidays(),
                ]);

                if (!isMounted) return;

                const [
                    departmentsResponse,
                    designationsResponse,
                    rolesResponse,
                    workScheduleResponse,
                    leavePoliciesResponse,
                    holidaysResponse,
                    payrollSettingsResponse,
                ] = await Promise.allSettled([
                    canViewDepartments()
                        ? getDepartments()
                        : Promise.resolve(null),

                    canViewDesignations()
                        ? getDesignations()
                        : Promise.resolve(null),

                    canViewEmployees()
                        ? getRoles()
                        : Promise.resolve(null),

                    getWorkSchedule(),

                    leavePolicyApi.getPolicies(),

                    holidayAPI.getHolidays(),

                    getPayrollOverview(),
                ]);

                if (!isMounted) return;

                const departments =
                    departmentsResponse.status === "fulfilled"
                        ? getArrayData(departmentsResponse.value)
                        : [];

                const designations =
                    designationsResponse.status === "fulfilled"
                        ? getArrayData(designationsResponse.value)
                        : [];

                const roles =
                    rolesResponse.status === "fulfilled"
                        ? getArrayData(rolesResponse.value)
                        : [];

                const workSchedule =
                    workScheduleResponse.status === "fulfilled"
                        ? workScheduleResponse.value?.data || workScheduleResponse.value
                        : null;

                const leavePolicies =
                    leavePoliciesResponse.status === "fulfilled"
                        ? getArrayData(leavePoliciesResponse.value)
                        : [];

                const holidaysList =
                    holidaysResponse.status === "fulfilled"
                        ? getArrayData(holidaysResponse.value)
                        : [];

                const payrollSettings =
                    payrollSettingsResponse.status === "fulfilled"
                        ? (payrollSettingsResponse.value?.data || payrollSettingsResponse.value)
                        : null;

                const employeeOverview = {
                    total: 0,
                    present: 0,
                    absent: 0,
                    onLeave: 0,
                    late: 0,
                };

                const organization = {
                    departments: {
                        total:
                            departmentsResponse?.value?.count ??
                            departments.length,

                        inactive:
                            getInactiveCount(departments),
                    },

                    designations: {
                        total:
                            designationsResponse?.value?.count ??
                            designations.length,

                        inactive:
                            getInactiveCount(designations),
                    },

                    roles: {
                        total:
                            rolesResponse?.value?.count ??
                            roles.length,

                        inactive:
                            getInactiveCount(roles),
                    },
                };

                setFetchedData({
                    attendance:
                        attendance?.data || null,
                    attendanceHistory: attendanceHistory || null,

                    departments,
                    designations,
                    roles,
                    workSchedule,
                    leavePolicies,
                    holidaysList,
                    payrollSettings,

                    leaveBalance:
                        Array.isArray(leaveBalance?.data)
                            ? leaveBalance.data
                            : [],

                    leaves:
                        Array.isArray(leaves?.data)
                            ? leaves.data
                            : [],

                    holidays:
                        Array.isArray(holidays?.data)
                            ? holidays.data
                            : [],

                    employeeOverview,
                    organization,
                });
            } catch (err) {
                if (!isMounted) return;

                console.error(
                    "Failed to load dashboard data:",
                    err
                );

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

    useEffect(() => {
        const handlePayrollSettingsUpdate = (event) => {
            const nextSettings = event.detail ?? null;
            if (nextSettings) {
                setFetchedData((current) => ({
                    ...current,
                    payrollSettings: nextSettings,
                }));
            } else {
                getPayrollOverview()
                    .then((res) => {
                        setFetchedData((current) => ({
                            ...current,
                            payrollSettings: res?.data || res,
                        }));
                    })
                    .catch(() => { });
            }
        };

        window.addEventListener(
            "ignite:payroll-settings-updated",
            handlePayrollSettingsUpdate
        );

        return () => {
            window.removeEventListener(
                "ignite:payroll-settings-updated",
                handlePayrollSettingsUpdate
            );
        };
    }, []);

    /*
     * Context-derived data computation.
     * Recomputed whenever teams, teamTasks, workManagementAccess, or contextEmployees change,
     * WITHOUT executing any backend API calls.
     */
    const employees = useMemo(
        () => (canViewEmployees() ? contextEmployees : []),
        [contextEmployees]
    );

    const userTeamIds = useMemo(
        () => new Set(teams.map((team) => String(team.id))),
        [teams]
    );

    const visibleTeamTasks = useMemo(
        () =>
            workManagementAccess?.isAdminOrHr
                ? teamTasks
                : teamTasks.filter((task) =>
                    userTeamIds.has(String(task.teamId))
                ),
        [workManagementAccess?.isAdminOrHr, teamTasks, userTeamIds]
    );

    const teamAccess = useMemo(
        () => ({
            hasTeam:
                workManagementAccess?.isMember === true ||
                workManagementAccess?.isLead === true,

            isMember: workManagementAccess?.isMember === true,

            isLead: workManagementAccess?.isLead === true,

            isAdminOrHr: workManagementAccess?.isAdminOrHr === true,
        }),
        [workManagementAccess]
    );

    const organization = useMemo(
        () => ({
            ...fetchedData.organization,
            employees: {
                total: employees.length,
                inactive: getInactiveCount(employees),
            },
        }),
        [fetchedData.organization, employees]
    );

    const punchIn = async () => {
        try {
            setAttendanceActionLoading(true);
            setError(null);

            const gps = await getDeviceLocationPayload();
            await attendanceAPI.punchIn(gps);
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

            const gps = await getDeviceLocationPayload();
            await attendanceAPI.punchOut(gps);
            await refreshAttendance();
        } catch (err) {
            console.error("Failed to punch out:", err);
            setError(err);
            throw err;
        } finally {
            setAttendanceActionLoading(false);
        }
    };

    const setupProgress = useMemo(
        () =>
            calculateOrganizationSetupProgress({
                company,
                departments: fetchedData.departments,
                designations: fetchedData.designations,
                roles: fetchedData.roles,
                workSchedule: fetchedData.workSchedule,
                leavePolicies: fetchedData.leavePolicies,
                holidays: fetchedData.holidaysList.length > 0 ? fetchedData.holidaysList : fetchedData.holidays,
                payrollSettings: fetchedData.payrollSettings,
            }),
        [
            company,
            fetchedData.departments,
            fetchedData.designations,
            fetchedData.roles,
            fetchedData.workSchedule,
            fetchedData.leavePolicies,
            fetchedData.holidaysList,
            fetchedData.holidays,
            fetchedData.payrollSettings,

        ]
    );

    return {
        ...fetchedData,
        employees,
        teams,
        tasks: visibleTeamTasks,
        teamAccess,
        organization,
        setupProgress,
        loading,
        error,
        attendanceActionLoading,
        punchIn,
        punchOut,
        refreshAttendance,
        refreshLeaveData,
    };
};

export default useDashboardData;