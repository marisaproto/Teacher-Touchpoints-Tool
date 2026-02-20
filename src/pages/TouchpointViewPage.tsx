import { useParams, Navigate, Link } from 'react-router-dom';
import { useApp } from '../context';
import Breadcrumb from '../components/Breadcrumb';
import {
  TOUCHPOINT_LABELS, TOUCHPOINT_COLORS,
  ObservationData, CoachingMeetingData, CheckInData,
  SummaryData, ResourceShareData, OtherData, TouchpointType
} from '../types';
import { exportTouchpointPdf } from '../utils/exportPdf';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="view-section">
      <h3 className="view-section-title">{title}</h3>
      {children}
    </div>
  );
}

function ObservationView({ data, type, schoolId, personId, touchpoints }: {
  data: ObservationData;
  type: TouchpointType;
  schoolId: string;
  personId: string;
  touchpoints: Array<{ id: string; type: TouchpointType; date: string; data: unknown }>;
}) {
  const linkedFeedback = touchpoints.filter(t =>
    t.type === 'coaching-meeting' &&
    (t.data as CoachingMeetingData).relatedObservationId === undefined
  );
  return (
    <div>
      <Section title="Instructional Goal">
        <p className="view-text view-text--goal">{data.instructionalGoal}</p>
        {data.subject && <p className="view-label">Subject: <strong>{data.subject}</strong></p>}
      </Section>
      <Section title="Running Record">
        <div className="running-record-view">
          <div className="rr-view-header">
            <span className="rr-view-min">Min</span>
            <span className="rr-view-notes">Observations</span>
          </div>
          {data.runningRecord.map((entry, i) => (
            <div key={i} className="rr-view-row">
              <span className="rr-view-min-val">{entry.minute}</span>
              <span className="rr-view-notes-val">{entry.notes || <em className="view-empty">No notes</em>}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function CoachingView({ data }: { data: CoachingMeetingData }) {
  return (
    <div>
      <div className="feedback-view-grid">
        <Section title="Glows">
          {data.glows.length === 0
            ? <p className="view-empty">None recorded</p>
            : <ul className="feedback-list feedback-list--glow">
                {data.glows.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
          }
        </Section>
        <Section title="Grows">
          {data.grows.length === 0
            ? <p className="view-empty">None recorded</p>
            : <ul className="feedback-list feedback-list--grow">
                {data.grows.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
          }
        </Section>
        <Section title="Questions for Consideration">
          {data.questionsForConsideration.length === 0
            ? <p className="view-empty">None recorded</p>
            : <ul className="feedback-list feedback-list--question">
                {data.questionsForConsideration.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
          }
        </Section>
      </div>
      {data.nextSteps && (
        <Section title="Next Steps">
          <p className="view-text">{data.nextSteps}</p>
        </Section>
      )}
    </div>
  );
}

function CheckInView({ data }: { data: CheckInData }) {
  return (
    <div>
      <Section title="Objective">
        <p className="view-text">{data.objective}</p>
      </Section>
      {data.unit && (
        <Section title="Unit / Context">
          <p className="view-text">{data.unit}</p>
        </Section>
      )}
      <Section title="Previous Feedback">
        <p className="view-text">{data.previousFeedbackReviewed ? '✅ Reviewed previous coaching feedback' : '☐ Previous feedback not reviewed'}</p>
      </Section>
      {data.notes && (
        <Section title="Notes">
          <p className="view-text view-text--pre">{data.notes}</p>
        </Section>
      )}
    </div>
  );
}

function SummaryView({ data }: { data: SummaryData }) {
  return (
    <div>
      {data.title && (
        <Section title="Title / Agenda">
          <p className="view-text">{data.title}</p>
        </Section>
      )}
      <Section title="Summary">
        <p className="view-text view-text--pre">{data.summary}</p>
      </Section>
    </div>
  );
}

function ResourceView({ data }: { data: ResourceShareData }) {
  return (
    <div>
      <Section title="Resource">
        <p className="view-text view-text--large">{data.resourceTitle}</p>
        {data.resourceLink && (
          <a href={data.resourceLink} target="_blank" rel="noopener noreferrer" className="view-link">
            {data.resourceLink}
          </a>
        )}
      </Section>
      {data.notes && (
        <Section title="Notes">
          <p className="view-text view-text--pre">{data.notes}</p>
        </Section>
      )}
    </div>
  );
}

function OtherView({ data }: { data: OtherData }) {
  return (
    <div>
      <Section title="Description">
        <p className="view-text view-text--large">{data.description}</p>
      </Section>
      {data.notes && (
        <Section title="Notes">
          <p className="view-text view-text--pre">{data.notes}</p>
        </Section>
      )}
    </div>
  );
}

export default function TouchpointViewPage() {
  const { schoolId, personId, touchpointId } = useParams<{
    schoolId: string; personId: string; touchpointId: string;
  }>();
  const { state, dispatch } = useApp();

  const school = state.schools.find(s => s.id === schoolId);
  const person = state.people.find(p => p.id === personId);
  const touchpoint = state.touchpoints.find(t => t.id === touchpointId);

  if (!school || !person || !touchpoint) return <Navigate to="/" />;

  const personTouchpoints = state.touchpoints.filter(t => t.personId === personId);

  const relatedObsId = touchpoint.type === 'coaching-meeting'
    ? (touchpoint.data as CoachingMeetingData).relatedObservationId
    : undefined;
  const relatedObs = relatedObsId ? state.touchpoints.find(t => t.id === relatedObsId) : null;

  function handleExportPdf() {
    exportTouchpointPdf(touchpoint!, person!, school!, relatedObs);
  }

  return (
    <div className="page">
      <Breadcrumb crumbs={[
        { label: 'Schools', to: '/' },
        { label: school.name, to: `/school/${school.id}` },
        { label: person.name, to: `/school/${school.id}/person/${person.id}` },
        { label: TOUCHPOINT_LABELS[touchpoint.type] },
      ]} />

      <div className="view-header">
        <div className="view-header-left">
          <span
            className="touchpoint-badge touchpoint-badge--lg"
            style={{ background: TOUCHPOINT_COLORS[touchpoint.type] }}
          >
            {TOUCHPOINT_LABELS[touchpoint.type]}
          </span>
          <h1 className="page-title">
            {new Date(touchpoint.date).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            })}
          </h1>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary btn-export" onClick={handleExportPdf} title="Export as PDF">
            ↓ Export PDF
          </button>
          <Link
            to={`/school/${school.id}/person/${person.id}`}
            className="btn btn-secondary"
          >
            ← Back
          </Link>
        </div>
      </div>

      {relatedObs && (
        <div className="related-obs-banner">
          <span>Linked to observation:</span>
          <Link to={`/school/${school.id}/person/${person.id}/touchpoint/${relatedObs.id}`} className="related-obs-link">
            {new Date(relatedObs.date).toLocaleDateString()} — {(relatedObs.data as ObservationData).instructionalGoal?.slice(0, 80)}
          </Link>
        </div>
      )}

      <div className="view-card">
        {touchpoint.type === 'observation' && (
          <ObservationView
            data={touchpoint.data as ObservationData}
            type={touchpoint.type}
            schoolId={schoolId!}
            personId={personId!}
            touchpoints={personTouchpoints as Array<{ id: string; type: TouchpointType; date: string; data: unknown }>}
          />
        )}
        {touchpoint.type === 'coaching-meeting' && (
          <CoachingView data={touchpoint.data as CoachingMeetingData} />
        )}
        {touchpoint.type === 'check-in' && (
          <CheckInView data={touchpoint.data as CheckInData} />
        )}
        {(touchpoint.type === 'dept-meeting' || touchpoint.type === 'progress-update') && (
          <SummaryView data={touchpoint.data as SummaryData} />
        )}
        {touchpoint.type === 'resource-share' && (
          <ResourceView data={touchpoint.data as ResourceShareData} />
        )}
        {touchpoint.type === 'other' && (
          <OtherView data={touchpoint.data as OtherData} />
        )}
      </div>
    </div>
  );
}
