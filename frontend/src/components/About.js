import React from 'react';

const About = () => {
  return (
    <section id="about" className="about" style={{
      padding: '40px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
        border: '2px solid #022a56'
      }}>
        <h2 style={{
          color: '#011b37',
          marginBottom: '30px',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          🚴 About Stolen Bike Predictor
        </h2>
        <p style={{
          fontSize: '18px',
          lineHeight: '1.8',
          color: '#495057',
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'left'
        }}>
          This application predicts the likelihood of a stolen bicycle being recovered using advanced machine learning algorithms. 
          The model is trained on a comprehensive dataset from the Toronto Police Service, incorporating real-world theft and recovery 
          data to provide accurate predictions. By analyzing key factors such as location, time, bike characteristics, and theft 
          circumstances, our AI system delivers personalized recovery probability assessments along with actionable recommendations 
          to maximize the chances of bike recovery.
        </p>
      </div>
    </section>
  );
};

export default About;
