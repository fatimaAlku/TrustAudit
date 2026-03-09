import React, { useEffect, useState } from 'react';
import { getHealth } from '../services/apiService';

export const HomePage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await getHealth();
        setHealth(data);
      } catch (err) {
        setError('Unable to reach backend API');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="page">
      <section className="page-header">
        <h1>Smart IT Audit &amp; Compliance Platform</h1>
        <p>
          Centralize your IT audit projects, evidence, and risk assessments in a
          single smart workspace.
        </p>
      </section>

      <section className="cards-grid">
        <div className="card">
          <h2>Audit Project Management</h2>
          <p>
            Plan, assign, and track multiple IT audit engagements with clear
            scopes, timelines, and responsibilities.
          </p>
        </div>
        <div className="card">
          <h2>Control Library</h2>
          <p>
            Work with preloaded controls from ISO 27001, NIST CSF, and COBIT,
            with clear objectives and required evidence.
          </p>
        </div>
        <div className="card">
          <h2>Risk &amp; Compliance Insights</h2>
          <p>
            Visualize compliance coverage and risk distribution so management
            can quickly understand security posture.
          </p>
        </div>
      </section>

      <section className="info-layout">
        <div className="panel">
          <h3>Framework Coverage</h3>
          <ul>
            <li>ISO/IEC 27001</li>
            <li>NIST Cybersecurity Framework</li>
            <li>ISACA COBIT</li>
          </ul>
        </div>

        <div className="panel">
          <h3>API Status</h3>
          {loading && <p>Checking backend health...</p>}
          {!loading && error && <p className="text-error">{error}</p>}
          {!loading && health && (
            <div className="status-pill">
              <span className="status-dot status-dot--ok" />
              <span>
                Backend online (env: <strong>{health.env}</strong>)
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

