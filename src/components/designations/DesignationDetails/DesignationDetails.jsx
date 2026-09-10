import Button from "../../common/Button/Button";
import { formatDate } from "../../../utils/dateUtils";

import {
getAccessProfile,
getAccessProfilePermissions,
getScopeLabel,
} from "../../../data/accessProfiles";

import { PERMISSION_CATALOGUE } from "../../../data/permissionCatalogue";

import "./DesignationDetails.css";

const SELF_SERVICE_CAPABILITIES = [
"Own profile",
"Own attendance",
"Attendance regularization",
"Own leave balance and history",
"Leave application and cancellation",
"Company holidays",
"Own team and team lead",
];

const DesignationDetails = ({
designation,
onClose,
onEdit,
}) => {
if (!designation) {
return null;
}

/* =========================================================
Basic Information
========================================================= */

const isActive =
designation.status === "active";

const accessProfileKey =
designation.accessProfile ||
designation.access_profile ||
designation.accessProfileKey ||
designation.access_profile_key ||
"";

const accessProfile =
getAccessProfile(
accessProfileKey,
);

const profilePermissions =
getAccessProfilePermissions(
accessProfileKey,
);

/* =========================================================
Additional Permissions


 These are permissions manually added to this
 designation. They are NOT the base permissions
 coming from the Access Profile.
 ========================================================= */


const rawAdditionalPermissions =
designation.additionalPermissions ??
designation.additional_permissions ??
[];

const additionalPermissions =
Array.isArray(
rawAdditionalPermissions,
)
? rawAdditionalPermissions.map(
(permission) => {
const moduleKey =
permission.module ||
permission.moduleKey ||
"";


        const action =
          permission.action || "";

        const catalogueModule =
          PERMISSION_CATALOGUE.find(
            (module) =>
              module.key === moduleKey,
          );

        const actionConfig =
          catalogueModule?.actions?.[
            action
          ];

        return {
          module:
            permission.moduleName ||
            catalogueModule?.name ||
            moduleKey,

          action,

          label:
            permission.actionName ||
            actionConfig?.label ||
            action,

          scope:
            permission.scope || null,
        };
      },
    )
  : [];


/* =========================================================
Group Additional Permissions By Module
========================================================= */

const permissionsByModule =
additionalPermissions.reduce(
(groups, permission) => {
if (!groups[permission.module]) {
groups[permission.module] = [];
}


    groups[permission.module].push(
      permission,
    );

    return groups;
  },
  {},
);


/* =========================================================
Base Access Profile Permissions
========================================================= */

const basePermissions =
PERMISSION_CATALOGUE.flatMap(
(module) => {
const modulePermissions =
profilePermissions[
module.key
];


    if (!modulePermissions) {
      return [];
    }

    return Object.entries(
      modulePermissions,
    )
      .filter(
        ([, config]) =>
          config?.enabled,
      )
      .map(
        ([action, config]) => ({
          module:
            module.name,

          action,

          label:
            module.actions[
              action
            ]?.label ||
            action,

          scope:
            config.scope ||
            null,
        }),
      );
  },
);


/* =========================================================
Group Base Permissions By Module
========================================================= */

const basePermissionsByModule =
basePermissions.reduce(
(groups, permission) => {
if (!groups[permission.module]) {
groups[permission.module] = [];
}


    groups[permission.module].push(
      permission,
    );

    return groups;
  },
  {},
);


return ( <div className="designation-details">


  {/* =====================================================
      Top
      ===================================================== */}

  <div className="designation-details__top">

    <div className="designation-details__identity">

      <div className="designation-details__icon">
        💼
      </div>

      <div>
        <h3 className="designation-details__name">
          {designation.designationName ||
            "—"}
        </h3>

        <p className="designation-details__department">
          {designation.departmentName ||
            "No department"}
        </p>
      </div>

    </div>


    <span
      className={`designation-details__status designation-details__status--${
        isActive
          ? "active"
          : "inactive"
      }`}
    >
      <span className="designation-details__status-dot" />

      {isActive
        ? "Active"
        : "Inactive"}
    </span>

  </div>


  {/* =====================================================
      Designation Information
      ===================================================== */}

  <div className="designation-details__section">

    <h4>Designation Information</h4>

    <div className="designation-details__grid">

      <div className="designation-details__item">
        <span className="designation-details__label">
          Designation Code
        </span>

        <span className="designation-details__value">
          {designation.designationCode ||
            "—"}
        </span>
      </div>


      <div className="designation-details__item">
        <span className="designation-details__label">
          Designation Name
        </span>

        <span className="designation-details__value">
          {designation.designationName ||
            "—"}
        </span>
      </div>


      <div className="designation-details__item">
        <span className="designation-details__label">
          Department
        </span>

        <span className="designation-details__value">
          {designation.departmentName ||
            "—"}
        </span>
      </div>


      <div className="designation-details__item">
        <span className="designation-details__label">
          Access Profile
        </span>

        <span className="designation-details__value">
          {accessProfile?.name ||
            designation.accessProfileName ||
            "Employee"}
        </span>
      </div>


      <div className="designation-details__item">
        <span className="designation-details__label">
          Status
        </span>

        <span className="designation-details__value">
          {isActive
            ? "Active"
            : "Inactive"}
        </span>
      </div>


      <div className="designation-details__item">
        <span className="designation-details__label">
          Created At
        </span>

        <span className="designation-details__value">
          {formatDate(
            designation.createdAt,
          )}
        </span>
      </div>


      <div className="designation-details__item">
        <span className="designation-details__label">
          Last Updated
        </span>

        <span className="designation-details__value">
          {formatDate(
            designation.updatedAt,
          )}
        </span>
      </div>

    </div>

  </div>


  {/* =====================================================
      Access Profile
      ===================================================== */}

  <div className="designation-details__section">

    <div className="designation-details__section-header">

      <div>
        <h4>Access Profile</h4>

        <p className="designation-details__section-description">
          The base permission bundle assigned to this
          designation.
        </p>
      </div>

    </div>


    <div className="designation-details__profile-card">

      <div className="designation-details__profile-icon">
        ✓
      </div>


      <div className="designation-details__profile-content">

        <span className="designation-details__profile-name">
          {accessProfile?.name ||
            designation.accessProfileName ||
            "Employee"}
        </span>

        <span className="designation-details__profile-description">
          {accessProfile?.description ||
            "Basic self-service access."}
        </span>

      </div>

    </div>

  </div>


  {/* =====================================================
      Base Profile Permissions
      ===================================================== */}

  <div className="designation-details__section">

    <div className="designation-details__section-header">

      <div>
        <h4>Profile Permissions</h4>

        <p className="designation-details__section-description">
          Permissions automatically provided by the
          selected access profile.
        </p>
      </div>


      <span className="designation-details__permission-count">
        {basePermissions.length} permission
        {basePermissions.length === 1
          ? ""
          : "s"}
      </span>

    </div>


    {basePermissions.length === 0 ? (

      <div className="designation-details__permissions-empty">

        <div className="designation-details__empty-icon">
          ✓
        </div>

        <div>

          <strong>
            No elevated profile permissions
          </strong>

          <p>
            This access profile only provides built-in
            self-service access.
          </p>

        </div>

      </div>

    ) : (

      <div className="designation-details__permission-groups">

        {Object.entries(
          basePermissionsByModule,
        ).map(
          ([
            moduleName,
            modulePermissions,
          ]) => (

            <div
              className="designation-details__permission-group"
              key={moduleName}
            >

              <div className="designation-details__permission-group-header">

                <span>
                  {moduleName}
                </span>

                <span className="designation-details__module-count">
                  {
                    modulePermissions.length
                  }
                </span>

              </div>


              <div className="designation-details__permission-list">

                {modulePermissions.map(
                  (permission) => (

                    <div
                      className="designation-details__permission"
                      key={`${permission.module}-${permission.action}`}
                    >

                      <span className="designation-details__permission-check">
                        ✓
                      </span>

                      <span className="designation-details__permission-name">
                        {permission.label}
                      </span>

                      {permission.scope && (
                        <span className="designation-details__permission-scope">
                          {getScopeLabel(
                            permission.scope,
                          )}
                        </span>
                      )}

                    </div>

                  ),
                )}

              </div>

            </div>

          ),
        )}

      </div>

    )}

  </div>


  {/* =====================================================
      Description
      ===================================================== */}

  <div className="designation-details__section">

    <h4>Description</h4>

    <p className="designation-details__description">
      {designation.description ||
        "No description has been added for this designation."}
    </p>

  </div>


  {/* =====================================================
      Built-in Self Service
      ===================================================== */}

  <div className="designation-details__section">

    <div className="designation-details__section-header">

      <div>

        <h4>Built-in Self-Service</h4>

        <p className="designation-details__section-description">
          Automatically available to every active
          employee.
        </p>

      </div>


      <span className="designation-details__permission-badge">
        Always available
      </span>

    </div>


    <div className="designation-details__self-service">

      {SELF_SERVICE_CAPABILITIES.map(
        (capability) => (

          <div
            className="designation-details__self-service-item"
            key={capability}
          >

            <span className="designation-details__permission-check">
              ✓
            </span>

            <span>
              {capability}
            </span>

          </div>

        ),
      )}

    </div>

  </div>


  {/* =====================================================
      Additional Permissions
      ===================================================== */}

  <div className="designation-details__section">

    <div className="designation-details__section-header">

      <div>

        <h4>Additional Permissions</h4>

        <p className="designation-details__section-description">
          Extra permissions added specifically to this
          designation.
        </p>

      </div>


      <span className="designation-details__permission-count">
        {additionalPermissions.length} permission
        {additionalPermissions.length === 1
          ? ""
          : "s"}
      </span>

    </div>


    {additionalPermissions.length === 0 ? (

      <div className="designation-details__permissions-empty">

        <div className="designation-details__empty-icon">
          ✓
        </div>

        <div>

          <strong>
            No additional permissions
          </strong>

          <p>
            No extra permissions have been added to this
            designation.
          </p>

        </div>

      </div>

    ) : (

      <div className="designation-details__permission-groups">

        {Object.entries(
          permissionsByModule,
        ).map(
          ([
            moduleName,
            modulePermissions,
          ]) => (

            <div
              className="designation-details__permission-group"
              key={moduleName}
            >

              <div className="designation-details__permission-group-header">

                <span>
                  {moduleName}
                </span>

                <span className="designation-details__module-count">
                  {
                    modulePermissions.length
                  }
                </span>

              </div>


              <div className="designation-details__permission-list">

                {modulePermissions.map(
                  (permission) => (

                    <div
                      className="designation-details__permission"
                      key={`${permission.module}-${permission.action}`}
                    >

                      <span className="designation-details__permission-check">
                        ✓
                      </span>

                      <span className="designation-details__permission-name">
                        {permission.label}
                      </span>

                      {permission.scope && (
                        <span className="designation-details__permission-scope">
                          {getScopeLabel(
                            permission.scope,
                          )}
                        </span>
                      )}

                    </div>

                  ),
                )}

              </div>

            </div>

          ),
        )}

      </div>

    )}

  </div>


  {/* =====================================================
      Footer
      ===================================================== */}

  <div className="designation-details__footer">

    <Button
      type="button"
      variant="secondary"
      onClick={onClose}
    >
      Close
    </Button>


    <Button
      type="button"
      variant="primary"
      onClick={() =>
        onEdit?.(designation)
      }
    >
      Edit Designation
    </Button>

  </div>

</div>


);
};

export default DesignationDetails;
