import React from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import AuditPage from './pages/AuditPage';
import EvidenceUpload from './components/EvidenceUpload';

const App = () => {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">TrustAudit</div>
        <nav className="app-nav">
          <NavLink to="/" end className="nav-link">
            Overview
          </NavLink>
          <NavLink to="/audits" className="nav-link">
            Audits
          </NavLink>
          <NavLink to="/evidence" className="nav-link">
            Evidence
          </NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/audits" element={<AuditPage />} />
          <Route path="/evidence" element={<EvidenceUpload />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <span>TrustAudit</span>
      </footer>
    </div>
  );
};

export default App;

