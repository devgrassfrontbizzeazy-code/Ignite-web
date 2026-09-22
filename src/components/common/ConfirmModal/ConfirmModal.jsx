import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import "./ConfirmModal.css";

const ConfirmModal = ({
  open = false,
  onClose,
  onConfirm,
  title = "Confirm Action",
  itemName,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger", // 'danger' | 'primary'
  loading = false,
}) => {
  const handleConfirm = async (e) => {
    e?.preventDefault();
    if (loading) return;
    if (typeof onConfirm === "function") {
      await onConfirm();
    }
  };

  const defaultDescription = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : "Are you sure you want to proceed with this action? This action cannot be undone.";

  const finalDescription = description || defaultDescription;

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      size="small"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      footer={
        <div className="confirm-modal__footer">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="confirm-modal__body">
        <p className="confirm-modal__description">{finalDescription}</p>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
