import React, { useEffect, useState } from 'react';
import { getAudits, getControls, getControlTests } from '../services/apiService';
import { getCurrentUser } from '../services/authService';

export const DashboardPage = () => {
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const buildDashboard = async () => {
      setDashLoading(true);
      setDashError(null);

      try {
        const currentOrg = getCurrentUser()?.currentOrg || null;

        const auditsRes = await getAudits();
        let audits = auditsRes.items || [];
        if (currentOrg) {
          audits = audits.filter((a) => a.organization === currentOrg);
        }

        if (audits.length === 0) {
          setMetrics({
            overallCompliancePct: 0,
            testingProgressPct: 0,
            riskCounts: { high: 0, medium: 0, low: 0 },
            frameworkCoverage: [],
            findings: [],
          });
          return;
        }

        const frameworks = Array.from(
          new Set(audits.map((a) => a.framework).filter(Boolean)),
        );

        const [controlsPerFramework, testsPerAudit] = await Promise.all([
          Promise.all(frameworks.map((fw) => getControls(fw))),
          Promise.all(audits.map((audit) => getControlTests(audit.id))),
        ]);

        const controlsByFramework = {};
        frameworks.forEach((fw, index) => {
          controlsByFramework[fw] = controlsPerFramework[index].items || [];
        });

        const testsByAudit = {};
        audits.forEach((audit, index) => {
          testsByAudit[audit.id] = testsPerAudit[index].items || [];
        });

        const allTests = audits.flatMap((audit) =>
          (testsByAudit[audit.id] || []).map((t) => ({
            ...t,
            auditId: audit.id,
            auditName: audit.name,
            framework: audit.framework,
          })),
        );

        const statusScore = {
          Compliant: 1,
          'Partially Compliant': 0.5,
          'Non-Compliant': 0,
        };

        const scored = allTests.filter(
          (t) => t.status && statusScore[t.status] !== undefined,
        );

        const overallCompliancePct =
          scored.length === 0
            ? 0
            : Math.round(
                (scored.reduce(
                  (sum, t) => sum + statusScore[t.status],
                  0,
                ) /
                  scored.length) *
                  100,
              );

        const totalControls = audits.reduce((sum, audit) => {
          const controls = controlsByFramework[audit.framework] || [];
          return sum + controls.length;
        }, 0);

        const testedCount = allTests.filter(
          (t) => t.status && t.status !== 'Not Tested',
        ).length;

        const testingProgressPct =
          totalControls === 0
            ? 0
            : Math.round((testedCount / totalControls) * 100);

        const riskCounts = allTests.reduce(
          (acc, t) => {
            if (t.status === 'Non-Compliant') acc.high += 1;
            else if (t.status === 'Partially Compliant') acc.medium += 1;
            else if (t.status === 'Compliant') acc.low += 1;
            return acc;
          },
          { high: 0, medium: 0, low: 0 },
        );

        const frameworkCoverage = frameworks.map((fw) => {
          const frameworkControls = controlsByFramework[fw] || [];
          const frameworkTotal = frameworkControls.length;

          const frameworkTests = allTests.filter(
            (t) => t.framework === fw && t.status,
          );
          const compliantCount = frameworkTests.filter(
            (t) => t.status === 'Compliant',
          ).length;
          const testedForFramework = frameworkTests.filter(
            (t) => t.status && t.status !== 'Not Tested',
          ).length;

          const coveragePct =
            frameworkTotal === 0
              ? 0
              : Math.round((testedForFramework / frameworkTotal) * 100);

          return {
            name: fw,
            totalControls: frameworkTotal,
            compliantControls: compliantCount,
            coveragePct,
          };
        });

        const findings = allTests
          .filter(
            (t) =>
              t.status === 'Non-Compliant' ||
              t.status === 'Partially Compliant',
          )
          .slice(0, 10)
          .map((t) => ({
            id: t.id,
            controlId: t.controlId,
            status: t.status,
            auditName: t.auditName,
            framework: t.framework,
          }));

        setMetrics({
          overallCompliancePct,
          testingProgressPct,
          riskCounts,
          frameworkCoverage,
          findings,
        });
      } catch (err) {
        setDashError('Unable to load dashboard metrics');
      } finally {
        setDashLoading(false);
      }
    };

    buildDashboard();
  }, []);

  return (
    <div className="page">
      <section className="page-header">
        <h1>Audit &amp; Compliance Dashboard</h1>
        <p>
          Real-time insights into audit progress, control testing status, and
          open findings for your organization.
        </p>
      </section>

      <section className="panel">
        {dashLoading && <p>Loading dashboard metrics...</p>}
        {!dashLoading && dashError && (
          <p className="text-error">{dashError}</p>
        )}

        {!dashLoading && !dashError && metrics && (
          <>
            <div className="cards-grid" style={{ marginTop: '0.5rem' }}>
              <div className="card">
                <h3>Overall Compliance</h3>
                <p className="muted">
                  Percentage of tested controls that are assessed as compliant.
                </p>
                <div
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: 600,
                    margin: '0.5rem 0',
                  }}
                >
                  {metrics.overallCompliancePct}%
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '0.6rem',
                    borderRadius: '999px',
                    background: 'var(--bg-subtle)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${metrics.overallCompliancePct}%`,
                      height: '100%',
                      background:
                        metrics.overallCompliancePct >= 80
                          ? 'var(--green-500, #16a34a)'
                          : metrics.overallCompliancePct >= 50
                          ? 'var(--amber-500, #f59e0b)'
                          : 'var(--red-500, #dc2626)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              <div className="card">
                <h3>Control Testing Progress</h3>
                <p className="muted">
                  Portion of controls that have been tested across all active
                  audits.
                </p>
                <div
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: 600,
                    margin: '0.5rem 0',
                  }}
                >
                  {metrics.testingProgressPct}%
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '0.6rem',
                    borderRadius: '999px',
                    background: 'var(--bg-subtle)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${metrics.testingProgressPct}%`,
                      height: '100%',
                      background: 'var(--primary, #4f46e5)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              <div className="card">
                <h3>Risk Distribution</h3>
                <p className="muted">
                  Distribution of control test results by risk level.
                </p>
                <div style={{ marginTop: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.35rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        width: '0.7rem',
                        height: '0.7rem',
                        borderRadius: '999px',
                        background: '#dc2626',
                      }}
                    />
                    <span>High (Non-Compliant): {metrics.riskCounts.high}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.35rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        width: '0.7rem',
                        height: '0.7rem',
                        borderRadius: '999px',
                        background: '#f59e0b',
                      }}
                    />
                    <span>
                      Medium (Partially Compliant): {metrics.riskCounts.medium}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        width: '0.7rem',
                        height: '0.7rem',
                        borderRadius: '999px',
                        background: '#16a34a',
                      }}
                    />
                    <span>Low (Compliant): {metrics.riskCounts.low}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3>Framework Coverage</h3>
                <p className="muted">
                  How well key frameworks are covered by control testing.
                </p>
                {metrics.frameworkCoverage.length === 0 && (
                  <p style={{ marginTop: '0.75rem' }}>
                    No framework data available yet.
                  </p>
                )}
                {metrics.frameworkCoverage.length > 0 && (
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      marginTop: '0.75rem',
                    }}
                  >
                    {metrics.frameworkCoverage.map((fw) => (
                      <li
                        key={fw.name}
                        style={{ marginBottom: '0.4rem' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.9rem',
                          }}
                        >
                          <span>{fw.name}</span>
                          <span>
                            {fw.coveragePct}% tested · {fw.compliantControls}/
                            {fw.totalControls} compliant
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '0.4rem',
                            borderRadius: '999px',
                            background: 'var(--bg-subtle)',
                            overflow: 'hidden',
                            marginTop: '0.25rem',
                          }}
                        >
                          <div
                            style={{
                              width: `${fw.coveragePct}%`,
                              height: '100%',
                              background: 'var(--primary, #4f46e5)',
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h3>Open Audit Findings</h3>
              <p className="muted">
                Controls with non-compliant or partially compliant results.
              </p>
              {metrics.findings.length === 0 && (
                <p style={{ marginTop: '0.75rem' }}>
                  No open findings recorded yet.
                </p>
              )}
              {metrics.findings.length > 0 && (
                <div className="table-wrapper" style={{ marginTop: '0.75rem' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Audit</th>
                        <th>Framework</th>
                        <th>Control</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.findings.map((f) => (
                        <tr key={f.id || `${f.auditName}-${f.controlId}`}>
                          <td>{f.auditName}</td>
                          <td>{f.framework}</td>
                          <td>{f.controlId}</td>
                          <td>{f.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

