import SearchInput from "../../common/SearchInput/SearchInput";
import Select from "../../common/Select/Select";

import "./RoleFilters.css";

const RoleFilters = ({
    search = "",
    onSearch,
    status = "all",
    onStatusChange,
    sortBy = "name",
    onSortChange,
}) => {
    const statusOptions = [
        { label: "All Status", value: "all" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
    ];

    const sortOptions = [
        { label: "Name", value: "name" },
        { label: "Most Employees", value: "employees" },
        { label: "Most Permissions", value: "permissions" },
        { label: "Newest", value: "newest" },
        { label: "Oldest", value: "oldest" },
    ];

    return (
        <div className="role-filters">
            <div className="role-filters__search">
                <SearchInput
                    value={search}
                    onChange={onSearch}
                    placeholder="Search by role name or description..."
                />
            </div>

            <div className="role-filters__actions">
                <Select
                    value={status}
                    onChange={onStatusChange}
                    options={statusOptions}
                />

                <Select
                    value={sortBy}
                    onChange={onSortChange}
                    options={sortOptions}
                />
            </div>
        </div>
    );
};

export default RoleFilters;