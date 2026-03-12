import React, { useState } from 'react';
import { signup } from '../services/authService';

export const SignupPage = ({ onSignup }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await signup(name, email, password);
      if (onSignup) {
        onSignup(user);
      }
    } catch (err) {
      setError(err?.message || 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page-auth">
      <section className="page-header">
        <h1>Create your TrustAudit account</h1>
        <p>
          Set up an account to start managing IT audits, evidence, and control testing in
          a single workspace.
        </p>
      </section>

      <section className="panel">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Smith"
            />
          </div>

          <div className="form-row">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
            />
          </div>

          {error && <p className="text-error">{error}</p>}

          <div className="form-actions">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

