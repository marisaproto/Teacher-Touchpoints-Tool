import { Link, useParams, Navigate } from 'react-router-dom';
import { useApp } from '../context';
import Breadcrumb from '../components/Breadcrumb';
import { TOUCHPOINT_LABELS, TOUCHPOINT_COLORS, TouchpointType } from '../types';

const TYPE_ORDER: TouchpointType[] = [
  'observation', 'coaching-meeting', 'check-in', 'resource-share', 'dept-meeting', 'progress-update', 'other'
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTouchpointSummary(type: TouchpointType, data: any): string {
  switch (type) {
    case 'observation': return (data.instructionalGoal as string) || '';
    case 'coaching-meeting': {
      const glows = (data.glows as string[]) || [];
      const grows = (data.grows as string[]) || [];
      return `${glows.length} glow${glows.length !== 1 ? 's' : ''}, ${grows.length} grow${grows.length !== 1 ? 's' : ''}`;
    }
    case 'check-in': return (data.objective as string) || '';
    case 'resource-share': return (data.resourceTitle as string) || '';
    case 'dept-meeting':
    case 'progress-update': return (data.summary as string)?.slice(0, 100) || '';
    case 'other': return (data.description as string)?.slice(0, 100) || '';
    default: return '';
  }
}

export default function PersonPage() {
  const { schoolId, personId } = useParams<{ schoolId: string; personId: string }>();
  const { state, dispatch } = useApp();

  const school = state.schools.find(s => s.id === schoolId);
  const person = state.people.find(p => p.id === personId);

  if (!school || !person) return <Navigate to="/" />;

  const touchpoints = state.touchpoints
    .filter(t => t.personId === personId)
    .sort((a, b) => b.date.localeCompare(a.date));

  function handleDelete(id: string) {
    if (confirm('Delete this touchpoint?')) dispatch({ type: 'DELETE_TOUCHPOINT', payload: id });
  }

  // Group by type for the summary strip
  const countByType = TYPE_ORDER.map(type => ({
    type,
    count: touchpoints.filter(t => t.type === type).length,
  })).filter(x => x.count > 0);

  return (
    <div className="page">
      <Breadcrumb crumbs={[
        { label: 'Schools', to: '/' },
        { label: school.name, to: `/school/${school.id}` },
        { label: person.name },
      ]} />

      <div className="page-header">
        <div>
          <h1 className="page-title">{person.name}</h1>
          <p className="page-subtitle">
            {[person.department, person.gradeLevel].filter(Boolean).join(' · ')}
            {(person.department || person.gradeLevel) ? ' · ' : ''}
            {touchpoints.length} touchpoint{touchpoints.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to={`/school/${school.id}/person/${person.id}/touchpoint/new`}
          className="btn btn-primary"
        >
          + Log Touchpoint
        </Link>
      </div>

      {countByType.length > 0 && (
        <div className="type-strip">
          {countByType.map(({ type, count }) => (
            <span
              key={type}
              className="type-chip"
              style={{ background: TOUCHPOINT_COLORS[type] + '22', color: TOUCHPOINT_COLORS[type], border: `1px solid ${TOUCHPOINT_COLORS[type]}44` }}
            >
              <span className="type-chip-count">{count}</span>
              {TOUCHPOINT_LABELS[type]}
            </span>
          ))}
        </div>
      )}

      {touchpoints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No touchpoints yet</h3>
          <p>Log your first coaching touchpoint with {person.name}.</p>
          <Link to={`/school/${school.id}/person/${person.id}/touchpoint/new`} className="btn btn-primary">
            Log First Touchpoint
          </Link>
        </div>
      ) : (
        <div className="timeline">
          {touchpoints.map(tp => (
            <div key={tp.id} className="timeline-item">
              <div
                className="timeline-dot"
                style={{ background: TOUCHPOINT_COLORS[tp.type] }}
              />
              <div className="timeline-card">
                <div className="timeline-card-header">
                  <span
                    className="touchpoint-badge"
                    style={{ background: TOUCHPOINT_COLORS[tp.type] }}
                  >
                    {TOUCHPOINT_LABELS[tp.type]}
                  </span>
                  <span className="timeline-date">
                    {new Date(tp.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div className="timeline-actions">
                    <Link
                      to={`/school/${school.id}/person/${person.id}/touchpoint/${tp.id}`}
                      className="btn-text"
                    >
                      View
                    </Link>
                    <button className="btn-icon btn-icon--danger" onClick={() => handleDelete(tp.id)} title="Delete">🗑️</button>
                  </div>
                </div>
                {getTouchpointSummary(tp.type, tp.data as any) && (
                  <p className="timeline-summary">{getTouchpointSummary(tp.type, tp.data as any)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
