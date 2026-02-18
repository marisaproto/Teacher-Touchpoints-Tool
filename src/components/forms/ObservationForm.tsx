import { useState } from 'react';
import { ObservationData, RunningRecordEntry, TouchpointData } from '../../types';

interface Props {
  onSave: (data: TouchpointData) => void;
  onCancel: () => void;
  initial?: ObservationData;
}

export default function ObservationForm({ onSave, onCancel, initial }: Props) {
  const [instructionalGoal, setInstructionalGoal] = useState(initial?.instructionalGoal || '');
  const [subject, setSubject] = useState(initial?.subject || '');
  const [runningRecord, setRunningRecord] = useState<RunningRecordEntry[]>(
    initial?.runningRecord || [{ minute: 1, notes: '' }]
  );

  function addEntry() {
    const nextMinute = runningRecord.length > 0
      ? Math.max(...runningRecord.map(r => r.minute)) + 1
      : 1;
    setRunningRecord(prev => [...prev, { minute: nextMinute, notes: '' }]);
  }

  function removeEntry(index: number) {
    setRunningRecord(prev => prev.filter((_, i) => i !== index));
  }

  function updateEntry(index: number, field: keyof RunningRecordEntry, value: string | number) {
    setRunningRecord(prev =>
      prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry)
    );
  }

  function handleSave() {
    onSave({ instructionalGoal, subject: subject || undefined, runningRecord });
  }

  const canSave = instructionalGoal.trim().length > 0;

  return (
    <div>
      <div className="form-row">
        <div className="form-group form-group--grow">
          <label className="form-label">
            Instructional Goal <span className="form-required">*</span>
          </label>
          <textarea
            className="form-textarea"
            rows={2}
            value={instructionalGoal}
            onChange={e => setInstructionalGoal(e.target.value)}
            placeholder="What is the teacher working toward in this lesson?"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Subject / Class <span className="form-optional">(optional)</span></label>
          <input
            className="form-input"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. ELA Block, Math"
          />
        </div>
      </div>

      <div className="section-header">
        <h3 className="section-title">Running Record</h3>
        <span className="section-sub">Minute-by-minute observations</span>
      </div>

      <div className="running-record">
        <div className="running-record-header">
          <span className="rr-col-min">Min</span>
          <span className="rr-col-notes">Observation Notes</span>
          <span className="rr-col-actions" />
        </div>

        {runningRecord.map((entry, i) => (
          <div key={i} className="running-record-row">
            <input
              type="number"
              className="form-input rr-min-input"
              value={entry.minute}
              min={0}
              onChange={e => updateEntry(i, 'minute', parseInt(e.target.value) || 0)}
            />
            <textarea
              className="form-textarea rr-notes-input"
              rows={2}
              value={entry.notes}
              onChange={e => updateEntry(i, 'notes', e.target.value)}
              placeholder="What is happening in the classroom?"
            />
            <button
              type="button"
              className="btn-icon btn-icon--danger"
              onClick={() => removeEntry(i)}
              disabled={runningRecord.length === 1}
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}

        <button type="button" className="btn btn-secondary btn--add-row" onClick={addEntry}>
          + Add Minute
        </button>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
          Save Observation
        </button>
      </div>
    </div>
  );
}
