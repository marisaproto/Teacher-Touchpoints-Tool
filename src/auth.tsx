import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from './types';

const USERS_KEY = 'coaching-users-v1';
const SESSION_KEY = 'coaching-session-v1';

// ---- Crypto ----
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---- Storage helpers ----
export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const users: User[] = JSON.parse(raw);
    // Migration: if no user has isAdmin set, make the oldest account admin
    const hasAdmin = users.some(u => u.isAdmin);
    if (!hasAdmin && users.length > 0) {
      const sorted = [...users].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      sorted[0].isAdmin = true;
      saveUsers(users);
    }
    return users;
  } catch { return []; }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

function saveSession(userId: string | null) {
  if (userId) {
    localStorage.setItem(SESSION_KEY, userId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// ---- Context ----
interface AuthContextValue {
  currentUser: User | null;
  allUsers: User[];
  /** The user whose data is currently displayed (= currentUser unless admin is viewing someone else) */
  viewingUserId: string | null;
  /** effectiveUserId: viewingUserId if set, otherwise currentUser.id */
  effectiveUserId: string | null;
  setViewingUserId: (id: string | null) => void;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  register: (username: string, displayName: string, password: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => loadUsers());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    const sessionId = loadSession();
    if (!sessionId) return null;
    return loadUsers().find(u => u.id === sessionId) ? sessionId : null;
  });
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const currentUser = users.find(u => u.id === currentUserId) ?? null;

  // Only admins can view-as; otherwise fall back to own id
  const effectiveUserId = (currentUser?.isAdmin && viewingUserId)
    ? viewingUserId
    : currentUserId;

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const stored = loadUsers();
    const user = stored.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return 'Username not found';
    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) return 'Incorrect password';
    saveSession(user.id);
    setUsers(stored);
    setCurrentUserId(user.id);
    setViewingUserId(null);
    return null;
  }, []);

  const logout = useCallback(() => {
    saveSession(null);
    setCurrentUserId(null);
    setViewingUserId(null);
  }, []);

  const register = useCallback(async (
    username: string,
    displayName: string,
    password: string
  ): Promise<string | null> => {
    const stored = loadUsers();
    if (stored.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return 'Username already taken';
    }
    if (username.trim().length < 2) return 'Username must be at least 2 characters';
    if (password.length < 4) return 'Password must be at least 4 characters';
    const hash = await hashPassword(password);
    // First registered account automatically becomes admin
    const isAdmin = stored.length === 0;
    const newUser: User = {
      id: uid(),
      username: username.trim(),
      displayName: displayName.trim() || username.trim(),
      passwordHash: hash,
      isAdmin,
      createdAt: new Date().toISOString(),
    };
    const updated = [...stored, newUser];
    saveUsers(updated);
    setUsers(updated);
    saveSession(newUser.id);
    setCurrentUserId(newUser.id);
    setViewingUserId(null);
    return null;
  }, []);

  const handleSetViewingUserId = useCallback((id: string | null) => {
    if (!currentUser?.isAdmin) return;
    setViewingUserId(id);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      allUsers: users,
      viewingUserId,
      effectiveUserId,
      setViewingUserId: handleSetViewingUserId,
      login,
      logout,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
