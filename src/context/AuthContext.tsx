import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isMember: boolean;
  isSuspended: boolean;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin bootstrapped email as defined in guidelines
const ADMIN_BOOTSTRAP_EMAIL = 's6710380109@pkru.ac.th';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or create user document in Firestore
  const syncUserProfile = async (user: FirebaseUser) => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      const isBootstrapAdmin = user.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // If this user is bootstrap admin, enforce role admin
        if (isBootstrapAdmin && data.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin', updatedAt: new Date().toISOString() });
          data.role = 'admin';
        }
        setUserProfile(data);
      } else {
        // Create initial profile
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
          photoURL: user.photoURL || '',
          role: isBootstrapAdmin ? 'admin' : 'member',
          status: 'active',
          bio: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, initialProfile);
        setUserProfile(initialProfile);

        // Also add to admins collection if bootstrap admin for rules check
        if (isBootstrapAdmin) {
          try {
            await setDoc(doc(db, 'admins', user.uid), {
              email: user.email,
              assignedAt: new Date().toISOString(),
            });
          } catch {
            // Non-critical if fails
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err);
      // Construct fallback profile in memory if DB read issue
      setUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
        role: user.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase() ? 'admin' : 'member',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      await syncUserProfile(currentUser);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      await updateProfile(res.user, { displayName });
      // Send real email verification
      try {
        await sendEmailVerification(res.user);
      } catch (e) {
        console.warn('Could not send verification email immediately:', e);
      }
      await syncUserProfile(res.user);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerificationEmail = async () => {
    if (currentUser) {
      await sendEmailVerification(currentUser);
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUserProfile(null);
  };

  const isBootstrapAdmin = currentUser?.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
  const isAdmin = isBootstrapAdmin || userProfile?.role === 'admin';
  const isModerator = isAdmin || userProfile?.role === 'moderator';
  const isMember = !!currentUser;
  const isSuspended = userProfile?.status === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isModerator,
        isMember,
        isSuspended,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        resetPassword,
        resendVerificationEmail,
        logout,
        refreshProfile,
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
