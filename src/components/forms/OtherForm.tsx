import { useState } from 'react';
import { OtherData, TouchpointData } from '../../types';

interface Props {
  onSave: (data: TouchpointData) => void;
  onCancel: () => void;
  initial?: OtherData;
}

export default function OtherForm({ onSave, onCancel, initial }: Props) {
  const [description, setDescription] = useState(initial?.description || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  function handleSave() {
    onSave({ description, notes: notes.trim() || undefined });
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">
          Description <span className="form-required">*</span>
        </label>
        <input
          className="form-input"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Briefly describe the type of touchpoint..."
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          className="form-textarea"
          rows={6}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="What happened? Key points, outcomes, follow-ups..."
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!description.trim()}>
          Save Touchpoint
        </button>
      </div>
    </div>
  );
}
