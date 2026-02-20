import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { User } from './types';

// Supabase Auth requires an email — we map username → fake email
function toEmail(username: string) {
  return `${username.toLowerCase().trim()}@coaching.app`;
}

// ---- Context ----
interface AuthContextValue {
  currentUser: User | null;
  allUsers: User[];
  /** The user whose data is currently displayed (admin view-as) */
  viewingUserId: string | null;
  /** effectiveUserId: viewingUserId if set, otherwise currentUser.id */
  effectiveUserId: string | null;
  setViewingUserId: (id: string | null) => void;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  register: (username: string, displayName: string, password: string) => Promise<string | null>;
  /** true while the initial session check is in progress */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    isAdmin: data.is_admin,
    createdAt: data.created_at,
  };
}

async function fetchAllProfiles(): Promise<User[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at');
  if (!data) return [];
  return data.map(d => ({
    id: d.id,
    username: d.username,
    displayName: d.display_name,
    isAdmin: d.is_admin,
    createdAt: d.created_at,
  }));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setCurrentUser(profile);
        if (profile?.isAdmin) {
          const users = await fetchAllProfiles();
          setAllUsers(users);
        }
      }
      setLoading(false);
    });

    // Listen for auth state changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setCurrentUser(profile);
          if (profile?.isAdmin) {
            const users = await fetchAllProfiles();
            setAllUsers(users);
          }
        } else {
          setCurrentUser(null);
          setAllUsers([]);
          setViewingUserId(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return 'Incorrect username or password';
      }
      return error.message;
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    setViewingUserId(null);
    await supabase.auth.signOut();
  }, []);

  const register = useCallback(async (
    username: string,
    displayName: string,
    password: string
  ): Promise<string | null> => {
    if (username.trim().length < 2) return 'Username must be at least 2 characters';
    if (password.length < 4) return 'Password must be at least 4 characters';

    // Check if username already taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username.trim())
      .maybeSingle();
    if (existing) return 'Username already taken';

    // First user to register becomes admin
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    const isAdmin = (count ?? 0) === 0;

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: toEmail(username),
      password,
    });
    if (error) return error.message;
    if (!data.user) return 'Registration failed — please try again';

    // Insert profile row
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: username.trim(),
      display_name: displayName.trim() || username.trim(),
      is_admin: isAdmin,
    });
    if (profileError) return profileError.message;

    // Set user in state immediately (don't wait for onAuthStateChange)
    const profile: User = {
      id: data.user.id,
      username: username.trim(),
      displayName: displayName.trim() || username.trim(),
      isAdmin,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(profile);
    if (isAdmin) setAllUsers([profile]);

    return null;
  }, []);

  const handleSetViewingUserId = useCallback((id: string | null) => {
    if (!currentUser?.isAdmin) return;
    setViewingUserId(id);
  }, [currentUser]);

  const effectiveUserId = (currentUser?.isAdmin && viewingUserId)
    ? viewingUserId
    : currentUser?.id ?? null;

  return (
    <AuthContext.Provider value={{
      currentUser,
      allUsers,
      viewingUserId,
      effectiveUserId,
      setViewingUserId: handleSetViewingUserId,
      login,
      logout,
      register,
      loading,
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
