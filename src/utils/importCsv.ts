import {
  TouchpointType, TouchpointData, TOUCHPOINT_LABELS,
  ObservationData, CoachingMeetingData, CheckInData,
  SummaryData, ResourceShareData, OtherData,
} from '../types';

// Reverse map: human label → TouchpointType key
const LABEL_TO_TYPE: Record<string, TouchpointType> = Object.fromEntries(
  Object.entries(TOUCHPOINT_LABELS).map(([k, v]) => [v.toLowerCase(), k as TouchpointType])
);

function resolveType(label: string): TouchpointType | null {
  return LABEL_TO_TYPE[label.trim().toLowerCase()] ?? null;
}

/** Split a " | " delimited list back into an array, skipping empty entries */
function splitList(val: string): string[] {
  if (!val.trim()) return [];
  return val.split(' | ').map(s => s.trim()).filter(Boolean);
}

/** Parse "Min 1: notes | Min 2: notes" back to RunningRecordEntry[] */
function parseRunningRecord(val: string) {
  if (!val.trim()) return [];
  return val.split(' | ').map(chunk => {
    const m = chunk.trim().match(/^Min (\d+): (.*)$/);
    return m ? { minute: Number(m[1]), notes: m[2] } : { minute: 0, notes: chunk.trim() };
  });
}

function buildData(type: TouchpointType, row: Record<string, string>): TouchpointData {
  const g = (col: string) => (row[col] ?? '').trim();
  switch (type) {
    case 'observation':
      return {
        instructionalGoal: g('Instructional Goal'),
        subject: g('Subject') || undefined,
        runningRecord: parseRunningRecord(g('Running Record')),
      } as ObservationData;

    case 'coaching-meeting':
      return {
        glows: splitList(g('Glows')),
        grows: splitList(g('Grows')),
        questionsForConsideration: splitList(g('Questions for Consideration')),
        nextSteps: g('Next Steps') || undefined,
      } as CoachingMeetingData;

    case 'check-in':
      return {
        objective: g('Objective'),
        unit: g('Unit') || undefined,
        previousFeedbackReviewed: g('Previous Feedback Reviewed').toLowerCase() === 'yes',
        notes: g('Notes'),
      } as CheckInData;

    case 'dept-meeting':
    case 'progress-update':
      return {
        title: g('Title') || undefined,
        summary: g('Summary'),
      } as SummaryData;

    case 'resource-share':
      return {
        resourceTitle: g('Resource Title'),
        resourceLink: g('Link') || undefined,
        notes: g('Notes') || undefined,
      } as ResourceShareData;

    case 'other':
      return {
        description: g('Description'),
        notes: g('Notes') || undefined,
      } as OtherData;
  }
}

/** Parse a single CSV line respecting double-quote escaping */
function parseLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuote = false; }
      else { cur += c; }
    } else {
      if (c === '"') { inQuote = true; }
      else if (c === ',') { cells.push(cur); cur = ''; }
      else { cur += c; }
    }
  }
  cells.push(cur);
  return cells;
}

export interface ImportedRow {
  date: string;
  type: TouchpointType;
  personName: string;
  schoolName: string;
  data: TouchpointData;
}

export interface ImportResult {
  rows: ImportedRow[];
  errors: string[];
}

/**
 * Parse a CSV that matches the format produced by exportPersonCsv / exportSchoolCsv.
 * Required columns: Date, Type, Person
 * Optional columns: School, and all type-specific detail columns
 */
export function parseTouchpointCsv(csvText: string): ImportResult {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { rows: [], errors: ['The file needs a header row and at least one data row.'] };
  }

  const headers = parseLine(lines[0]).map(h => h.trim());
  const rows: ImportedRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (cells[idx] ?? '').trim(); });

    const date = row['Date'];
    const typeLabel = row['Type'];
    const personName = row['Person'];

    if (!date) { errors.push(`Row ${i + 1}: missing Date — skipped`); continue; }
    if (!typeLabel) { errors.push(`Row ${i + 1}: missing Type — skipped`); continue; }
    if (!personName) { errors.push(`Row ${i + 1}: missing Person — skipped`); continue; }

    const type = resolveType(typeLabel);
    if (!type) { errors.push(`Row ${i + 1}: unknown Type "${typeLabel}" — skipped`); continue; }

    rows.push({
      date,
      type,
      personName,
      schoolName: row['School'] ?? '',
      data: buildData(type, row),
    });
  }

  return { rows, errors };
}
