import React, { useEffect, useState } from 'react';
import {
  getAudits,
  createAudit,
  updateAudit,
  getControls,
  getControlTests,
  saveControlTest,
} from '../services/apiService';

const AuditPage = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [framework, setFramework] = useState('ISO 27001');
  const [timeline, setTimeline] = useState('');

  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [controls, setControls] = useState([]);
  const [controlTests, setControlTests] = useState([]);
  const [controlsLoading, setControlsLoading] = useState(false);
  const [controlsError, setControlsError] = useState(null);

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

  const resetForm = () => {
    setName('');
    setScope('');
    setTeamMembers('');
    setFramework('ISO 27001');
    setTimeline('');
    setFormError(null);
  };

  const handleCreateAudit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        name,
        scope,
        teamMembers,
        framework,
        timeline,
      };

      const created = await createAudit(payload);
      setAudits((prev) => [...prev, created]);
      resetForm();
      setCreating(false);
    } catch (err) {
      setFormError(
        err?.message || 'Failed to create audit project. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleProgressChange = async (audit, newProgress) => {
    const parsed = Number(newProgress);
    if (Number.isNaN(parsed)) return;

    const clamped = Math.max(0, Math.min(100, parsed));

    // optimistic update
    setAudits((prev) =>
      prev.map((a) => (a.id === audit.id ? { ...a, progress: clamped } : a)),
    );

    try {
      await updateAudit(audit.id, { progress: clamped });
    } catch {
      // revert on error
      setAudits((prev) =>
        prev.map((a) => (a.id === audit.id ? audit : a)),
      );
    }
  };

  const handleStatusChange = async (audit, newStatus) => {
    // optimistic update
    setAudits((prev) =>
      prev.map((a) => (a.id === audit.id ? { ...a, status: newStatus } : a)),
    );

    try {
      await updateAudit(audit.id, { status: newStatus });
    } catch {
      setAudits((prev) =>
        prev.map((a) => (a.id === audit.id ? audit : a)),
      );
    }
  };

  const loadControlsForAudit = async (audit) => {
    if (!audit) return;
    setControlsLoading(true);
    setControlsError(null);

    try {
      const [controlsRes, testsRes] = await Promise.all([
        getControls(audit.framework),
        getControlTests(audit.id),
      ]);

      setControls(controlsRes.items || []);
      setControlTests(testsRes.items || []);
    } catch (err) {
      setControlsError('Unable to load controls for this audit.');
      setControls([]);
      setControlTests([]);
    } finally {
      setControlsLoading(false);
    }
  };

  const handleSelectAudit = (audit) => {
    setSelectedAuditId(audit.id);
    loadControlsForAudit(audit);
  };

  const getTestForControl = (controlId) =>
    controlTests.find((t) => t.controlId === controlId) || null;

  const handleControlStatusChange = async (control, newStatus) => {
    if (!selectedAuditId) return;

    // optimistic update
    setControlTests((prev) => {
      const existingIndex = prev.findIndex(
        (t) => t.controlId === control.id && t.auditId === selectedAuditId,
      );
      const base = {
        auditId: selectedAuditId,
        controlId: control.id,
        status: newStatus,
        notes: existingIndex !== -1 ? prev[existingIndex].notes : '',
        evidenceReference:
          existingIndex !== -1 ? prev[existingIndex].evidenceReference : '',
      };

      if (existingIndex !== -1) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], ...base };
        return copy;
      }

      return [
        ...prev,
        {
          id: `temp-${control.id}`,
          ...base,
        },
      ];
    });

    try {
      const saved = await saveControlTest(selectedAuditId, {
        controlId: control.id,
        status: newStatus,
      });

      setControlTests((prev) => {
        const existingIndex = prev.findIndex(
          (t) => t.controlId === control.id && t.auditId === selectedAuditId,
        );
        if (existingIndex === -1) {
          return [...prev, saved];
        }
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], ...saved };
        return copy;
      });
    } catch {
      const audit = audits.find((a) => a.id === selectedAuditId);
      if (audit) {
        loadControlsForAudit(audit);
      }
    }
  };

  const handleControlNotesChange = async (control, newNotes) => {
    if (!selectedAuditId) return;

    const current = getTestForControl(control.id);
    const status = current?.status || 'Not Tested';

    // optimistic update
    setControlTests((prev) => {
      const existingIndex = prev.findIndex(
        (t) => t.controlId === control.id && t.auditId === selectedAuditId,
      );
      const base = {
        auditId: selectedAuditId,
        controlId: control.id,
        status,
        notes: newNotes,
        evidenceReference: current?.evidenceReference || '',
      };

      if (existingIndex !== -1) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], ...base };
        return copy;
      }

      return [
        ...prev,
        {
          id: `temp-${control.id}`,
          ...base,
        },
      ];
    });

    try {
      const saved = await saveControlTest(selectedAuditId, {
        controlId: control.id,
        status,
        notes: newNotes,
      });

      setControlTests((prev) => {
        const existingIndex = prev.findIndex(
          (t) => t.controlId === control.id && t.auditId === selectedAuditId,
        );
        if (existingIndex === -1) {
          return [...prev, saved];
        }
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], ...saved };
        return copy;
      });
    } catch {
      const audit = audits.find((a) => a.id === selectedAuditId);
      if (audit) {
        loadControlsForAudit(audit);
      }
    }
  };

  const handleExportControlReport = () => {
    if (!selectedAuditId || controls.length === 0) return;

    const audit = audits.find((a) => a.id === selectedAuditId);
    const auditName = audit?.name || `audit-${selectedAuditId}`;

    const header = [
      'Audit Name',
      'Framework',
      'Control ID',
      'Title',
      'Status',
      'Notes',
      'Control Description',
      'Required Evidence',
      'Control Objectives',
    ];

    const escapeCsv = (value) => {
      if (value == null) return '';
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = controls.map((control) => {
      const test = getTestForControl(control.id);
      const requiredEvidence = (control.requiredEvidence || []).join(' | ');

      return [
        auditName,
        audit?.framework || '',
        control.id,
        control.title,
        test?.status || 'Not Tested',
        test?.notes || '',
        control.description || '',
        requiredEvidence,
        control.controlObjectives || '',
      ].map(escapeCsv);
    });

    const csvLines = [header.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))];
    const csvContent = csvLines.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const safeName = auditName.replace(/[^a-z0-9-_]+/gi, '_');
    link.href = url;
    link.download = `${safeName}_control_testing_report.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <section className="page-header">
        <h1>Audit Projects</h1>
        <p>
          Create and manage IT audit engagements, including scope, assigned
          team, frameworks, and timelines.
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Audit Project Management</h2>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              if (!creating) {
                resetForm();
              }
              setCreating((open) => !open);
            }}
          >
            {creating ? 'Cancel' : 'New Audit Project'}
          </button>
        </div>

        {creating && (
          <form className="form" onSubmit={handleCreateAudit}>
            <div className="form-row">
              <label htmlFor="audit-name">Audit name</label>
              <input
                id="audit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ISO 27001 Certification 2026"
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="audit-scope">Scope of systems</label>
              <textarea
                id="audit-scope"
                rows={3}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="e.g. Data center, corporate network, cloud workloads in Azure..."
              />
            </div>

            <div className="form-row">
              <label htmlFor="audit-team">Assigned audit team members</label>
              <input
                id="audit-team"
                type="text"
                value={teamMembers}
                onChange={(e) => setTeamMembers(e.target.value)}
                placeholder="e.g. Fatima (Lead), Ahmed, Sara"
              />
            </div>

            <div className="form-row">
              <label htmlFor="audit-framework">Framework used</label>
              <select
                id="audit-framework"
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
              >
                <option value="ISO 27001">ISO 27001</option>
                <option value="NIST CSF">NIST</option>
                <option value="COBIT">COBIT</option>
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="audit-timeline">Audit timeline</label>
              <input
                id="audit-timeline"
                type="text"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g. Jan 2026 – Apr 2026"
              />
            </div>

            {formError && <p className="text-error">{formError}</p>}

            <div className="form-actions">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Audit'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="panel" style={{ marginTop: '1.4rem' }}>
        <div className="panel-header">
          <h2>Active Audits</h2>
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
                  <th>Team</th>
                  <th>Timeline</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 && (
                  <tr>
                    <td colSpan={7}>No audits yet. Add your first audit.</td>
                  </tr>
                )}
                {audits.map((audit) => (
                  <tr
                    key={audit.id}
                    className={
                      audit.id === selectedAuditId ? 'table-row-selected' : ''
                    }
                    onClick={() => handleSelectAudit(audit)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{audit.name}</td>
                    <td>{audit.framework}</td>
                    <td>{audit.scope}</td>
                    <td>{audit.teamMembers}</td>
                    <td>{audit.timeline}</td>
                    <td>
                      <select
                        value={audit.status || 'Planned'}
                        onChange={(e) =>
                          handleStatusChange(audit, e.target.value)
                        }
                      >
                        <option value="Planned">Planned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={audit.progress ?? 0}
                        onChange={(e) =>
                          handleProgressChange(audit, e.target.value)
                        }
                        style={{ width: '4rem' }}
                      />{' '}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {selectedAuditId && (
        <section className="panel" style={{ marginTop: '1.4rem' }}>
          <div className="panel-header">
            <h2>Control Library &amp; Testing</h2>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExportControlReport}
              disabled={controlsLoading || controls.length === 0}
            >
              Export control testing (CSV)
            </button>
          </div>

          {controlsLoading && <p>Loading controls for this audit...</p>}
          {!controlsLoading && controlsError && (
            <p className="text-error">{controlsError}</p>
          )}

          {!controlsLoading && !controlsError && (
            <>
              <p className="muted">
                The library below is preloaded with representative controls from
                ISO 27001, NIST CSF and COBIT, including control IDs,
                descriptions, required evidence and control objectives. Use the
                status and notes fields to record your testing results.
              </p>

              <div className="table-wrapper" style={{ marginTop: '1rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Control ID</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Required Evidence</th>
                      <th>Control Objectives</th>
                      <th>Status</th>
                      <th>Notes / Evidence Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controls.length === 0 && (
                      <tr>
                        <td colSpan={7}>
                          No controls are defined for this framework yet.
                        </td>
                      </tr>
                    )}
                    {controls.map((control) => {
                      const test = getTestForControl(control.id);
                      return (
                        <tr key={control.id}>
                          <td>{control.id}</td>
                          <td>{control.title}</td>
                          <td>{control.description}</td>
                          <td>
                            <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                              {(control.requiredEvidence || []).map((ev) => (
                                <li key={ev}>{ev}</li>
                              ))}
                            </ul>
                          </td>
                          <td>{control.controlObjectives}</td>
                          <td>
                            <select
                              value={test?.status || 'Not Tested'}
                              onChange={(e) =>
                                handleControlStatusChange(
                                  control,
                                  e.target.value,
                                )
                              }
                            >
                              <option value="Not Tested">Not Tested</option>
                              <option value="Compliant">Compliant</option>
                              <option value="Partially Compliant">
                                Partially Compliant
                              </option>
                              <option value="Non-Compliant">
                                Non-Compliant
                              </option>
                            </select>
                          </td>
                          <td>
                            <textarea
                              rows={3}
                              value={test?.notes || ''}
                              onChange={(e) =>
                                handleControlNotesChange(
                                  control,
                                  e.target.value,
                                )
                              }
                              placeholder="Summarize test steps, key observations, and reference to uploaded evidence."
                              style={{ width: '100%' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default AuditPage;

