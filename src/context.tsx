import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { School, Person, Touchpoint } from './types';

interface AppState {
  schools: School[];
  people: Person[];
  touchpoints: Touchpoint[];
  schoolCoachCounts: Record<string, number>;
}

type Action =
  | { type: 'ADD_SCHOOL'; payload: School }
  | { type: 'UPDATE_SCHOOL'; payload: School }
  | { type: 'DELETE_SCHOOL'; payload: string }
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'UPDATE_PERSON'; payload: Person }
  | { type: 'DELETE_PERSON'; payload: string }
  | { type: 'ADD_TOUCHPOINT'; payload: Touchpoint }
  | { type: 'UPDATE_TOUCHPOINT'; payload: Touchpoint }
  | { type: 'DELETE_TOUCHPOINT'; payload: string }
  | { type: 'LOAD'; payload: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD':
      return action.payload;

    case 'ADD_SCHOOL':
      return { ...state, schools: [...state.schools, action.payload] };
    case 'UPDATE_SCHOOL':
      return { ...state, schools: state.schools.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SCHOOL':
      return {
        ...state,
        schools: state.schools.filter(s => s.id !== action.payload),
        people: state.people.filter(p => p.schoolId !== action.payload),
        touchpoints: state.touchpoints.filter(t => t.schoolId !== action.payload),
      };

    case 'ADD_PERSON':
      return { ...state, people: [...state.people, action.payload] };
    case 'UPDATE_PERSON':
      return { ...state, people: state.people.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PERSON':
      return {
        ...state,
        people: state.people.filter(p => p.id !== action.payload),
        touchpoints: state.touchpoints.filter(t => t.personId !== action.payload),
      };

    case 'ADD_TOUCHPOINT':
      return { ...state, touchpoints: [...state.touchpoints, action.payload] };
    case 'UPDATE_TOUCHPOINT':
      return { ...state, touchpoints: state.touchpoints.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TOUCHPOINT':
      return { ...state, touchpoints: state.touchpoints.filter(t => t.id !== action.payload) };

    default:
      return state;
  }
}

const initialState: AppState = { schools: [], people: [], touchpoints: [], schoolCoachCounts: {} };

interface AppContextValue {
  state: AppState;
  dispatch: (action: Action) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [state, localDispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase when userId changes
  useEffect(() => {
    setLoading(true);
    localDispatch({ type: 'LOAD', payload: initialState });

    async function load() {
      try {
        const [
          { data: schools },
          { data: people },
          { data: touchpoints },
          { data: coachCounts },
        ] = await Promise.all([
          // Schools and people are shared across all users so every coach can see
          // the same school roster and log touchpoints to shared profiles.
          // Touchpoints remain private (filtered by user_id).
          supabase.from('schools').select('*').order('created_at'),
          supabase.from('people').select('*'),
          supabase.from('touchpoints').select('*').eq('user_id', userId),
          supabase.rpc('get_school_coach_counts'),
        ]);

        const schoolCoachCounts: Record<string, number> = {};
        for (const row of (coachCounts ?? [])) {
          schoolCoachCounts[row.school_id] = Number(row.coach_count);
        }

        localDispatch({
          type: 'LOAD',
          payload: {
            schools: (schools ?? []).map(s => ({
              id: s.id,
              name: s.name,
              createdAt: s.created_at,
            })),
            people: (people ?? []).map(p => ({
              id: p.id,
              schoolId: p.school_id,
              name: p.name,
              role: p.role,
              department: p.department ?? undefined,
              gradeLevel: p.grade_level ?? undefined,
              goal: p.goal ?? undefined,
            })),
            touchpoints: (touchpoints ?? []).map(t => ({
              id: t.id,
              personId: t.person_id,
              schoolId: t.school_id,
              date: t.date,
              type: t.type,
              data: t.data,
            })),
            schoolCoachCounts,
          },
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  // dispatch: update local state immediately, then persist to Supabase
  const dispatch = useCallback((action: Action) => {
    localDispatch(action);

    (async () => {
      switch (action.type) {
        case 'ADD_SCHOOL':
          await supabase.from('schools').insert({
            id: action.payload.id,
            user_id: userId,
            name: action.payload.name,
            created_at: action.payload.createdAt,
          });
          break;

        case 'UPDATE_SCHOOL':
          await supabase.from('schools')
            .update({ name: action.payload.name })
            .eq('id', action.payload.id);
          break;

        case 'DELETE_SCHOOL':
          // ON DELETE CASCADE in DB handles people + touchpoints
          await supabase.from('schools').delete().eq('id', action.payload);
          break;

        case 'ADD_PERSON':
          await supabase.from('people').insert({
            id: action.payload.id,
            user_id: userId,
            school_id: action.payload.schoolId,
            name: action.payload.name,
            role: action.payload.role,
            department: action.payload.department ?? null,
            grade_level: action.payload.gradeLevel ?? null,
            goal: action.payload.goal ?? null,
          });
          break;

        case 'UPDATE_PERSON':
          await supabase.from('people')
            .update({
              name: action.payload.name,
              role: action.payload.role,
              department: action.payload.department ?? null,
              grade_level: action.payload.gradeLevel ?? null,
              goal: action.payload.goal ?? null,
            })
            .eq('id', action.payload.id);
          break;

        case 'DELETE_PERSON':
          // ON DELETE CASCADE in DB handles touchpoints
          await supabase.from('people').delete().eq('id', action.payload);
          break;

        case 'ADD_TOUCHPOINT':
          await supabase.from('touchpoints').insert({
            id: action.payload.id,
            user_id: userId,
            person_id: action.payload.personId,
            school_id: action.payload.schoolId,
            date: action.payload.date,
            type: action.payload.type,
            data: action.payload.data,
          });
          break;

        case 'UPDATE_TOUCHPOINT':
          await supabase.from('touchpoints')
            .update({
              date: action.payload.date,
              type: action.payload.type,
              data: action.payload.data,
            })
            .eq('id', action.payload.id);
          break;

        case 'DELETE_TOUCHPOINT':
          await supabase.from('touchpoints').delete().eq('id', action.payload);
          break;
      }
    })();
  }, [userId]);

  return (
    <AppContext.Provider value={{ state, dispatch, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Generate a UUID for new records
export function uid() {
  return crypto.randomUUID();
}
