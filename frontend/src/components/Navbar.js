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
      <div className="navbar-brand">
        <div className="navbar-logo">
          <img src="/logo.png" alt="Bike Recovery AI Logo" />
        </div>
        <div className="navbar-title">
          <h1>🚴 Bike Recovery AI</h1>
          <span className="navbar-subtitle">Smart Theft Prediction</span>
        </div>
      </div>
      
      <div className="navbar-center">
        <div className="navbar-nav">
          <Link to="/" className="nav-link">
            <span className="nav-icon">🏠</span>
            Home
          </Link>
          
          {user && user.role === 'user' && (
            <>
              <Link to="/predict" className="nav-link">
                <span className="nav-icon">🔮</span>
                Bike Prediction
              </Link>
              <Link to="/map" className="nav-link">
                <span className="nav-icon">🗺️</span>
                Theft Map
              </Link>
            </>
          )}
          
          {user && user.role === 'admin' && (
            <>
              <Link to="/admin/users" className="nav-link">
                <span className="nav-icon">👥</span>
                User Management
              </Link>
              <Link to="/admin/data" className="nav-link">
                <span className="nav-icon">📊</span>
                Data Upload
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="navbar-user">
        {user ? (
          <div className="user-section">
            <div className="user-info">
              <span className="user-greeting">Welcome,</span>
              <span className="user-name">{user.name || user.email}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="logout-btn"
            >
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="auth-link login-link">
              <span className="auth-icon">🔐</span>
              Login
            </Link>
            <Link to="/register" className="auth-link register-link">
              <span className="auth-icon">📝</span>
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;