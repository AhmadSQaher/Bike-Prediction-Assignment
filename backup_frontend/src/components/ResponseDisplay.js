import React, { useState } from 'react';

const ResponseDisplay = ({ response }) => {
  const [emailFormat, setEmailFormat] = useState('text');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  const sendEmail = async () => {
    setEmailLoading(true);
    setEmailMessage('');

    try {
      const emailResponse = await fetch('http://localhost:5000/api/send-prediction-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prediction_data: response,
          format: emailFormat
        }),
      });

      const data = await emailResponse.json();

      if (emailResponse.ok) {
        setEmailMessage('Email sent successfully!');
      } else {
        setEmailMessage(data.error || 'Failed to send email');
      }
    } catch (error) {
      setEmailMessage('Network error. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const getPredictionText = (prediction) => {
    return prediction === 1 ? 'Likely to be recovered' : 'Unlikely to be recovered';
  };

  const getConfidenceColor = (probability) => {
    if (probability > 0.7) return '#28a745'; // Green
    if (probability > 0.4) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  if (!response) {
    return (
      <div className="response-display">
        <h2>No Prediction Available</h2>
        <p>Please make a prediction first.</p>
      </div>
    );
  }

  return (
    <div className="response-display" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🚴 Bike Theft Recovery Prediction Results</h2>
      
      {response.error ? (
        <div className="error" style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
          <strong>Error:</strong> {response.error}
        </div>
      ) : (
        <>
          {/* Main Prediction Result */}
          <div className="prediction-result" style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '10px', 
            marginBottom: '20px',
            border: '2px solid #e9ecef'
          }}>
            <h3 style={{ 
              color: getConfidenceColor(response.probability?.recovered || response.recovered_probability_percent / 100),
              fontSize: '24px',
              marginBottom: '10px'
            }}>
              Prediction: {getPredictionText(response.prediction)}
            </h3>
            
            <div className="probability-details" style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
              <div className="recovery-prob" style={{ flex: 1 }}>
                <h4>Recovery Probability</h4>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold',
                  color: getConfidenceColor(response.probability?.recovered || response.recovered_probability_percent / 100)
                }}>
                  {response.recovered_probability_percent || (response.probability?.recovered * 100).toFixed(1)}%
                </div>
              </div>
              
              {response.probability && (
                <div className="not-recovery-prob" style={{ flex: 1 }}>
                  <h4>Not Recovered Probability</h4>
                  <div style={{ fontSize: '20px', color: '#6c757d' }}>
                    {(response.probability.not_recovered * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
            
            <p style={{ color: '#6c757d', fontSize: '14px' }}>
              Model Version: {response.model_version?.toUpperCase()} | 
              Prediction for: {response.user_email}
            </p>
          </div>

          {/* Personalized Advice Section */}
          {response.advice && response.advice.length > 0 && (
            <div className="advice-section" style={{ 
              backgroundColor: '#e7f3ff', 
              padding: '20px', 
              borderRadius: '10px', 
              marginBottom: '20px',
              border: '1px solid #b3d7ff'
            }}>
              <h3 style={{ color: '#0066cc', marginBottom: '15px' }}>
                💡 Personalized Advice & Recommendations
              </h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {response.advice.map((adviceItem, index) => (
                  <li key={index} style={{ 
                    padding: '8px 0', 
                    borderBottom: index < response.advice.length - 1 ? '1px solid #cce7ff' : 'none',
                    fontSize: '16px'
                  }}>
                    {adviceItem}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Email Results Section */}
          <div className="email-section" style={{ 
            backgroundColor: '#fff3cd', 
            padding: '20px', 
            borderRadius: '10px', 
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <h3 style={{ color: '#856404', marginBottom: '15px' }}>
              📧 Email Results
            </h3>
            <p style={{ marginBottom: '15px', color: '#856404' }}>
              Send these results to your email in different formats:
            </p>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="radio"
                  value="text"
                  checked={emailFormat === 'text'}
                  onChange={(e) => setEmailFormat(e.target.value)}
                />
                📄 Text Format
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="radio"
                  value="percentage"
                  checked={emailFormat === 'percentage'}
                  onChange={(e) => setEmailFormat(e.target.value)}
                />
                📊 Percentage Report
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="radio"
                  value="graph"
                  checked={emailFormat === 'graph'}
                  onChange={(e) => setEmailFormat(e.target.value)}
                />
                📈 Visual Report
              </label>
            </div>
            
            <button
              onClick={sendEmail}
              disabled={emailLoading}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: emailLoading ? 'not-allowed' : 'pointer',
                opacity: emailLoading ? 0.6 : 1
              }}
            >
              {emailLoading ? 'Sending...' : 'Send Email Results'}
            </button>
            
            {emailMessage && (
              <div style={{ 
                marginTop: '10px', 
                padding: '10px',
                backgroundColor: emailMessage.includes('success') ? '#d4edda' : '#f8d7da',
                color: emailMessage.includes('success') ? '#155724' : '#721c24',
                borderRadius: '5px'
              }}>
                {emailMessage}
              </div>
            )}
          </div>

          {/* Technical Details */}
          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#6c757d' }}>
              Technical Details
            </summary>
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
              <p><strong>Features Used:</strong> {response.featuresUsed?.length || 'N/A'} features</p>
              {response.featuresUsed && (
                <details style={{ marginTop: '10px' }}>
                  <summary>View Features</summary>
                  <ul style={{ marginTop: '10px', fontSize: '12px' }}>
                    {response.featuresUsed.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </details>
        </>
      )}
    </div>
  );
};

export default ResponseDisplay;
