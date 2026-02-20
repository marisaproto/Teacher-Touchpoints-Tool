import { jsPDF } from 'jspdf';
import {
  Person, School, Touchpoint, TouchpointType,
  ObservationData, CoachingMeetingData, CheckInData,
  SummaryData, ResourceShareData, OtherData,
  TOUCHPOINT_LABELS,
} from '../types';

// ---- Drawing helpers ----

const MARGIN = 18;
const PAGE_W = 210; // A4 mm
const CONTENT_W = PAGE_W - MARGIN * 2;
const PRIMARY = '#1a6b4a';

function hex2rgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

interface DrawCtx {
  doc: jsPDF;
  y: number;
}

function addPage(ctx: DrawCtx) {
  ctx.doc.addPage();
  ctx.y = MARGIN;
}

function checkPageBreak(ctx: DrawCtx, needed = 12) {
  const pageH = ctx.doc.internal.pageSize.getHeight();
  if (ctx.y + needed > pageH - MARGIN) addPage(ctx);
}

function sectionTitle(ctx: DrawCtx, title: string) {
  checkPageBreak(ctx, 16);
  ctx.doc.setFontSize(9);
  ctx.doc.setFont('helvetica', 'bold');
  const [r, g, b] = hex2rgb(PRIMARY);
  ctx.doc.setTextColor(r, g, b);
  ctx.doc.text(title.toUpperCase(), MARGIN, ctx.y);
  ctx.y += 1;
  ctx.doc.setDrawColor(r, g, b);
  ctx.doc.setLineWidth(0.3);
  ctx.doc.line(MARGIN, ctx.y, MARGIN + CONTENT_W, ctx.y);
  ctx.y += 4;
  ctx.doc.setTextColor(30, 30, 30);
}

function bodyText(ctx: DrawCtx, text: string, options: { italic?: boolean } = {}) {
  ctx.doc.setFontSize(10);
  ctx.doc.setFont('helvetica', options.italic ? 'italic' : 'normal');
  const lines = ctx.doc.splitTextToSize(text, CONTENT_W) as string[];
  checkPageBreak(ctx, lines.length * 5 + 2);
  ctx.doc.text(lines, MARGIN, ctx.y);
  ctx.y += lines.length * 5 + 2;
}

function listItems(ctx: DrawCtx, items: string[], bullet = '•') {
  ctx.doc.setFontSize(10);
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setTextColor(30, 30, 30);
  for (const item of items) {
    const wrapped = ctx.doc.splitTextToSize(item, CONTENT_W - 6) as string[];
    checkPageBreak(ctx, wrapped.length * 5 + 1);
    ctx.doc.text(`${bullet}`, MARGIN, ctx.y);
    ctx.doc.text(wrapped, MARGIN + 5, ctx.y);
    ctx.y += wrapped.length * 5 + 1;
  }
  ctx.y += 1;
}

function labelValue(ctx: DrawCtx, label: string, value: string) {
  checkPageBreak(ctx, 8);
  ctx.doc.setFontSize(9);
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setTextColor(80, 80, 80);
  ctx.doc.text(`${label}: `, MARGIN, ctx.y);
  const labelW = ctx.doc.getTextWidth(`${label}: `);
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setTextColor(30, 30, 30);
  const remaining = CONTENT_W - labelW;
  const wrapped = ctx.doc.splitTextToSize(value, remaining) as string[];
  ctx.doc.text(wrapped, MARGIN + labelW, ctx.y);
  ctx.y += wrapped.length * 5 + 2;
}

// ---- Type-specific renderers ----

function renderObservation(ctx: DrawCtx, data: ObservationData) {
  sectionTitle(ctx, 'Instructional Goal');
  bodyText(ctx, data.instructionalGoal);
  if (data.subject) labelValue(ctx, 'Subject', data.subject);
  ctx.y += 2;

  sectionTitle(ctx, 'Running Record');
  if (data.runningRecord.length === 0) {
    bodyText(ctx, 'No entries recorded.', { italic: true });
  } else {
    // Table-style running record
    const colMin = 18;
    const colNotes = CONTENT_W - 18;
    ctx.doc.setFontSize(8);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.setTextColor(80, 80, 80);
    ctx.doc.text('MIN', MARGIN, ctx.y);
    ctx.doc.text('OBSERVATIONS', MARGIN + colMin + 2, ctx.y);
    ctx.y += 1;
    ctx.doc.setDrawColor(200, 200, 200);
    ctx.doc.setLineWidth(0.2);
    ctx.doc.line(MARGIN, ctx.y, MARGIN + CONTENT_W, ctx.y);
    ctx.y += 3;

    for (const entry of data.runningRecord) {
      const noteLines = ctx.doc.splitTextToSize(entry.notes || '—', colNotes) as string[];
      checkPageBreak(ctx, noteLines.length * 4 + 2);
      ctx.doc.setFont('helvetica', 'bold');
      ctx.doc.setFontSize(9);
      ctx.doc.setTextColor(30, 30, 30);
      ctx.doc.text(String(entry.minute), MARGIN, ctx.y);
      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.text(noteLines, MARGIN + colMin + 2, ctx.y);
      ctx.y += noteLines.length * 4 + 2;
    }
  }
}

function renderCoaching(ctx: DrawCtx, data: CoachingMeetingData) {
  sectionTitle(ctx, 'Glows');
  if (data.glows.length === 0) bodyText(ctx, 'None recorded.', { italic: true });
  else listItems(ctx, data.glows, '★');

  sectionTitle(ctx, 'Grows');
  if (data.grows.length === 0) bodyText(ctx, 'None recorded.', { italic: true });
  else listItems(ctx, data.grows, '▲');

  sectionTitle(ctx, 'Questions for Consideration');
  if (data.questionsForConsideration.length === 0) bodyText(ctx, 'None recorded.', { italic: true });
  else listItems(ctx, data.questionsForConsideration, '?');

  if (data.nextSteps) {
    sectionTitle(ctx, 'Next Steps');
    bodyText(ctx, data.nextSteps);
  }
}

function renderCheckIn(ctx: DrawCtx, data: CheckInData) {
  sectionTitle(ctx, 'Objective');
  bodyText(ctx, data.objective);
  if (data.unit) { sectionTitle(ctx, 'Unit / Context'); bodyText(ctx, data.unit); }
  sectionTitle(ctx, 'Previous Feedback');
  bodyText(ctx, data.previousFeedbackReviewed ? 'Reviewed previous coaching feedback' : 'Previous feedback not reviewed');
  if (data.notes) { sectionTitle(ctx, 'Notes'); bodyText(ctx, data.notes); }
}

function renderSummary(ctx: DrawCtx, data: SummaryData, type: TouchpointType) {
  if (data.title) { sectionTitle(ctx, type === 'dept-meeting' ? 'Title / Agenda' : 'Title'); bodyText(ctx, data.title); }
  sectionTitle(ctx, 'Summary');
  bodyText(ctx, data.summary);
}

function renderResource(ctx: DrawCtx, data: ResourceShareData) {
  sectionTitle(ctx, 'Resource');
  bodyText(ctx, data.resourceTitle);
  if (data.resourceLink) labelValue(ctx, 'Link', data.resourceLink);
  if (data.notes) { sectionTitle(ctx, 'Notes'); bodyText(ctx, data.notes); }
}

function renderOther(ctx: DrawCtx, data: OtherData) {
  sectionTitle(ctx, 'Description');
  bodyText(ctx, data.description);
  if (data.notes) { sectionTitle(ctx, 'Notes'); bodyText(ctx, data.notes); }
}

// ---- Main export function ----

export function exportTouchpointPdf(
  touchpoint: Touchpoint,
  person: Person,
  school: School,
  relatedObs?: Touchpoint | null,
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ctx: DrawCtx = { doc, y: MARGIN };

  // ---- Header bar ----
  const [pr, pg, pb] = hex2rgb(PRIMARY);
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, PAGE_W, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Coaching Touchpoints', MARGIN, 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(TOUCHPOINT_LABELS[touchpoint.type], MARGIN, 16);

  ctx.y = 30;

  // ---- Meta info ----
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const dateStr = new Date(touchpoint.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  doc.text(dateStr, MARGIN, ctx.y);
  ctx.y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const meta = [person.name, person.role, person.department, person.gradeLevel, school.name]
    .filter(Boolean).join('  ·  ');
  doc.text(meta, MARGIN, ctx.y);
  ctx.y += 5;

  if (person.goal) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(pr, pg, pb);
    const goalLines = doc.splitTextToSize(`Goal: ${person.goal}`, CONTENT_W) as string[];
    doc.text(goalLines, MARGIN, ctx.y);
    ctx.y += goalLines.length * 4 + 2;
  }

  if (relatedObs) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 120);
    const relText = `Linked to observation: ${new Date(relatedObs.date).toLocaleDateString()} — ${(relatedObs.data as ObservationData).instructionalGoal?.slice(0, 80)}`;
    const relLines = doc.splitTextToSize(relText, CONTENT_W) as string[];
    doc.text(relLines, MARGIN, ctx.y);
    ctx.y += relLines.length * 4 + 2;
  }

  ctx.y += 4;
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, ctx.y, MARGIN + CONTENT_W, ctx.y);
  ctx.y += 6;

  // ---- Type-specific content ----
  const data = touchpoint.data;
  switch (touchpoint.type) {
    case 'observation':
      renderObservation(ctx, data as ObservationData);
      break;
    case 'coaching-meeting':
      renderCoaching(ctx, data as CoachingMeetingData);
      break;
    case 'check-in':
      renderCheckIn(ctx, data as CheckInData);
      break;
    case 'dept-meeting':
    case 'progress-update':
      renderSummary(ctx, data as SummaryData, touchpoint.type);
      break;
    case 'resource-share':
      renderResource(ctx, data as ResourceShareData);
      break;
    case 'other':
      renderOther(ctx, data as OtherData);
      break;
  }

  // ---- Footer ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Page ${i} of ${pageCount}  ·  Generated ${new Date().toLocaleDateString()}`,
      MARGIN,
      pageH - 8
    );
  }

  const filename = `${person.name.replace(/\s+/g, '-')}-${TOUCHPOINT_LABELS[touchpoint.type].replace(/\s+/g, '-')}-${touchpoint.date}.pdf`;
  doc.save(filename);
}
