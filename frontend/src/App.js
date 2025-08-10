import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import PredictionForm from './components/PredictionForm';
import ResponseDisplay from './components/ResponseDisplay';
import InteractiveMap from './components/InteractiveMap';
import Profile from './components/Profile';
import UserManagement from './components/UserManagement';
import DataUpload from './components/DataUpload';
import About from './components/About';
import References from './components/References';
import Footer from './components/Footer';

// Protected Route Component for Users
const ProtectedUserRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  
  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  
  if (userData.role !== 'user') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Restricted</h2>
        <p>This feature is only available to regular users.</p>
      </div>
    );
  }
  
  return children;
};

// Protected Route Component for Admins
const ProtectedAdminRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  
  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  
  if (userData.role !== 'admin') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Restricted</h2>
        <p>This feature is only available to administrators.</p>
      </div>
    );
  }
  
  return children;
};

function App() {
  const [response, setResponse] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();

  const hideStaticContent = ['/login', '/register', '/forgot-password', '/reset-password', '/predict', '/result', '/map', '/profile', '/admin/users', '/admin/data'].includes(location.pathname);

  useEffect(() => {
    // Check authentication status on app load
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <div className="main-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected User Routes */}
          <Route 
            path="/predict" 
            element={
              <ProtectedUserRoute>
                <PredictionForm setResponse={setResponse} />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/result" 
            element={
              <ProtectedUserRoute>
                <ResponseDisplay response={response} />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/map" 
            element={
              <ProtectedUserRoute>
                <InteractiveMap />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedUserRoute>
                <Profile user={user} setUser={setUser} />
              </ProtectedUserRoute>
            } 
          />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin/users" 
            element={
              <ProtectedAdminRoute>
                <UserManagement />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/data" 
            element={
              <ProtectedAdminRoute>
                <DataUpload />
              </ProtectedAdminRoute>
            } 
          />
        </Routes>

        {!hideStaticContent && (
          <>
            <About />
            <References />
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

export default App;