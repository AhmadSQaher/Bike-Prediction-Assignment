import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <section className="home" style={{ 
      padding: '40px 20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      textAlign: 'center'
    }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #011b37 0%, #022a56 100%)',
        color: 'white',
        padding: '60px 40px',
        borderRadius: '15px',
        marginBottom: '40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '48px', 
          marginBottom: '20px',
          fontWeight: 'bold',
          textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
          color: '#f8f9fa'
        }}>
          🚴 Bike Recovery AI
        </h1>
        <p style={{ 
          fontSize: '20px', 
          lineHeight: '1.6',
          maxWidth: '800px',
          margin: '0 auto 30px',
          opacity: '0.95'
        }}>
          Predict the likelihood of your stolen bicycle being recovered using advanced machine learning 
          models trained on real Toronto Police Service data.
        </p>
        
        {user ? (
          user.role !== 'admin' ? (
            <Link 
              to="/predict" 
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '30px',
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: 'bold',
                border: '2px solid rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🔮 Start Prediction
            </Link>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '30px',
              borderRadius: '15px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: '24px' }}>👨‍💼 Admin Dashboard</h3>
              <p style={{ marginBottom: '25px', fontSize: '16px', opacity: '0.9' }}>
                Welcome, admin! Manage the system and data from your dashboard.
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link 
                  to="/admin/users" 
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '12px 25px',
                    borderRadius: '25px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    display: 'inline-block',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  👥 Manage Users
                </Link>
                <Link 
                  to="/admin/data" 
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '12px 25px',
                    borderRadius: '25px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    display: 'inline-block',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  📊 Upload Data
                </Link>
              </div>
            </div>
          )
        ) : (
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/register" 
              style={{
                background: '#007bff',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '30px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
            >
              📝 Get Started - Register
            </Link>
            <Link 
              to="/login" 
              style={{
                background: 'transparent',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '30px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                border: '2px solid rgba(255,255,255,0.5)',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
            >
              🔐 Login
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: '#f8f9fa',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
          border: '1px solid #022a56'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🤖</div>
          <h3 style={{ color: '#011b37', marginBottom: '15px' }}>AI-Powered Predictions</h3>
          <p style={{ color: '#6c757d', lineHeight: '1.6' }}>
            Our advanced machine learning models analyze multiple factors to predict recovery likelihood 
            with high accuracy.
          </p>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
          border: '1px solid #022a56'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
          <h3 style={{ color: '#011b37', marginBottom: '15px' }}>Real Police Data</h3>
          <p style={{ color: '#6c757d', lineHeight: '1.6' }}>
            Trained on authentic Toronto Police Service theft records for maximum reliability 
            and real-world accuracy.
          </p>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
          border: '1px solid #022a56'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>💡</div>
          <h3 style={{ color: '#011b37', marginBottom: '15px' }}>Personalized Advice</h3>
          <p style={{ color: '#6c757d', lineHeight: '1.6' }}>
            Get tailored recommendations and actionable next steps based on your specific 
            theft circumstances.
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{
        background: 'linear-gradient(135deg, #022a56 0%, #007bff 100%)',
        color: 'white',
        padding: '40px',
        borderRadius: '15px',
        marginBottom: '40px'
      }}>
        <h2 style={{ marginBottom: '30px', fontSize: '32px' }}>🔍 How It Works</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>1️⃣</div>
            <h4>Input Details</h4>
            <p style={{ fontSize: '14px', opacity: '0.9' }}>Enter theft information</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>2️⃣</div>
            <h4>AI Analysis</h4>
            <p style={{ fontSize: '14px', opacity: '0.9' }}>Our models process the data</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>3️⃣</div>
            <h4>Get Results</h4>
            <p style={{ fontSize: '14px', opacity: '0.9' }}>Receive probability & advice</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>4️⃣</div>
            <h4>Take Action</h4>
            <p style={{ fontSize: '14px', opacity: '0.9' }}>Follow personalized tips</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{
        background: '#ffffff',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
        border: '2px solid #022a56'
      }}>
        <h2 style={{ color: '#011b37', marginBottom: '30px' }}>📈 Platform Statistics</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>85%</div>
            <p style={{ color: '#6c757d' }}>Model Accuracy</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#011b37' }}>10K+</div>
            <p style={{ color: '#6c757d' }}>Training Records</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#022a56' }}>2</div>
            <p style={{ color: '#6c757d' }}>ML Models</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>24/7</div>
            <p style={{ color: '#6c757d' }}>Available</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;