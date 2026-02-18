import { useState } from 'react';
import { ResourceShareData, TouchpointData } from '../../types';

interface Props {
  onSave: (data: TouchpointData) => void;
  onCancel: () => void;
  initial?: ResourceShareData;
}

export default function ResourceShareForm({ onSave, onCancel, initial }: Props) {
  const [resourceTitle, setResourceTitle] = useState(initial?.resourceTitle || '');
  const [resourceLink, setResourceLink] = useState(initial?.resourceLink || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  function handleSave() {
    onSave({
      resourceTitle,
      resourceLink: resourceLink.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">
          Resource Title <span className="form-required">*</span>
        </label>
        <input
          className="form-input"
          value={resourceTitle}
          onChange={e => setResourceTitle(e.target.value)}
          placeholder="e.g. CKLA Unit 3 Lesson Plans, Illustrative Math Teacher Guide..."
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label">Link / Location <span className="form-optional">(optional)</span></label>
        <input
          className="form-input"
          type="url"
          value={resourceLink}
          onChange={e => setResourceLink(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Notes <span className="form-optional">(optional)</span></label>
        <textarea
          className="form-textarea"
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Why did you share this? How does it connect to the teacher's goal?"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!resourceTitle.trim()}>
          Save Resource Share
        </button>
      </div>
    </div>
  );
}
