import React from 'react';

const ResponseDisplay = ({ response }) => {
  return (
    <div className="response-display">
      <h2>Prediction Response</h2>
      {response.error ? (
        <p className="error">{response.error}</p>
      ) : (
        <>
          <p>Recovery Likelihood: {response.recovered_probability_percent}%</p>
        </>
      )}
    </div>
  );
};

export default ResponseDisplay;
