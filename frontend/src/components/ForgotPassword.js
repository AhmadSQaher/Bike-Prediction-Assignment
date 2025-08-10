import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset instructions have been sent to your email.');
        // In development, show the token
        if (data.reset_token) {
          setMessage(prevMessage => `${prevMessage} Token: ${data.reset_token}`);
        }
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="forgot-password">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        {message && <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>{message}</div>}
        
        <p style={{ marginBottom: '20px', textAlign: 'center', color: '#666' }}>
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        
        <input
          name="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
        
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </form>
    </section>
  );
};

export default ForgotPassword;
