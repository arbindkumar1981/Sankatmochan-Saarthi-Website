import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile, UserRole, BoardType, ClassGrade, StreamType } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  authModalOpen: boolean;
  authModalInitialTab: 'student' | 'admin';
  openAuthModal: (tab?: 'student' | 'admin') => void;
  closeAuthModal: () => void;
  signInWithGoogle: (intendedRole?: UserRole) => Promise<void>;
  signInAsAdminWithPasscode: (passcode: string, adminName?: string) => Promise<boolean>;
  signInAsGuestStudent: (name: string, grade: ClassGrade, board: BoardType, stream?: StreamType) => void;
  updateStudentPreferences: (prefs: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin authorization is determined by the protected Firestore admins collection/rules.
// Never hard-code privileged email addresses in browser source.
const hasAdminRecord = async (uid: string): Promise<boolean> => {
  const adminSnap = await getDoc(doc(db, 'admins', uid));
  return adminSnap.exists();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'student' | 'admin'>('student');

  // Sync Firebase Auth
  useEffect(() => {
    let revision = 0;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const request = ++revision;
      setLoading(true);
      setUser(currentUser);
      setProfile(null);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);

          const isDesignatedAdmin = await hasAdminRecord(currentUser.uid);
          if (request !== revision) return;

          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            const updatedRole: UserRole = isDesignatedAdmin ? 'admin' : 'student';
            const userProfile: UserProfile = {
              ...data,
              role: updatedRole
            };
            setProfile(userProfile);
          } else {
            // New user registration
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Student',
              photoURL: currentUser.photoURL || undefined,
              role: isDesignatedAdmin ? 'admin' : 'student',
              board: 'CBSE',
              classGrade: 'Class 10',
              stream: 'General',
              preferredLanguage: 'en',
              studyStreakDays: 1,
              totalTestsTaken: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            await setDoc(userDocRef, newProfile);
            if (request !== revision) return;
            setProfile(newProfile);
          }
        } catch (err) {
          console.error('Error fetching/saving user profile:', err);
        }
      }
      if (request !== revision) return;
      setLoading(false);
    });

    return () => { ++revision; unsubscribe(); };
  }, []);

  const openAuthModal = (tab: 'student' | 'admin' = 'student') => {
    setAuthModalInitialTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const signInWithGoogle = async (_intendedRole: UserRole = 'student') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Admin status must never be granted from a client-selected login tab.
      // It is derived only from the designated authenticated account; Firestore rules
      // remain the authoritative enforcement boundary for privileged writes.
      const isDesignatedAdmin = await hasAdminRecord(result.user.uid);

      const userDocRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userDocRef);

      if (auth.currentUser?.uid !== result.user.uid) return;
      const resolvedRole: UserRole = isDesignatedAdmin ? 'admin' : 'student';

      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'Student',
          photoURL: result.user.photoURL || undefined,
          role: resolvedRole,
          board: 'CBSE',
          classGrade: 'Class 10',
          stream: 'General',
          preferredLanguage: 'en',
          studyStreakDays: 1,
          totalTestsTaken: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        if (auth.currentUser?.uid !== result.user.uid) return;
        setProfile(newProfile);
      } else {
        const existingData = snap.data() as UserProfile;
        setProfile({
          ...existingData,
          role: resolvedRole
        });
      }

      localStorage.removeItem('saarthi_guest_user');
      setAuthModalOpen(false);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const signInAsAdminWithPasscode = async (_passcode: string, _adminName: string = 'Principal A. Kumar'): Promise<boolean> => {
    // Deliberately disabled: a browser-bundled passcode is not authentication.
    // Admins must sign in with the designated Google/Firebase identity.
    return false;
  };

  // Compatibility entry point: never create a local profile that pretends to authenticate.
  const signInAsGuestStudent = (_name: string, _grade: ClassGrade, _board: BoardType, _stream?: StreamType) => {
    setAuthModalInitialTab('student');
    setAuthModalOpen(true);
  };

  const updateStudentPreferences = async (prefs: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...prefs, updatedAt: new Date().toISOString() };
    setProfile(updated);

    if (user && !user.isAnonymous) {
      try {
        await updateDoc(doc(db, 'users', user.uid), prefs);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    } else {
      localStorage.setItem('saarthi_guest_user', JSON.stringify(updated));
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        await fbSignOut(auth);
      }
      localStorage.removeItem('saarthi_guest_user');
      setProfile(null);
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const role: UserRole = profile?.role || 'student';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        loading,
        authModalOpen,
        authModalInitialTab,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInAsAdminWithPasscode,
        signInAsGuestStudent,
        updateStudentPreferences,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

