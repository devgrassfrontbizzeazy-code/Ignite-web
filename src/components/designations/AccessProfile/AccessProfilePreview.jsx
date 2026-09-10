
import {
  PERMISSION_CATALOGUE,
} from "../../../data/permissionCatalogue";

import {
  getAccessProfile,
  getAccessProfilePermissions,
  getScopeLabel,
} from "../../../data/accessProfiles";

const SELF_SERVICE_CAPABILITIES = [
  "View and edit own profile",
  "Check in / check out and view own attendance",
  "Submit attendance regularization requests",
  "View own leave balance and leave history",
  "Apply for leave and cancel pending leave",
  "View company holidays",
  "View own team and team lead",
];

const AccessProfilePreview = ({ profileKey, onClose }) => {
  const profile = getAccessProfile(profileKey);
  const permissions = getAccessProfilePermissions(profileKey);

  if (!profile) {
    return null;
  }

  const configuredPermissions = PERMISSION_CATALOGUE.flatMap(
    (module) => {
      const modulePermissions = permissions[module.key];

      if (!modulePermissions) {
        return [];
      }

      return Object.entries(modulePermissions)
        .filter(([, config]) => config?.enabled)
        .map(([action, config]) => ({
          module: module.name,
          action,
          label:
            module.actions[action]?.label ||
            action.charAt(0).toUpperCase() + action.slice(1),
          scope: config.scope,
        }));
    },
  );

  return (
    <div
      className="access-profile-preview__overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="access-profile-preview">
        {/* Header */}
        <div className="access-profile-preview__header">
          <div>
            <h3 className="access-profile-preview__title">
              {profile.name}
            </h3>

            <p className="access-profile-preview__description">
              {profile.description}
            </p>
          </div>

          <button
            type="button"
            className="access-profile-preview__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="access-profile-preview__body">
          {/* Built-in self-service */}
          <section className="access-profile-preview__section">
            <div className="access-profile-preview__section-header">
              <div>
                <h4>Built-in self-service</h4>
                <p>
                  Available automatically to every active
                  employee.
                </p>
              </div>

              <span className="access-profile-preview__badge">
                Always available
              </span>
            </div>

            <div className="access-profile-preview__self-service">
              {SELF_SERVICE_CAPABILITIES.map(
                (capability) => (
                  <div
                    key={capability}
                    className="access-profile-preview__self-service-item"
                  >
                    <span className="access-profile-preview__check">
                      ✓
                    </span>

                    <span>{capability}</span>
                  </div>
                ),
              )}
            </div>
          </section>

          {/* Elevated permissions */}
          <section className="access-profile-preview__section">
            <div className="access-profile-preview__section-header">
              <div>
                <h4>Additional permissions</h4>
                <p>
                  Permissions granted by this access profile.
                </p>
              </div>

              {configuredPermissions.length > 0 && (
                <span className="access-profile-preview__count">
                  {configuredPermissions.length}{" "}
                  permission
                  {configuredPermissions.length !== 1
                    ? "s"
                    : ""}
                </span>
              )}
            </div>

            {configuredPermissions.length === 0 ? (
              <div className="access-profile-preview__empty">
                <div className="access-profile-preview__empty-icon">
                  ✓
                </div>

                <h5>
                  No additional permissions
                </h5>

                <p>
                  This profile uses only the built-in
                  self-service permissions.
                </p>
              </div>
            ) : (
              <div className="access-profile-preview__permissions">
                {PERMISSION_CATALOGUE.map((module) => {
                  const modulePermissions =
                    permissions[module.key];

                  if (!modulePermissions) {
                    return null;
                  }

                  const moduleActions =
                    Object.entries(modulePermissions)
                      .filter(
                        ([, config]) =>
                          config?.enabled,
                      );

                  if (moduleActions.length === 0) {
                    return null;
                  }

                  return (
                    <div
                      key={module.key}
                      className="access-profile-preview__permission-group"
                    >
                      <div className="access-profile-preview__module">
                        <span>
                          {module.name}
                        </span>

                        <span className="access-profile-preview__module-count">
                          {moduleActions.length}
                        </span>
                      </div>

                      <div className="access-profile-preview__actions">
                        {moduleActions.map(
                          ([action, config]) => {
                            const actionConfig =
                              module.actions[action];

                            return (
                              <div
                                key={action}
                                className="access-profile-preview__action"
                              >
                                <div className="access-profile-preview__action-name">
                                  <span className="access-profile-preview__check">
                                    ✓
                                  </span>

                                  <span>
                                    {actionConfig?.label ||
                                      action}
                                  </span>
                                </div>

                                {config.scope && (
                                  <span className="access-profile-preview__scope">
                                    {getScopeLabel(
                                      config.scope,
                                    )}
                                  </span>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="access-profile-preview__footer">
          <span>
            Permissions shown are read-only for this profile.
          </span>

          <button
            type="button"
            className="access-profile-preview__done"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessProfilePreview;

