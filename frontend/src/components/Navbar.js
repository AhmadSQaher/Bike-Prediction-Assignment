// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and update state
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="/logo.png" alt="Stolen Bike Predictor Logo" />
      </div>
      <div className="navbar-title">
        <h1>Stolen Bike Predictor</h1>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        
        {user ? (
          // Authenticated user links
          <>
            {user.role !== 'admin' && (
              <>
                <Link to="/predict">Bike Prediction</Link>
                <Link to="/map">Theft Map</Link>
              </>
            )}
            <span style={{ color: '#007bff', fontWeight: 'bold', marginRight: '10px' }}>
              Welcome, {user.name || user.email}
            </span>
            <button 
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: 'inherit'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          // Non-authenticated user links
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;