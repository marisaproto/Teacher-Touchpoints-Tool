export type Role = 'teacher' | 'team' | 'administrator';

export type TouchpointType =
  | 'observation'
  | 'coaching-meeting'
  | 'check-in'
  | 'resource-share'
  | 'dept-meeting'
  | 'progress-update'
  | 'other';

export interface School {
  id: string;
  name: string;
  createdAt: string;
}

export interface Person {
  id: string;
  schoolId: string;
  name: string;
  role: Role;
  department?: string;
  gradeLevel?: string;
}

// --- Observation ---
export interface RunningRecordEntry {
  minute: number;
  notes: string;
}

export interface ObservationData {
  instructionalGoal: string;
  subject?: string;
  runningRecord: RunningRecordEntry[];
}

// --- Coaching Meeting (Feedback) ---
export interface CoachingMeetingData {
  relatedObservationId?: string;
  glows: string[];
  grows: string[];
  questionsForConsideration: string[];
  nextSteps?: string;
}

// --- Check-In ---
export interface CheckInData {
  objective: string;
  unit?: string;
  previousFeedbackReviewed: boolean;
  notes: string;
}

// --- Department Meeting / Progress Update ---
export interface SummaryData {
  title?: string;
  summary: string;
}

// --- Resource Share ---
export interface ResourceShareData {
  resourceTitle: string;
  resourceLink?: string;
  notes?: string;
}

// --- Other ---
export interface OtherData {
  description: string;
  notes?: string;
}

export type TouchpointData =
  | ObservationData
  | CoachingMeetingData
  | CheckInData
  | SummaryData
  | ResourceShareData
  | OtherData;

export interface Touchpoint {
  id: string;
  personId: string;
  schoolId: string;
  date: string;
  type: TouchpointType;
  data: TouchpointData;
}

export const TOUCHPOINT_LABELS: Record<TouchpointType, string> = {
  'observation': 'Observation',
  'coaching-meeting': 'Coaching Meeting',
  'check-in': 'Check-In',
  'resource-share': 'Resource Share',
  'dept-meeting': 'Department Meeting',
  'progress-update': 'Progress Update',
  'other': 'Other',
};

export const TOUCHPOINT_COLORS: Record<TouchpointType, string> = {
  'observation': '#3182ce',
  'coaching-meeting': '#38a169',
  'check-in': '#805ad5',
  'resource-share': '#dd6b20',
  'dept-meeting': '#e53e3e',
  'progress-update': '#319795',
  'other': '#718096',
};

export const ROLE_LABELS: Record<Role, string> = {
  teacher: 'Teacher',
  team: 'Team',
  administrator: 'Administrator',
};
