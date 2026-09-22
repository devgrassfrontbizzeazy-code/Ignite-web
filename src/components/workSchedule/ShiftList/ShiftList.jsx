import { useState } from "react";
import { Clock3, Plus } from "lucide-react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import RowActions from "../../common/RowActions/RowActions";
import ShiftForm from "../ShiftForm/ShiftForm";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal";
import { useNotification } from "../../../context/NotificationContext";

import {
  createShift,
  updateShift,
  deleteShift,
} from "../../../services/api/workScheduleAPI";

import "./ShiftList.css";

function ShiftList({ shifts, onChange }) {
  const { notify } = useNotification();
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    shiftId: null,
    shiftName: "",
    loading: false,
  });

  const handleAdd = () => {
    setEditingShift(null);
    setShowForm(true);
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setShowForm(true);
  };

  const handleDeleteClick = (shift) => {
    setDeleteModal({
      open: true,
      shiftId: shift.id,
      shiftName: shift.name,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { shiftId, shiftName } = deleteModal;
    if (!shiftId) return;

    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      setSaving(true);

      await deleteShift(shiftId);

      onChange(shifts.filter((shift) => shift.id !== shiftId));
      setDeleteModal({ open: false, shiftId: null, shiftName: "", loading: false });
      notify.success(`Shift "${shiftName}" deleted successfully.`);
    } catch (error) {
      console.error("Failed to delete shift:", error);

      setDeleteModal((prev) => ({ ...prev, loading: false }));
      notify.error(
        error?.response?.data?.detail ||
          "Unable to delete this shift. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveShift = async (shiftData) => {
    try {
      setSaving(true);

      const payload = {
        name: shiftData.name.trim(),
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        is_overnight: Boolean(shiftData.overnight),
        break_duration_minutes: Number(shiftData.break_minutes) || 0,
      };

      if (editingShift) {
        const response = await updateShift(editingShift.id, payload);

        const updatedShift = normalizeShift(
          response?.data?.data || response?.data,
        );

        onChange(
          shifts.map((shift) =>
            shift.id === editingShift.id ? updatedShift : shift,
          ),
        );
        notify.success("Shift updated successfully.");
      } else {
        const response = await createShift(payload);

        const createdShift = normalizeShift(
          response?.data?.data || response?.data,
        );

        if (!createdShift?.id) {
          throw new Error("Created shift response has no ID.");
        }

        onChange([...shifts, createdShift]);
        notify.success("Shift created successfully.");
      }

      setShowForm(false);
      setEditingShift(null);
    } catch (error) {
      console.error("Failed to save shift:", error);

      notify.error(
        error?.response?.data?.detail ||
          "Unable to save the shift. Please check the details and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="shift-list-card">
        {shifts.length === 0 ? (
          <div className="shift-empty-state">
            <div className="shift-empty-icon">
              <Clock3 size={21} />
            </div>

            <div>
              <h3>No shifts defined</h3>
              <p>Create a reusable shift before assigning working days.</p>
            </div>

            <button
              className="add-shift-button"
              onClick={handleAdd}
              disabled={saving}
            >
              <Plus size={16} />
              Add Shift
            </button>
          </div>
        ) : (
          <>
            <div className="shift-table-header">
              <span>Shift</span>
              <span>Working Hours</span>
              <span>Break</span>
              <span />
            </div>

            <div className="shift-list">
              {shifts.map((shift) => (
                <div className="shift-row" key={shift.id}>
                  <div className="shift-name-cell">
                    <div className="shift-icon">
                      <Clock3 size={17} />
                    </div>

                    <div>
                      <strong>{shift.name}</strong>

                      {shift.overnight && (
                        <span className="overnight-badge">Overnight</span>
                      )}
                    </div>
                  </div>

                  <div className="shift-time">
                    {shift.start_time} – {shift.end_time}
                    {shift.overnight && <small>Next day</small>}
                  </div>

                  <div className="shift-break">
                    {shift.break_minutes
                      ? `${shift.break_minutes} min`
                      : "No break"}
                  </div>

                  <div className="shift-actions">
                    <RowActions
                      actions={[
                        {
                          key: "edit",
                          label: "Edit",
                          icon: FiEdit2,
                          onClick: () => handleEdit(shift),
                        },
                        { key: "divider-1", isDivider: true },
                        {
                          key: "delete",
                          label: "Delete",
                          icon: FiTrash2,
                          isDanger: true,
                          onClick: () => handleDeleteClick(shift),
                        },
                      ]}
                      title={`Actions for ${shift.name}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="shift-list-footer">
              <button
                className="add-shift-button"
                onClick={handleAdd}
                disabled={saving}
              >
                <Plus size={16} />
                Add Shift
              </button>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <ShiftForm
          shift={editingShift}
          onSave={handleSaveShift}
          onClose={() => {
            if (saving) return;

            setShowForm(false);
            setEditingShift(null);
          }}
        />
      )}

      {deleteModal.open && (
        <ConfirmModal
          open={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, shiftId: null, shiftName: "", loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete Shift?"
          itemName={deleteModal.shiftName}
          description={`Are you sure you want to delete "${deleteModal.shiftName}"? Days using this shift will become unassigned.`}
          confirmText="Delete"
          loading={deleteModal.loading}
        />
      )}
    </>
  );
}

function normalizeShift(shift) {
  if (!shift) return null;

  return {
    ...shift,

    start_time: shift.start_time ?? shift.startTime ?? "",

    end_time: shift.end_time ?? shift.endTime ?? "",

    overnight:
      shift.overnight ?? shift.is_overnight ?? shift.isOvernight ?? false,

    break_minutes:
      shift.break_minutes ??
      shift.break_duration_minutes ??
      shift.breakDurationMinutes ??
      0,
  };
}

export default ShiftList;
