import React, { useState } from "react";
import { MapPin, AlertTriangle, RefreshCw, ShieldAlert, CheckCircle2 } from "lucide-react";
import Modal from "../../../common/Modal/Modal";
import Button from "../../../common/Button/Button";
import "./LocationPermissionModal.css";

const LocationPermissionModal = ({
  open,
  onRequestPermission,
  isDenied = false,
}) => {
  const [requesting, setRequesting] = useState(false);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await onRequestPermission();
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Modal
      open={open}
      title=""
      onClose={() => {}} // Non-dismissible: mandatory
      className="location-modal-overlay"
    >
      <div className="location-permission-modal">
        <div className="location-permission-modal__icon-wrap">
          <div className="location-permission-modal__icon-pulse" />
          <MapPin size={38} className="location-permission-modal__icon" />
        </div>

        <h3 className="location-permission-modal__title">
          Live Location Access Required
        </h3>

        <p className="location-permission-modal__desc">
          Field Sales operations require active GPS tracking to log your client visits, verify check-ins, and keep your daily timeline synced with your manager.
        </p>

        {isDenied ? (
          <div className="location-permission-modal__denied-box">
            <div className="location-permission-modal__denied-header">
              <ShieldAlert size={18} />
              <strong>Permission Was Denied in Browser</strong>
            </div>
            <ol className="location-permission-modal__steps">
              <li>Click the <strong>Lock / Tune icon (🔒)</strong> on the left of your browser address bar.</li>
              <li>Set <strong>Location</strong> to <strong>Allow</strong>.</li>
              <li>Click the button below to reload and activate tracking.</li>
            </ol>
          </div>
        ) : (
          <div className="location-permission-modal__info-box">
            <div className="location-permission-modal__feature">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>Real-time visit proximity verification (within 100m)</span>
            </div>
            <div className="location-permission-modal__feature">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>Automatic daily journey timeline generation</span>
            </div>
          </div>
        )}

        <div className="location-permission-modal__actions">
          <Button
            variant="primary"
            onClick={handleRequest}
            disabled={requesting}
            className="location-permission-modal__btn"
          >
            {requesting ? (
              <span className="location-permission-modal__btn-inner">
                <RefreshCw size={16} className="animate-spin" />
                Checking GPS...
              </span>
            ) : isDenied ? (
              "I have enabled location — Retry"
            ) : (
              "Allow Location Access"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LocationPermissionModal;
