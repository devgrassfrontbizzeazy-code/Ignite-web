import { Camera, MapPin } from "lucide-react";
import { useState } from "react";

import Button from "../../../common/Button/Button";
import "./VisitCheckOut.css";

const VisitCheckout = ({
  visit,
  onComplete,
  onCancel,
}) => {
  const [outcome, setOutcome] =
    useState("FOLLOW_UP");

  const [description, setDescription] =
    useState("");

  const [photo, setPhoto] =
    useState(null);

  const handleSubmit = () => {
    onComplete?.({
      outcome,
      description,
      photo,
    });
  };

  return (
    <div className="visit-checkout">
      <div className="visit-checkout__lead">
        <div className="visit-checkout__icon">
          <MapPin size={18} />
        </div>

        <div>
          <span>COMPLETE VISIT</span>
          <h3>{visit.companyName}</h3>
          <p>{visit.leadName}</p>
        </div>
      </div>

      <div className="visit-checkout__field">
        <label>Meeting Outcome</label>

        <div className="visit-checkout__outcomes">
          {[
            ["FOLLOW_UP", "Follow-up"],
            ["DEAL_WON", "Deal Won"],
            ["LOST", "Lost"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                outcome === value
                  ? "visit-checkout__outcome active"
                  : "visit-checkout__outcome"
              }
              onClick={() =>
                setOutcome(value)
              }
            >
              <span />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="visit-checkout__field">
        <label htmlFor="visit-description">
          Meeting Description
        </label>

        <textarea
          id="visit-description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Add notes about the meeting..."
          rows={5}
        />
      </div>

      <div className="visit-checkout__field">
        <label>Meeting Photo</label>

        <label className="visit-checkout__photo">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) =>
              setPhoto(
                event.target.files?.[0] || null
              )
            }
          />

          <Camera size={22} />

          <strong>
            {photo
              ? photo.name
              : "Add meeting photo"}
          </strong>

          <span>
            A photo is required to complete the visit.
          </span>
        </label>
      </div>

      <div className="visit-checkout__actions">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          disabled={!photo}
          onClick={handleSubmit}
        >
          Complete Visit
        </Button>
      </div>
    </div>
  );
};

export default VisitCheckout;