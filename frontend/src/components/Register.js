// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' // Default to user role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Social signup modal state (simple/test-mode flow)
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState('');
  const [socialName, setSocialName] = useState('');
  const [socialEmail, setSocialEmail] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);
  const [existingEmailModal, setExistingEmailModal] = useState({ open: false, email: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSocialStart = (provider) => {
    // In production this would redirect to the provider's OAuth flow.
    // For dev/test we open a small modal to accept an email/name that will be used to create the account.
    setSocialProvider(provider);
    setSocialName('');
    setSocialEmail('');
    setSocialOpen(true);
  };

  const randomPassword = (len = 12) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  const handleSocialSubmit = async (e) => {
    e.preventDefault();
    setSocialLoading(true);
    setError('');
    try {
      // Create account using normal register endpoint with a random password (social accounts should be linked in production)
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // Dev/test flow: use a predictable default password for created social test accounts
        body: JSON.stringify({ name: socialName || 'Social User', email: socialEmail, password: 'password', role: 'user' })
      });
      const d = await res.json().catch(()=>({}));
      if (!res.ok) {
        // If backend indicates email already exists, show modal linking to forgot password
        const msg = (d.error || d.message || 'Social registration failed').toString();
        const lower = msg.toLowerCase();
        if (lower.includes('user already exists') || lower.includes('already exists') || (lower.includes('email') && lower.includes('exists'))) {
          setExistingEmailModal({ open: true, email: socialEmail });
        } else {
          setError(msg);
        }
        setSocialLoading(false);
        return;
      }
      setSocialOpen(false);
      setSuccess(`Registered via ${socialProvider}. Please login to continue.`);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError('Network error during social signup');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Please login.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // If email exists, show modal with link to forgot password page
        const msg = (data.error || data.message || 'Registration failed').toString();
        const lower = msg.toLowerCase();
        if (lower.includes('user already exists') || lower.includes('already exists') || (lower.includes('email') && lower.includes('exists'))) {
          setExistingEmailModal({ open: true, email: formData.email });
        } else {
          setError(msg);
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="register">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        {success && <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}
        
        <input
          name="name"
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={loading}
        />
        
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />
        
        <input
          name="password"
          type="password"
          placeholder="Password (min 6 characters)"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
          minLength={6}
        />
        
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={loading}
        />
        
        <div style={{ margin: '15px 0', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
            Account Type:
          </label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="role"
                value="user"
                checked={formData.role === 'user'}
                onChange={handleChange}
                disabled={loading}
              />
              <span>👤 User</span>
              <small style={{ color: '#666', marginLeft: '5px' }}>(Make predictions)</small>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="role"
                value="admin"
                checked={formData.role === 'admin'}
                onChange={handleChange}
                disabled={loading}
              />
              <span>👨‍💼 Admin</span>
              <small style={{ color: '#666', marginLeft: '5px' }}>(Manage system)</small>
            </label>
          </div>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Login here</Link>
        </div>
        
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ marginBottom: 8, color: '#555' }}>Or register with</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button type="button" className="btn-view" onClick={() => handleSocialStart('Google')}>Continue with Google</button>
            <button type="button" className="btn-view" onClick={() => handleSocialStart('Facebook')}>Continue with Facebook</button>
          </div>
          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>Note: social signup in this dev build uses a test flow. In production this will use real OAuth.</div>
        </div>
      </form>

      {socialOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', left:0, right:0, top:0, bottom:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', padding:20, borderRadius:8, width:360 }}>
            <h3 style={{ marginTop:0 }}>Continue with {socialProvider} (test flow)</h3>
            <p style={{ color:'#555' }}>Enter the email and name you want associated with this social account (dev-only flow).</p>
            <form onSubmit={handleSocialSubmit}>
              <input required placeholder="Full name" value={socialName} onChange={e=>setSocialName(e.target.value)} />
              <input required type="email" placeholder="Email" value={socialEmail} onChange={e=>setSocialEmail(e.target.value)} />
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
                <button type="button" className="btn-delete" onClick={() => setSocialOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={socialLoading}>{socialLoading ? 'Registering...' : `Register with ${socialProvider}`}</button>
              </div>
            </form>
          </div>
        </div>
      )}

          {existingEmailModal.open && (
            <div className="modal-overlay" style={{ position: 'fixed', left:0, right:0, top:0, bottom:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ background:'#fff', padding:20, borderRadius:8, width:360 }}>
                <h3 style={{ marginTop:0 }}>Email already registered</h3>
                <p style={{ color:'#555' }}>A user with that email ({existingEmailModal.email}) already exists. Did you <a href="/forgot-password" style={{ color:'#007bff', textDecoration:'underline' }}>forget your password?</a></p>
                <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
                  <button type="button" className="btn-delete" onClick={() => setExistingEmailModal({ open:false, email: '' })}>Close</button>
                </div>
              </div>
            </div>
          )}
    </section>
  );
};

export default Register;