import React, { useState } from 'react';
import { uploadEvidence } from '../services/apiService';

const EvidenceUpload = () => {
  const [controlId, setControlId] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      await uploadEvidence({
        controlId,
        description,
        fileName,
      });
      setMessage('Evidence submitted (placeholder, no real storage yet).');
      setControlId('');
      setDescription('');
      setFileName('');
    } catch (error) {
      setMessage('Failed to submit evidence.');
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
            <label htmlFor="controlId">Control ID</label>
            <input
              id="controlId"
              type="text"
              value={controlId}
              onChange={(e) => setControlId(e.target.value)}
              placeholder="e.g. ISO27001-A.12.1.1"
              required
            />
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

        {message && <p className="form-message">{message}</p>}
      </section>
    </div>
  );
};

export default EvidenceUpload;

