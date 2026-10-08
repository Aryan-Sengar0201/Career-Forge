import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from '../services/api';
import { UserProfile } from '../types/career';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserStats: (xpDelta: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            localStorage.setItem('careerforge_token', session.access_token);
            const userObj: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              fullName: session.user.user_metadata?.full_name || 'Explorer',
              xp: 120,
              level: 1,
              streak: 1,
            };
            localStorage.setItem('careerforge_user', JSON.stringify(userObj));
            setUser(userObj);
            try {
              const res = await api.getProgress();
              if (res?.profile) setUser(res.profile);
            } catch (e) {
              // Ignore initial fetch error
            }
          } else {
            checkLocalSession();
          }
        } else {
          checkLocalSession();
        }
      } catch (err) {
        checkLocalSession();
      } finally {
        setLoading(false);
      }
    }

    function checkLocalSession() {
      const storedUser = localStorage.getItem('careerforge_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          // Async sync with server
          api.getProgress().then(res => {
            if (res?.profile) setUser(res.profile);
          }).catch(() => {});
        } catch {
          localStorage.removeItem('careerforge_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }

    initAuth();

    // Supabase auth state change listener if enabled
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          localStorage.setItem('careerforge_token', session.access_token);
          const userObj: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Explorer',
            xp: 120,
            level: 1,
            streak: 1,
          };
          localStorage.setItem('careerforge_user', JSON.stringify(userObj));
          setUser(userObj);
        } else if (!localStorage.getItem('careerforge_user')) {
          setUser(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const signup = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        if (data.session) {
          localStorage.setItem('careerforge_token', data.session.access_token);
        }
        const userId = data.user?.id || `usr-${Date.now()}`;
        const newUser: UserProfile = {
          id: userId,
          email,
          fullName,
          xp: 100,
          level: 1,
          streak: 1,
        };
        localStorage.setItem('careerforge_user', JSON.stringify(newUser));
        await api.syncProfile({ id: userId, email, fullName });
        setUser(newUser);
      } else {
        // Local session with server persistence
        const userId = `usr-${Date.now()}`;
        const newUser: UserProfile = {
          id: userId,
          email,
          fullName,
          xp: 100,
          level: 1,
          streak: 1,
        };
        localStorage.setItem('careerforge_token', `local-token-${userId}`);
        localStorage.setItem('careerforge_user', JSON.stringify(newUser));
        await api.syncProfile({ id: userId, email, fullName });
        setUser(newUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          localStorage.setItem('careerforge_token', data.session.access_token);
        }
        const userObj: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: data.user.user_metadata?.full_name || email.split('@')[0],
          xp: 120,
          level: 1,
          streak: 1,
        };
        localStorage.setItem('careerforge_user', JSON.stringify(userObj));
        setUser(userObj);
        await api.syncProfile({ id: userObj.id, email: userObj.email, fullName: userObj.fullName });
      } else {
        // Local session login
        let existingUser: UserProfile | null = null;
        const stored = localStorage.getItem('careerforge_user');
        if (stored) {
          try {
            const p = JSON.parse(stored);
            if (p.email.toLowerCase() === email.toLowerCase()) {
              existingUser = p;
            }
          } catch {}
        }

        const loggedInUser: UserProfile = existingUser || {
          id: `usr-${Math.abs(hashString(email))}`,
          email,
          fullName: email.split('@')[0],
          xp: 120,
          level: 1,
          streak: 1,
        };

        localStorage.setItem('careerforge_token', `local-token-${loggedInUser.id}`);
        localStorage.setItem('careerforge_user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        await api.syncProfile({ id: loggedInUser.id, email: loggedInUser.email, fullName: loggedInUser.fullName });
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch {}
    localStorage.removeItem('careerforge_token');
    localStorage.removeItem('careerforge_user');
    setUser(null);
  };

  const updateUserStats = (xpDelta: number) => {
    setUser(prev => {
      if (!prev) return null;
      const newXp = prev.xp + xpDelta;
      const newLevel = Math.floor(newXp / 200) + 1;
      const updated = { ...prev, xp: newXp, level: newLevel };
      localStorage.setItem('careerforge_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await api.getProgress();
      if (res?.profile) {
        setUser(res.profile);
        localStorage.setItem('careerforge_user', JSON.stringify(res.profile));
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, updateUserStats, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
