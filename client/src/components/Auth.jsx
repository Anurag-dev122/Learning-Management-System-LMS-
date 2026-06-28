import React, { useState } from 'react';
import { API } from '../utils/api';

export default function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('student@lms.com');
  const [password, setPassword] = useState('student123');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [parentStudentEmail, setParentStudentEmail] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/api/auth/login', { email, password });
      API.setSession(res.id, res.name, res.role);
      onAuthSuccess(res);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/api/auth/signup', { name, email, password, role, parentStudentEmail });
      alert("Account created successfully! Please log in.");
      setMode('login');
      setEmail(email);
      setPassword(password);
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="glass-card" style={{ width: '100%', maxWidth: '440px', margin: '20px' }}>
      {mode === 'login' ? (
        <>
          <h2 style={{ marginBottom: '24px', fontWeight: 800 }}>Sign In</h2>
          {error && <p style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '14px' }}>⚠️ {error}</p>}
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="student@lms.com" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" class="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              Log In
            </button>
          </form>
          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }} className="text-muted">
            Need an account?{' '}
            <span 
              onClick={() => { setMode('signup'); setEmail(''); setPassword(''); }}
              style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}
            >
              Create one
            </span>
          </p>
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong>Demo Logins:</strong><br />
            • Student: student@lms.com / student123<br />
            • Instructor: instructor@lms.com / instructor123<br />
            • Parent: parent@lms.com / parent123<br />
            • Admin: admin@lms.com / admin123
          </div>
        </>
      ) : (
        <>
          <h2 style={{ marginBottom: '24px', fontWeight: 800 }}>Create Account</h2>
          {error && <p style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '14px' }}>⚠️ {error}</p>}
          <form onSubmit={handleSignupSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                required 
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Account Role</label>
              <select 
                className="form-control"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            {role === 'parent' && (
              <div className="form-group">
                <label>Linked Student's Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="student@lms.com"
                  value={parentStudentEmail}
                  onChange={e => setParentStudentEmail(e.target.value)}
                />
              </div>
            )}
            <button type="submit" class="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              Sign Up
            </button>
          </form>
          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }} className="text-muted">
            Already have an account?{' '}
            <span 
              onClick={() => { setMode('login'); setEmail('student@lms.com'); setPassword('student123'); }}
              style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}
            >
              Sign In
            </span>
          </p>
        </>
      )}
    </div>
  );
}
