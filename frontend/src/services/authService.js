// Placeholder auth service to be expanded later

export function login(username, password) {
  // In a real implementation, call backend auth API here
  if (username && password) {
    const user = { username };
    window.localStorage.setItem('trustaudit_user', JSON.stringify(user));
    return user;
  }
  throw new Error('Missing credentials');
}

export function logout() {
  window.localStorage.removeItem('trustaudit_user');
}

export function getCurrentUser() {
  const stored = window.localStorage.getItem('trustaudit_user');
  return stored ? JSON.parse(stored) : null;
}

