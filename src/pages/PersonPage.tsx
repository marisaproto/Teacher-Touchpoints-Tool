import { useRef } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useApp, uid } from '../context';
import Breadcrumb from '../components/Breadcrumb';
import { TOUCHPOINT_LABELS, TOUCHPOINT_COLORS, TouchpointType } from '../types';
import { exportPersonCsv } from '../utils/exportCsv';
import { parseTouchpointCsv } from '../utils/importCsv';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const school = state.schools.find(s => s.id === schoolId);
  const person = state.people.find(p => p.id === personId);

  if (!school || !person) return <Navigate to="/" />;

  const touchpoints = state.touchpoints
    .filter(t => t.personId === personId)
    .sort((a, b) => b.date.localeCompare(a.date));

  function handleDelete(id: string) {
    if (confirm('Delete this touchpoint?')) dispatch({ type: 'DELETE_TOUCHPOINT', payload: id });
  }

  function handleExportCsv() {
    exportPersonCsv(person!, school!, touchpoints);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected if needed
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors } = parseTouchpointCsv(text);

      // Filter to rows for this person (case-insensitive)
      const personRows = rows.filter(
        r => r.personName.trim().toLowerCase() === person!.name.trim().toLowerCase()
      );

      if (personRows.length === 0) {
        const msg = errors.length > 0
          ? `No touchpoints found for "${person!.name}" in this file.\n\nErrors:\n${errors.join('\n')}`
          : `No touchpoints found for "${person!.name}" in this file. Make sure the Person column matches exactly.`;
        alert(msg);
        return;
      }

      const confirmMsg = [
        `Found ${personRows.length} touchpoint${personRows.length !== 1 ? 's' : ''} for ${person!.name}.`,
        errors.length > 0 ? `\n${errors.length} row${errors.length !== 1 ? 's' : ''} were skipped due to errors.` : '',
        '\nImport them now?',
      ].join('');

      if (!confirm(confirmMsg)) return;

      for (const row of personRows) {
        dispatch({
          type: 'ADD_TOUCHPOINT',
          payload: {
            id: uid(),
            personId: person!.id,
            schoolId: school!.id,
            date: row.date,
            type: row.type,
            data: row.data,
          },
        });
      }
    };
    reader.readAsText(file);
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
        <div className="page-header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button className="btn btn-secondary btn-export" onClick={handleImportClick} title="Import touchpoints from CSV">
            ↑ Import CSV
          </button>
          {touchpoints.length > 0 && (
            <button className="btn btn-secondary btn-export" onClick={handleExportCsv} title="Export to CSV">
              ↓ Export CSV
            </button>
          )}
          <Link
            to={`/school/${school.id}/person/${person.id}/touchpoint/new`}
            className="btn btn-primary"
          >
            + Log Touchpoint
          </Link>
        </div>
      </div>

      {person.goal && (
        <div className="goal-banner">
          <span className="goal-banner-label">Coaching Goal</span>
          <span className="goal-banner-text">{person.goal}</span>
        </div>
      )}

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
