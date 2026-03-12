import React, { useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import AuditPage from './pages/AuditPage';
import EvidenceUpload from './components/EvidenceUpload';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { SignupPage } from './pages/SignupPage';
import { getCurrentUser, logout, setCurrentOrganization } from './services/authService';

const App = () => {
  const [user, setUser] = useState(() => getCurrentUser());

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const handleOrgChange = (event) => {
    const org = event.target.value;
    const updated = setCurrentOrganization(org);
    if (updated) {
      setUser(updated);
    }
  };

  const orgOptions = useMemo(
    () => user?.organizations || [],
    [user],
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">TrustAudit</div>
        {user ? (
          <>
            <nav className="app-nav">
              <NavLink to="/" end className="nav-link">
                Overview
              </NavLink>
              <NavLink to="/dashboard" className="nav-link">
                Dashboard
              </NavLink>
              <NavLink to="/audits" className="nav-link">
                Audits
              </NavLink>
              <NavLink to="/evidence" className="nav-link">
                Evidence
              </NavLink>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {orgOptions.length > 0 && (
                <select
                  value={user.currentOrg}
                  onChange={handleOrgChange}
                  className="org-select"
                >
                  {orgOptions.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              )}
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                {user.name}
              </span>
              <button type="button" className="btn" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <nav className="app-nav">
            <NavLink to="/login" className="nav-link">
              Log in
            </NavLink>
            <NavLink to="/signup" className="nav-link">
              Sign up
            </NavLink>
          </nav>
        )}
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={user ? <HomePage /> : <LandingPage />}
          />
          <Route
            path="/dashboard"
            element={user ? <DashboardPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={
              user ? <Navigate to="/" replace /> : <LoginPage onLogin={setUser} />
            }
          />
          <Route
            path="/signup"
            element={
              user ? <Navigate to="/" replace /> : <SignupPage onSignup={setUser} />
            }
          />
          <Route
            path="/audits"
            element={user ? <AuditPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/evidence"
            element={user ? <EvidenceUpload /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </main>

      <footer className="app-footer">
        <span>TrustAudit</span>
      </footer>
    </div>
  );
};

export default App;

