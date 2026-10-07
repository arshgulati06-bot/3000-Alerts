import React, { useState } from 'react';
import { Shield, LogIn, UserPlus, AlertTriangle, Loader2, WifiOff, Info } from 'lucide-react';
import { login, register } from '../services/api';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function LoginPage({ onAuthenticated, onOfflineDemo, backendOnline }) {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const validate = () => {
    if (mode === 'register' && fullName.trim().length < 2) return 'Enter your full name.';
    if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
    if (!password) return 'Enter your password.';
    if (mode === 'register' && password.length < 8) return 'Password must be at least 8 characters.';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    setBusy(true);
    setError('');
    try {
      const user = mode === 'login'
        ? await login(email.trim(), password)
        : await register(fullName.trim(), email.trim(), password);
      onAuthenticated(user);
    } catch (err) {
      setError(err.message || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next) => { setMode(next); setError(''); };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo"><Shield size={22} /></div>
          <div>
            <div className="auth-title">SWORDERS SOC</div>
            <div className="auth-sub">3,000 Alerts. One Analyst.</div>
          </div>
        </div>

        <div className="auth-tabs" role="tablist">
          <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Sign in</button>
          <button role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Create account</button>
        </div>

        <form onSubmit={submit} noValidate className="auth-form">
          {mode === 'register' && (
            <label>
              <span>Full name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Jordan Analyst" />
            </label>
          )}
          <label>
            <span>Work email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="analyst@sworders.demo" autoFocus />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'register' ? 'Minimum 8 characters' : '••••••••'} />
          </label>

          {error && (
            <div className="auth-error" role="alert"><AlertTriangle size={14} /><span>{error}</span></div>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : mode === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
            <span>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account & sign in'}</span>
          </button>
        </form>

        <div className="auth-hint">
          <Info size={13} />
          <span>Demo account: <code>analyst@sworders.demo</code> / <code>SwordersDemo2026</code> (see README).</span>
        </div>

        {!backendOnline && (
          <div className="auth-offline">
            <div><WifiOff size={13} /> <span>The SOC API is not reachable, so sign-in is unavailable.</span></div>
            <button className="btn btn-secondary btn-sm" onClick={onOfflineDemo}>Continue in offline demo mode</button>
          </div>
        )}
      </div>
    </div>
  );
}
