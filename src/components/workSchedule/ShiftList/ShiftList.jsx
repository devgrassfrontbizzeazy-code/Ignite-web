import { useState } from "react";
import {
  Clock3,
  Edit3,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";

import ShiftForm from "../ShiftForm/ShiftForm";

import "./ShiftList.css";

function ShiftList({ shifts, onChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [menuId, setMenuId] = useState(null);

  const handleAdd = () => {
    setEditingShift(null);
    setShowForm(true);
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setShowForm(true);
    setMenuId(null);
  };

  const handleDelete = (shiftId) => {
    const confirmed = window.confirm(
      "Delete this shift? Days using this shift will become unassigned."
    );

    if (!confirmed) return;

    onChange(shifts.filter((shift) => shift.id !== shiftId));
    setMenuId(null);
  };

  const handleSaveShift = (shiftData) => {
    if (editingShift) {
      onChange(
        shifts.map((shift) =>
          shift.id === editingShift.id
            ? { ...shiftData, id: editingShift.id }
            : shift
        )
      );
    } else {
      onChange([
        ...shifts,
        {
          ...shiftData,
          id: `shift-${Date.now()}`,
        },
      ]);
    }

    setShowForm(false);
    setEditingShift(null);
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
              <p>
                Create a reusable shift before assigning working days.
              </p>
            </div>

            <button className="add-shift-button" onClick={handleAdd}>
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
                        <span className="overnight-badge">
                          Overnight
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shift-time">
                    {shift.start_time} – {shift.end_time}
                    {shift.overnight && (
                      <small>Next day</small>
                    )}
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
                        setMenuId(
                          menuId === shift.id ? null : shift.id
                        )
                      }
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
              <button className="add-shift-button" onClick={handleAdd}>
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
            setShowForm(false);
            setEditingShift(null);
          }}
        />
      )}
    </>
  );
}

export default ShiftList;