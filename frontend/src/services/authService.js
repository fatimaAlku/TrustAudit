import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../firebaseClient';

// Client-side org selection (demo multi-tenant behaviour)

const STORAGE_KEY = 'trustaudit_user_profile';

export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Please provide email and password.');
  }

  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const name = cred.user.displayName || email.split('@')[0] || 'User';

  // Demo organizations – in a real app, fetch from Firestore
  const organizations = ['Acme Bank', 'Global Retail', 'CloudCo'];

  const profile = {
    uid: cred.user.uid,
    email: cred.user.email,
    name,
    organizations,
    currentOrg: organizations[0],
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export async function logout() {
  const auth = getFirebaseAuth();
  await signOut(auth);
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getCurrentUser() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setCurrentOrganization(orgName) {
  const user = getCurrentUser();
  if (!user) return null;
  if (!user.organizations?.includes(orgName)) return user;

  const updated = { ...user, currentOrg: orgName };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}


