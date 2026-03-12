import React from 'react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="page">
      <section className="page-header">
        <h1>Smart IT Audit, Simplified.</h1>
        <p>
          TrustAudit helps you plan, execute, and evidence IT audits across ISO 27001,
          NIST CSF, COBIT, and more – in a single, elegant workspace.
        </p>
      </section>

      <section className="cards-grid">
        <div className="card">
          <h2>Streamlined audit projects</h2>
          <p>
            Capture scope, owners, and timelines for each engagement so your team always
            knows what is next.
          </p>
        </div>
        <div className="card">
          <h2>Preloaded control library</h2>
          <p>
            Start from curated controls mapped to leading frameworks and link real
            evidence to each test.
          </p>
        </div>
        <div className="card">
          <h2>Executive‑ready insights</h2>
          <p>
            Turn audit results into clear views of risk and compliance coverage for
            boards and regulators.
          </p>
        </div>
      </section>

      <section className="panel">
        <h3>Get started with TrustAudit</h3>
        <p className="muted" style={{ marginBottom: '1.2rem' }}>
          Create an account to start a new audit workspace, or sign in if your
          organization already uses TrustAudit.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/signup" className="btn btn-primary">
            Create account
          </Link>
          <Link to="/login" className="btn" style={{ border: '1px solid var(--border-subtle)' }}>
            I already have an account
          </Link>
        </div>
      </section>
    </div>
  );
};

