import { useState } from "react";
import { Clock3, Edit3, MoreVertical, Plus, Trash2 } from "lucide-react";

import ShiftForm from "../ShiftForm/ShiftForm";

import {
  createShift,
  updateShift,
  deleteShift,
} from "../../../services/api/workScheduleAPI";

import "./ShiftList.css";

function ShiftList({ shifts, onChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = () => {
    setEditingShift(null);
    setShowForm(true);
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setShowForm(true);
    setMenuId(null);
  };

  const handleDelete = async (shiftId) => {
    const confirmed = window.confirm(
      "Delete this shift? Days using this shift will become unassigned.",
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      await deleteShift(shiftId);

      onChange(shifts.filter((shift) => shift.id !== shiftId));
      setMenuId(null);
    } catch (error) {
      console.error("Failed to delete shift:", error);

      window.alert(
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
      } else {
        const response = await createShift(payload);

        const createdShift = normalizeShift(
          response?.data?.data || response?.data,
        );

        if (!createdShift?.id) {
          throw new Error("Created shift response has no ID.");
        }

        onChange([...shifts, createdShift]);
      }

      setShowForm(false);
      setEditingShift(null);
    } catch (error) {
      console.error("Failed to save shift:", error);

      window.alert(
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
                    <button
                      className="shift-menu-button"
                      onClick={() =>
                        setMenuId(menuId === shift.id ? null : shift.id)
                      }
                      disabled={saving}
                    >
                      <MoreVertical size={17} />
                    </button>

                    {menuId === shift.id && (
                      <div className="shift-menu">
                        <button onClick={() => handleEdit(shift)}>
                          <Edit3 size={14} />
                          Edit
                        </button>

                        <button
                          className="danger"
                          onClick={() => handleDelete(shift.id)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
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
