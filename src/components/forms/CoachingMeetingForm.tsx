import { useState } from 'react';
import { CoachingMeetingData, TouchpointData, Touchpoint, ObservationData } from '../../types';

interface Props {
  onSave: (data: TouchpointData) => void;
  onCancel: () => void;
  observations: Touchpoint[];
  initial?: CoachingMeetingData;
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  color,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  color: string;
}) {
  function update(i: number, val: string) {
    onChange(items.map((item, idx) => idx === i ? val : item));
  }
  function add() { onChange([...items, '']); }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }

  return (
    <div className="list-editor">
      <div className="list-editor-label" style={{ borderLeftColor: color }}>
        <span style={{ color }}>{label}</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="list-editor-row">
          <div className="list-editor-bullet" style={{ background: color }} />
          <input
            className="form-input list-editor-input"
            value={item}
            onChange={e => update(i, e.target.value)}
            placeholder={placeholder}
          />
          <button type="button" className="btn-icon btn-icon--danger" onClick={() => remove(i)} title="Remove">✕</button>
        </div>
      ))}
      <button type="button" className="btn-text list-editor-add" onClick={add}>+ Add {label.slice(0, -1)}</button>
    </div>
  );
}

export default function CoachingMeetingForm({ onSave, onCancel, observations, initial }: Props) {
  const [relatedObservationId, setRelatedObservationId] = useState(initial?.relatedObservationId || '');
  const [glows, setGlows] = useState<string[]>(initial?.glows || ['']);
  const [grows, setGrows] = useState<string[]>(initial?.grows || ['']);
  const [questions, setQuestions] = useState<string[]>(initial?.questionsForConsideration || ['']);
  const [nextSteps, setNextSteps] = useState(initial?.nextSteps || '');

  const linkedObs = relatedObservationId
    ? observations.find(o => o.id === relatedObservationId)
    : null;

  function handleSave() {
    onSave({
      relatedObservationId: relatedObservationId || undefined,
      glows: glows.filter(g => g.trim()),
      grows: grows.filter(g => g.trim()),
      questionsForConsideration: questions.filter(q => q.trim()),
      nextSteps: nextSteps.trim() || undefined,
    });
  }

  const canSave = glows.some(g => g.trim()) || grows.some(g => g.trim());

  return (
    <div>
      {observations.length > 0 && (
        <div className="form-group">
          <label className="form-label">Related Observation <span className="form-optional">(optional)</span></label>
          <select
            className="form-select"
            value={relatedObservationId}
            onChange={e => setRelatedObservationId(e.target.value)}
          >
            <option value="">— Not linked to an observation —</option>
            {observations.map(obs => (
              <option key={obs.id} value={obs.id}>
                {new Date(obs.date).toLocaleDateString()} — {(obs.data as ObservationData).instructionalGoal?.slice(0, 60)}
              </option>
            ))}
          </select>
          {linkedObs && (
            <div className="linked-obs-preview">
              <span className="linked-obs-label">Goal:</span>
              <span>{(linkedObs.data as ObservationData).instructionalGoal}</span>
            </div>
          )}
        </div>
      )}

      <div className="feedback-grid">
        <ListEditor
          label="Glows"
          items={glows}
          onChange={setGlows}
          placeholder="Strength to highlight..."
          color="#38a169"
        />
        <ListEditor
          label="Grows"
          items={grows}
          onChange={setGrows}
          placeholder="Area to develop..."
          color="#dd6b20"
        />
        <ListEditor
          label="Questions for Consideration"
          items={questions}
          onChange={setQuestions}
          placeholder="Reflective question..."
          color="#805ad5"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Next Steps <span className="form-optional">(optional)</span></label>
        <textarea
          className="form-textarea"
          rows={2}
          value={nextSteps}
          onChange={e => setNextSteps(e.target.value)}
          placeholder="Agreed-upon next steps..."
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
          Save Coaching Meeting
        </button>
      </div>
    </div>
  );
}
