import React, { useEffect, useState } from 'react';
import { createEvidence, getAudits, getControls } from '../services/apiService';

const EvidenceUpload = () => {
  const [auditId, setAuditId] = useState('');
  const [controlId, setControlId] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [audits, setAudits] = useState([]);
  const [auditsLoading, setAuditsLoading] = useState(true);
  const [auditsError, setAuditsError] = useState(null);
  const [controls, setControls] = useState([]);
  const [controlsLoading, setControlsLoading] = useState(false);
  const [controlsError, setControlsError] = useState(null);

  useEffect(() => {
    const loadAudits = async () => {
      try {
        const data = await getAudits();
        const items = data.items || [];
        setAudits(items);
        if (!auditId && items.length > 0) {
          setAuditId(items[0].id);
        }
      } catch (err) {
        setAuditsError('Unable to load audits. Please configure audits first.');
      } finally {
        setAuditsLoading(false);
      }
    };

    loadAudits();
  }, []);

  useEffect(() => {
    const loadControls = async () => {
      if (!auditId) {
        setControls([]);
        return;
      }
      const audit = audits.find((a) => a.id === auditId);
      if (!audit) {
        setControls([]);
        return;
      }

      setControlsLoading(true);
      setControlsError(null);

      try {
        const data = await getControls(audit.framework);
        const items = data.items || [];
        setControls(items);
        if (!controlId && items.length > 0) {
          setControlId(items[0].id);
        }
      } catch (err) {
        setControlsError('Unable to load controls for the selected audit.');
        setControls([]);
      } finally {
        setControlsLoading(false);
      }
    };

    loadControls();
  }, [auditId, audits, controlId]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      await createEvidence(auditId, {
        controlId,
        title: fileName || description,
        description,
        link: '',
        type: 'Document',
      });
      setMessage('Evidence submitted (placeholder, no real storage yet).');
      setAuditId('');
      setControlId('');
      setDescription('');
      setFileName('');
    } catch (error) {
      setMessage(
        error?.message || 'Failed to submit evidence. Please check the Audit ID and Control ID.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <section className="page-header">
        <h1>Evidence Submission</h1>
        <p>
          Attach policies, screenshots, logs, and reports and link them to the
          relevant security controls.
        </p>
      </section>

      <section className="panel">
        <h2>Upload Evidence</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="auditId">Audit project</label>
            <select
              id="auditId"
              value={auditId}
              onChange={(e) => setAuditId(e.target.value)}
              disabled={auditsLoading || audits.length === 0}
              required
            >
              {audits.length === 0 && (
                <option value="">
                  {auditsLoading
                    ? 'Loading audits...'
                    : 'No audits available yet'}
                </option>
              )}
              {audits.map((audit) => (
                <option key={audit.id} value={audit.id}>
                  {audit.name} ({audit.framework})
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="controlId">Control</label>
            <select
              id="controlId"
              value={controlId}
              onChange={(e) => setControlId(e.target.value)}
              disabled={
                !auditId || controlsLoading || controls.length === 0
              }
              required
            >
              {controls.length === 0 && (
                <option value="">
                  {controlsLoading
                    ? 'Loading controls...'
                    : 'No controls for this framework'}
                </option>
              )}
              {controls.map((control) => (
                <option key={control.id} value={control.id}>
                  {control.id} — {control.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the evidence you are providing."
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="file">Attachment</label>
            <input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
            />
            {fileName && <p className="muted">Selected: {fileName}</p>}
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Evidence'}
            </button>
          </div>
        </form>

        {auditsError && <p className="text-error">{auditsError}</p>}
        {controlsError && <p className="text-error">{controlsError}</p>}
        {message && <p className="form-message">{message}</p>}
      </section>
    </div>
  );
};

export default EvidenceUpload;

