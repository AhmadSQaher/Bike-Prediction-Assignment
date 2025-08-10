import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import PredictionForm from './components/PredictionForm';
import ResponseDisplay from './components/ResponseDisplay';
import InteractiveMap from './components/InteractiveMap';
import About from './components/About';
import References from './components/References';
import Footer from './components/Footer';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  
  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  
  // Prevent admin users from accessing prediction and map routes
  const isAdminRestrictedRoute = window.location.pathname === '/predict' || window.location.pathname === '/map';
  if (userData.role === 'admin' && isAdminRestrictedRoute) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Restricted</h2>
        <p>Admin users cannot access this feature.</p>
      </div>
    );
  }
  
  return children;
};

function App() {
  const [response, setResponse] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();

  const hideStaticContent = ['/login', '/register', '/forgot-password', '/predict', '/result', '/map'].includes(location.pathname);

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
          
          {/* Protected Routes */}
          <Route 
            path="/predict" 
            element={
              <ProtectedRoute>
                <PredictionForm setResponse={setResponse} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/result" 
            element={
              <ProtectedRoute>
                <ResponseDisplay response={response} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/map" 
            element={
              <ProtectedRoute>
                <InteractiveMap />
              </ProtectedRoute>
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