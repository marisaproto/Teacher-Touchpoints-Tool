import { useState } from 'react';
import { SummaryData, TouchpointData, TouchpointType } from '../../types';

interface Props {
  onSave: (data: TouchpointData) => void;
  onCancel: () => void;
  type: 'dept-meeting' | 'progress-update';
  initial?: SummaryData;
}

const CONFIG = {
  'dept-meeting': {
    titlePlaceholder: 'e.g. October ELA Dept Meeting',
    summaryPlaceholder: 'What was discussed? Key decisions, action items, next steps...',
    saveLabel: 'Save Department Meeting',
  },
  'progress-update': {
    titlePlaceholder: 'e.g. Q1 Progress Review',
    summaryPlaceholder: 'Summary of progress discussed — data reviewed, goals addressed, outcomes...',
    saveLabel: 'Save Progress Update',
  },
};

export default function SummaryForm({ onSave, onCancel, type, initial }: Props) {
  const [title, setTitle] = useState(initial?.title || '');
  const [summary, setSummary] = useState(initial?.summary || '');
  const cfg = CONFIG[type as keyof typeof CONFIG];

  function handleSave() {
    onSave({ title: title.trim() || undefined, summary });
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">Title / Agenda <span className="form-optional">(optional)</span></label>
        <input
          className="form-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={cfg.titlePlaceholder}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Summary <span className="form-required">*</span>
        </label>
        <textarea
          className="form-textarea"
          rows={8}
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder={cfg.summaryPlaceholder}
          autoFocus
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!summary.trim()}>
          {cfg.saveLabel}
        </button>
      </div>
    </div>
  );
}
