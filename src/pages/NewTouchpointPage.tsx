import { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useApp, uid } from '../context';
import Breadcrumb from '../components/Breadcrumb';
import ObservationForm from '../components/forms/ObservationForm';
import CoachingMeetingForm from '../components/forms/CoachingMeetingForm';
import CheckInForm from '../components/forms/CheckInForm';
import SummaryForm from '../components/forms/SummaryForm';
import ResourceShareForm from '../components/forms/ResourceShareForm';
import OtherForm from '../components/forms/OtherForm';
import { TouchpointType, TOUCHPOINT_LABELS, TOUCHPOINT_COLORS, TouchpointData } from '../types';

const TYPES: TouchpointType[] = [
  'observation', 'coaching-meeting', 'check-in', 'resource-share', 'dept-meeting', 'progress-update', 'other'
];

export default function NewTouchpointPage() {
  const { schoolId, personId } = useParams<{ schoolId: string; personId: string }>();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const school = state.schools.find(s => s.id === schoolId);
  const person = state.people.find(p => p.id === personId);

  const [type, setType] = useState<TouchpointType>('observation');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  if (!school || !person) return <Navigate to="/" />;

  function handleSave(data: TouchpointData) {
    dispatch({
      type: 'ADD_TOUCHPOINT',
      payload: { id: uid(), personId: person!.id, schoolId: school!.id, date, type, data },
    });
    navigate(`/school/${school!.id}/person/${person!.id}`);
  }

  function handleCancel() {
    navigate(`/school/${school!.id}/person/${person!.id}`);
  }

  const observations = state.touchpoints.filter(t => t.personId === personId && t.type === 'observation');

  return (
    <div className="page">
      <Breadcrumb crumbs={[
        { label: 'Schools', to: '/' },
        { label: school.name, to: `/school/${school.id}` },
        { label: person.name, to: `/school/${school.id}/person/${person.id}` },
        { label: 'New Touchpoint' },
      ]} />

      <div className="page-header">
        <h1 className="page-title">Log Touchpoint</h1>
        <p className="page-subtitle">for {person.name}</p>
      </div>

      <div className="form-card">
        {/* Type selector */}
        <div className="form-group">
          <label className="form-label">Type</label>
          <div className="type-selector">
            {TYPES.map(t => (
              <button
                key={t}
                type="button"
                className={`type-btn ${type === t ? 'type-btn--active' : ''}`}
                style={type === t ? { background: TOUCHPOINT_COLORS[t], borderColor: TOUCHPOINT_COLORS[t] } : {}}
                onClick={() => setType(t)}
              >
                {TOUCHPOINT_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="form-group form-group--inline">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input form-input--date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <hr className="form-divider" />

        {/* Type-specific form */}
        {type === 'observation' && <ObservationForm onSave={handleSave} onCancel={handleCancel} />}
        {type === 'coaching-meeting' && <CoachingMeetingForm onSave={handleSave} onCancel={handleCancel} observations={observations} />}
        {type === 'check-in' && <CheckInForm onSave={handleSave} onCancel={handleCancel} />}
        {(type === 'dept-meeting' || type === 'progress-update') && <SummaryForm onSave={handleSave} onCancel={handleCancel} type={type} />}
        {type === 'resource-share' && <ResourceShareForm onSave={handleSave} onCancel={handleCancel} />}
        {type === 'other' && <OtherForm onSave={handleSave} onCancel={handleCancel} />}
      </div>
    </div>
  );
}
