// Lightweight client-side auth + org selection (demo only)

const STORAGE_KEY = 'trustaudit_user';

export function login(email, password) {
  if (!email || !password) {
    throw new Error('Please provide email and password.');
  }

  // In a real SaaS this would call a backend.
  const name = email.split('@')[0] || 'User';
  const organizations = ['Acme Bank', 'Global Retail', 'CloudCo'];

  const user = {
    email,
    name,
    organizations,
    currentOrg: organizations[0],
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function logout() {
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

