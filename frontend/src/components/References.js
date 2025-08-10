import React from 'react';

const References = () => {
  return (
    <section id="references" className="references" style={{
      padding: '40px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
        border: '2px solid #022a56'
      }}>
        <h2 style={{
          color: '#011b37',
          marginBottom: '25px',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          📚 References
        </h2>
        
        <div style={{
          textAlign: 'left',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '10px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            fontSize: '15px',
            lineHeight: '1.6'
          }}>
            <div>
              <h4 style={{ color: '#022a56', marginBottom: '10px' }}>📊 Data Source</h4>
              <p style={{ margin: '0', color: '#495057' }}>
                Toronto Police Service - Bicycle Thefts Open Data (10,000+ records)
              </p>
            </div>
            
            <div>
              <h4 style={{ color: '#022a56', marginBottom: '10px' }}>🐍 Backend</h4>
              <p style={{ margin: '0', color: '#495057' }}>
                Python, Flask, scikit-learn, CatBoost, pandas, matplotlib
              </p>
            </div>
            
            <div>
              <h4 style={{ color: '#022a56', marginBottom: '10px' }}>⚛️ Frontend</h4>
              <p style={{ margin: '0', color: '#495057' }}>
                React.js, React Router, CSS3, Responsive Design
              </p>
            </div>
            
            <div>
              <h4 style={{ color: '#022a56', marginBottom: '10px' }}>🏗️ Architecture</h4>
              <p style={{ margin: '0', color: '#495057' }}>
                Full-stack web app, RESTful API, Session-based auth, ML models
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default References;
