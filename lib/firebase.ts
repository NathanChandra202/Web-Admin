import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBBmWvMg8CGv4Jz1SQZx551yjTZUit6G3E',
  authDomain: 'bengkel-mouse.firebaseapp.com',
  projectId: 'bengkel-mouse',
  storageBucket: 'bengkel-mouse.firebasestorage.app',
  messagingSenderId: '413473566922',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request email & profile scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface GoogleAuthResult {
  idToken: string;
  name: string;
  email: string;
  photoURL?: string | null;
  uid: string;
}

export async function signInWithGooglePopup(): Promise<GoogleAuthResult> {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return {
    idToken,
    name: result.user.displayName || (result.user.email ? result.user.email.split('@')[0] : 'User'),
    email: result.user.email || '',
    photoURL: result.user.photoURL,
    uid: result.user.uid,
  };
}
