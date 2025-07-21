// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
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
        <Link to="/predict">Predict</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </nav>
  );
};

export default Navbar;