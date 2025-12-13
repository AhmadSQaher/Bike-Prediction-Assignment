import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { validateEmail, validatePassword, displayApiErrors } from '../utils/validation';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    // Validate email
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        // Update the user state in App.js
        setUser(data.user);
        // Route based on user role
        if (data.user.role === 'admin') {
          navigate('/');  // Admin users go to home page
        } else {
          navigate('/predict');  // Regular users go to prediction page
        }
      } else {
        // Handle API errors
        if (response.status === 400 && data.details) {
          // Field-specific errors from API
          const fieldErrors = {};
          Object.entries(data.details).forEach(([field, message]) => {
            if (field === 'email') fieldErrors.email = message;
            if (field === 'password') fieldErrors.password = message;
          });
          setErrors(fieldErrors);
        } else {
          // General error
          setGeneralError(data.error || 'Login failed');
        }
      }
    } catch (error) {
      setGeneralError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle field change with validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear email error when user starts typing
    if (errors.email) {
      const newErrors = { ...errors };
      delete newErrors.email;
      setErrors(newErrors);
    }
    
    // Clear general error
    if (generalError) {
      setGeneralError('');
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear password error when user starts typing
    if (errors.password) {
      const newErrors = { ...errors };
      delete newErrors.password;
      setErrors(newErrors);
    }
    
    // Clear general error
    if (generalError) {
      setGeneralError('');
    }
  };

  return (
    <section className="login">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        
        {/* General Error */}
        {generalError && (
          <div className="error-message" style={{ 
            color: 'red', 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#fee',
            borderRadius: '4px',
            border: '1px solid #fcc'
          }}>
            {generalError}
          </div>
        )}
        
        {/* Email Field */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${errors.email ? 'red' : '#ccc'}`,
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          {errors.email && (
            <div style={{ 
              color: 'red', 
              fontSize: '14px', 
              marginTop: '5px' 
            }}>
              {errors.email}
            </div>
          )}
        </div>
        
        {/* Password Field */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${errors.password ? 'red' : '#ccc'}`,
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          {errors.password && (
            <div style={{ 
              color: 'red', 
              fontSize: '14px', 
              marginTop: '5px' 
            }}>
              {errors.password}
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <Link to="/forgot-password" style={{ color: '#007bff', textDecoration: 'none' }}>
            Forgot Password?
          </Link>
        </div>
        
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          Don't have an account? <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Register here</Link>
        </div>
      </form>
    </section>
  );
};

export default Login;