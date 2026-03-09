import React, { useEffect, useState } from 'react';
import { getAudits } from '../services/apiService';

const AuditPage = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const data = await getAudits();
        setAudits(data.items || []);
      } catch (err) {
        setError('Unable to load audits');
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, []);

  return (
    <div className="page">
      <section className="page-header">
        <h1>Audit Projects</h1>
        <p>
          Manage IT audit engagements, track progress, and monitor overall
          compliance.
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Active Audits</h2>
          <button className="btn btn-primary" type="button">
            New Audit (placeholder)
          </button>
        </div>

        {loading && <p>Loading audits...</p>}
        {!loading && error && <p className="text-error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Framework</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 && (
                  <tr>
                    <td colSpan={5}>No audits yet. Add your first audit.</td>
                  </tr>
                )}
                {audits.map((audit) => (
                  <tr key={audit.id}>
                    <td>{audit.name}</td>
                    <td>{audit.framework}</td>
                    <td>{audit.scope}</td>
                    <td>{audit.status}</td>
                    <td>{audit.progress ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AuditPage;

