import { useState } from 'react';
import { CheckInData, TouchpointData } from '../../types';

interface Props {
  onSave: (data: TouchpointData) => void;
  onCancel: () => void;
  initial?: CheckInData;
}

export default function CheckInForm({ onSave, onCancel, initial }: Props) {
  const [objective, setObjective] = useState(initial?.objective || '');
  const [unit, setUnit] = useState(initial?.unit || '');
  const [previousFeedbackReviewed, setPreviousFeedbackReviewed] = useState(initial?.previousFeedbackReviewed ?? false);
  const [notes, setNotes] = useState(initial?.notes || '');

  function handleSave() {
    onSave({ objective, unit: unit.trim() || undefined, previousFeedbackReviewed, notes });
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">
          Objective <span className="form-required">*</span>
        </label>
        <input
          className="form-input"
          value={objective}
          onChange={e => setObjective(e.target.value)}
          placeholder="e.g. Plan for next week, Review unit data, Reflect on recent lesson..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Unit / Context <span className="form-optional">(optional)</span></label>
          <input
            className="form-input"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            placeholder="e.g. Unit 3: Fractions"
          />
        </div>
        <div className="form-group form-group--checkbox-group">
          <label className="form-label">Previous Feedback</label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={previousFeedbackReviewed}
              onChange={e => setPreviousFeedbackReviewed(e.target.checked)}
            />
            <span>Reviewed previous coaching feedback</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes / Summary</label>
        <textarea
          className="form-textarea"
          rows={5}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="What was discussed? Any decisions made or plans developed?"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!objective.trim()}>
          Save Check-In
        </button>
      </div>
    </div>
  );
}
