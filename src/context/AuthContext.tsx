import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  currentUser: UserProfile | null;
  visitorUser: UserProfile;
  visitorId: string;
  isAuthenticated: boolean;
  isGoogleAuthenticated: boolean;
  isLoading: boolean;
  trackedQuestionIds: string[];
  addTrackedQuestion: (id: string) => void;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: (payload: { email: string; name?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoUser: (userType: 'david' | 'grace') => Promise<void>;
  setSessionUser: (user: UserProfile) => void;
  logout: () => void;
  updateProfileName: (name: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'bdh_user_session';
const VISITOR_ID_KEY = 'bdh_visitor_id';
const TRACKED_QUESTIONS_KEY = 'bdh_tracked_questions';

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const newId = `visiteur-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem(VISITOR_ID_KEY, newId);
    return newId;
  } catch {
    return `visiteur-${Date.now()}`;
  }
}

function getStoredTrackedQuestions(): string[] {
  try {
    const saved = localStorage.getItem(TRACKED_QUESTIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [visitorId] = useState<string>(getOrCreateVisitorId);
  const [trackedQuestionIds, setTrackedQuestionIds] = useState<string[]>(getStoredTrackedQuestions);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  const visitorUser: UserProfile = {
    id: visitorId,
    name: 'Visiteur du site',
    auth_provider: 'visitor',
    token: `tok-${visitorId}`,
    created_at: new Date().toISOString()
  };

  const addTrackedQuestion = (id: string) => {
    if (!id) return;
    setTrackedQuestionIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [id, ...prev];
      try {
        localStorage.setItem(TRACKED_QUESTIONS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save tracked questions', e);
      }
      return updated;
    });
  };

  // Load user session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const user: UserProfile = JSON.parse(saved);
          if (user?.token) {
            // Verify with backend
            const res = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) {
              const data = await res.json();
              setCurrentUser(data.user);
            } else {
              // Keep local session if server was briefly rebooted
              setCurrentUser(user);
            }
          }
        }
      } catch (e) {
        console.warn('Session check failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const saveSession = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to persist user session', e);
    }
  };

  const loginWithGoogle = async (payload: { email: string; name?: string; avatar?: string }) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Impossible de vous authentifier avec Google.' };
      }
      saveSession(data.user);
      setAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la connexion Google.' };
    }
  };

  const loginAsDemoUser = async (userType: 'david' | 'grace') => {
    if (userType === 'david') {
      await loginWithGoogle({
        email: 'david.kalombo@gmail.com',
        name: 'Frère David Kalombo'
      });
    } else {
      await loginWithGoogle({
        email: 'grace.mbemba@gmail.com',
        name: 'Sœur Grace Mbemba'
      });
    }
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
  };

  const updateProfileName = async (name: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const data = await res.json();
        saveSession(data.user);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser || visitorUser,
        currentUser: currentUser || visitorUser,
        visitorUser,
        visitorId,
        isAuthenticated: !!currentUser && currentUser.auth_provider === 'google',
        isGoogleAuthenticated: !!currentUser && currentUser.auth_provider === 'google',
        isLoading,
        trackedQuestionIds,
        addTrackedQuestion,
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
        loginWithGoogle,
        loginAsDemoUser,
        setSessionUser: saveSession,
        logout,
        updateProfileName
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
