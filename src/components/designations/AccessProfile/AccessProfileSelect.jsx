import { useState } from "react";

import Select from "../../common/Select/Select";
import AccessProfilePreview from "./AccessProfilePreview";
import "./AccessProfile.css";

import {
  ACCESS_PROFILES,
  getAccessProfile,
} from "../../../data/accessProfiles";

const AccessProfileSelect = ({
  value = "employee",
  onChange,
  disabled = false,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const selectedProfile = getAccessProfile(value);

  const options = ACCESS_PROFILES.map((profile) => ({
    value: profile.key,
    label: profile.name,
  }));

  const handleChange = (profileKey) => {
    onChange?.(profileKey);
  };

  return (
    <div className="access-profile">
      <Select
        id="designation-access-profile"
        value={value}
        onChange={handleChange}
        options={options}
        placeholder="Select access profile"
        disabled={disabled}
      />

      {selectedProfile && (
        <div className="access-profile__summary">
          <div className="access-profile__summary-content">
            <span className="access-profile__summary-name">
              {selectedProfile.name}
            </span>

            <span className="access-profile__summary-description">
              {selectedProfile.description}
            </span>
          </div>

          <button
            type="button"
            className="access-profile__view-button"
            onClick={() => setShowPreview(true)}
            disabled={disabled}
          >
            View Permissions
          </button>
        </div>
      )}

      {showPreview && (
        <AccessProfilePreview
          profileKey={value}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default AccessProfileSelect;