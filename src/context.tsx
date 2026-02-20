import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { School, Person, Touchpoint } from './types';

interface AppState {
  schools: School[];
  people: Person[];
  touchpoints: Touchpoint[];
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

function storageKey(userId: string) {
  return `coaching-touchpoints-v1-${userId}`;
}

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

const initialState: AppState = { schools: [], people: [], touchpoints: [] };

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage on mount (keyed by userId)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey(userId));
    if (saved) {
      try {
        dispatch({ type: 'LOAD', payload: JSON.parse(saved) });
      } catch { /* ignore */ }
    } else {
      // Reset to empty when switching users
      dispatch({ type: 'LOAD', payload: initialState });
    }
  }, [userId]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  }, [state, userId]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
