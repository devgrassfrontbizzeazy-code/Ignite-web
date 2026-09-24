import { useCallback, useEffect, useState } from "react";

import attendanceAPI from "../../../services/api/attendanceAPI";
import leaveApplicationAPI from "../../../services/api/leaveApplicationAPI";

import holidayAPI from "../../../services/api/holidayAPI";

import { getEmployees } from "../../../services/api/employeeAPI";
import { getDepartments } from "../../../services/api/departmentAPI";
import { getDesignations } from "../../../services/api/designationAPI";
import { getRoles } from "../../../services/api/roleAPI";

import { useTeamsTasks } from "../../../context/TeamsTasksContext";

import {
    canViewEmployees,
    canViewDepartments,
    canViewDesignations,
    canViewAttendance,
    canViewLeaves,
    canViewHolidays,
    canViewTeams,
} from "../../../utils/permissionUtils";

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

const useDashboardData = () => {
    const {
        teams,
        tasks: teamTasks,
        workManagementAccess,
    } = useTeamsTasks();

    const [data, setData] = useState({
        attendance: null,

        employees: [],
        departments: [],
        designations: [],
        roles: [],

        leaveBalance: [],
        leaves: [],
        holidays: [],
        tasks: [],

        teamAccess: {
            hasTeam: false,
            isMember: false,
            isLead: false,
            isAdminOrHr: false,
        },

        employeeOverview: {
            total: 0,
            present: 0,
            absent: 0,
            onLeave: 0,
            late: 0,
        },

        organization: {
            employees: {
                total: 0,
                inactive: 0,
            },
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

    const refreshAttendance = useCallback(async () => {
        const response =
            await attendanceAPI.getTodayAttendance();

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

                /*
                 * Core personal dashboard data.
                 *
                 * These are independent from organization-level
                 * permissions.
                 */
                const [
                    attendance,
                    leaveBalance,
                    leaves,
                    holidays,
                ] = await Promise.all([
                    attendanceAPI.getTodayAttendance(),
                    leaveApplicationAPI.getApplyOptions(),
                    leaveApplicationAPI.getMyLeaves(),
                    holidayAPI.getUpcomingHolidays(),
                ]);

                if (!isMounted) return;

                /*
                 * Organization-level data is requested only when
                 * the current user has the relevant permission.
                 *
                 * Roles are intentionally not permission-gated yet
                 * because the current permission utility does not
                 * provide a canViewRoles() helper.
                 */
                const organizationRequests = {
                    employees: canViewEmployees()
                        ? getEmployees()
                        : Promise.resolve(null),

                    departments: canViewDepartments()
                        ? getDepartments()
                        : Promise.resolve(null),

                    designations: canViewDesignations()
                        ? getDesignations()
                        : Promise.resolve(null),

                    roles: canViewEmployees()
                        ? getRoles()
                        : Promise.resolve(null),

                    attendance: canViewAttendance()
                        ? Promise.resolve(null)
                        : Promise.resolve(null),

                    leaves: canViewLeaves()
                        ? Promise.resolve(null)
                        : Promise.resolve(null),

                    holidays: canViewHolidays()
                        ? Promise.resolve(null)
                        : Promise.resolve(null),

                    teams: canViewTeams()
                        ? Promise.resolve(null)
                        : Promise.resolve(null),
                };

                const [
                    employeesResponse,
                    departmentsResponse,
                    designationsResponse,
                    rolesResponse,
                ] = await Promise.all([
                    organizationRequests.employees,
                    organizationRequests.departments,
                    organizationRequests.designations,
                    organizationRequests.roles,
                ]);

                if (!isMounted) return;



                const employees =
                    getArrayData(employeesResponse);

                const departments =
                    getArrayData(departmentsResponse);

                const designations =
                    getArrayData(designationsResponse);

                const roles =
                    getArrayData(rolesResponse);

                const employeeOverview = {
                    total: 0,
                    present: 0,
                    absent: 0,
                    onLeave: 0,
                    late: 0,
                };

                const organization = {
                    employees: {
                        total:
                            employeesResponse?.count ??
                            employees.length,

                        inactive:
                            getInactiveCount(employees),
                    },

                    departments: {
                        total:
                            departmentsResponse?.count ??
                            departments.length,

                        inactive:
                            getInactiveCount(departments),
                    },

                    designations: {
                        total:
                            designationsResponse?.count ??
                            designations.length,

                        inactive:
                            getInactiveCount(designations),
                    },

                    roles: {
                        total:
                            rolesResponse?.count ??
                            roles.length,

                        inactive:
                            getInactiveCount(roles),
                    },
                };
                const userTeamIds = new Set(
                    teams.map((team) => String(team.id))
                );

                const visibleTeamTasks = teamTasks.filter((task) =>
                    userTeamIds.has(String(task.teamId))
                );

                setData({
                    attendance:
                        attendance?.data || null,

                    employees,
                    departments,
                    designations,
                    roles,

                    leaveBalance:
                        Array.isArray(leaveBalance?.data)
                            ? leaveBalance.data
                            : [],

                    leaves:
                        Array.isArray(leaves?.data)
                            ? leaves.data
                            : [],

                    tasks: visibleTeamTasks,

                    holidays:
                        Array.isArray(holidays?.data)
                            ? holidays.data
                            : [],

                    teamAccess: {
                        hasTeam:
                            workManagementAccess?.isMember === true ||
                            workManagementAccess?.isLead === true,

                        isMember:
                            workManagementAccess?.isMember === true,

                        isLead:
                            workManagementAccess?.isLead === true,

                        isAdminOrHr:
                            workManagementAccess?.isAdminOrHr === true,
                    },

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
    }, [workManagementAccess, teams, teamTasks]);

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