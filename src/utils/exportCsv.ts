import {
  Person, School, Touchpoint, TouchpointType,
  ObservationData, CoachingMeetingData, CheckInData,
  SummaryData, ResourceShareData, OtherData,
  TOUCHPOINT_LABELS,
} from '../types';

function escCsv(val: unknown): string {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function row(...cells: unknown[]): string {
  return cells.map(escCsv).join(',');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTouchpointDetails(type: TouchpointType, data: any): Record<string, string> {
  const d = data;
  switch (type) {
    case 'observation': {
      const obs = d as ObservationData;
      const rrText = obs.runningRecord
        .map(e => `Min ${e.minute}: ${e.notes}`)
        .join(' | ');
      return {
        'Instructional Goal': obs.instructionalGoal ?? '',
        'Subject': obs.subject ?? '',
        'Running Record': rrText,
      };
    }
    case 'coaching-meeting': {
      const cm = d as CoachingMeetingData;
      return {
        'Glows': cm.glows.join(' | '),
        'Grows': cm.grows.join(' | '),
        'Questions for Consideration': cm.questionsForConsideration.join(' | '),
        'Next Steps': cm.nextSteps ?? '',
      };
    }
    case 'check-in': {
      const ci = d as CheckInData;
      return {
        'Objective': ci.objective,
        'Unit': ci.unit ?? '',
        'Previous Feedback Reviewed': ci.previousFeedbackReviewed ? 'Yes' : 'No',
        'Notes': ci.notes,
      };
    }
    case 'dept-meeting':
    case 'progress-update': {
      const s = d as SummaryData;
      return { 'Title': s.title ?? '', 'Summary': s.summary };
    }
    case 'resource-share': {
      const rs = d as ResourceShareData;
      return { 'Resource Title': rs.resourceTitle, 'Link': rs.resourceLink ?? '', 'Notes': rs.notes ?? '' };
    }
    case 'other': {
      const o = d as OtherData;
      return { 'Description': o.description, 'Notes': o.notes ?? '' };
    }
    default: return {};
  }
}

/** Export all touchpoints for a single person as CSV */
export function exportPersonCsv(
  person: Person,
  school: School,
  touchpoints: Touchpoint[]
): void {
  const sorted = [...touchpoints].sort((a, b) => b.date.localeCompare(a.date));

  // Collect all detail keys so we can build consistent columns
  const detailKeys = new Set<string>();
  sorted.forEach(tp => {
    Object.keys(getTouchpointDetails(tp.type, tp.data)).forEach(k => detailKeys.add(k));
  });
  const detailCols = Array.from(detailKeys);

  const headers = [
    'Date', 'Type', 'School', 'Person', 'Role',
    'Department', 'Grade Level', 'Coaching Goal',
    ...detailCols,
  ];

  const lines: string[] = [headers.join(',')];

  for (const tp of sorted) {
    const details = getTouchpointDetails(tp.type, tp.data);
    lines.push(row(
      tp.date,
      TOUCHPOINT_LABELS[tp.type],
      school.name,
      person.name,
      person.role,
      person.department ?? '',
      person.gradeLevel ?? '',
      person.goal ?? '',
      ...detailCols.map(k => details[k] ?? ''),
    ));
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `touchpoints-${person.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export ALL touchpoints across all people in a school */
export function exportSchoolCsv(
  school: School,
  people: Person[],
  touchpoints: Touchpoint[]
): void {
  const schoolTouchpoints = touchpoints.filter(t => t.schoolId === school.id);
  const sorted = [...schoolTouchpoints].sort((a, b) => b.date.localeCompare(a.date));

  const detailKeys = new Set<string>();
  sorted.forEach(tp => {
    Object.keys(getTouchpointDetails(tp.type, tp.data)).forEach(k => detailKeys.add(k));
  });
  const detailCols = Array.from(detailKeys);

  const headers = [
    'Date', 'Type', 'Person', 'Role', 'Department', 'Grade Level', 'Coaching Goal',
    ...detailCols,
  ];

  const lines: string[] = [headers.join(',')];
  const personMap = new Map(people.map(p => [p.id, p]));

  for (const tp of sorted) {
    const person = personMap.get(tp.personId);
    if (!person) continue;
    const details = getTouchpointDetails(tp.type, tp.data);
    lines.push(row(
      tp.date,
      TOUCHPOINT_LABELS[tp.type],
      person.name,
      person.role,
      person.department ?? '',
      person.gradeLevel ?? '',
      person.goal ?? '',
      ...detailCols.map(k => details[k] ?? ''),
    ));
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `touchpoints-${school.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
