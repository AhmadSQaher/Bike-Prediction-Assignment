import React, { useEffect, useState } from 'react';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/history', {
          method: 'GET',
          credentials: 'include'
        });

        if (res.status === 401) {
          setError('Authentication required. Please log in.');
          setHistory([]);
        } else if (res.status === 403) {
          setError('Access restricted.');
          setHistory([]);
        } else if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to fetch history');
        } else {
          const data = await res.json();
          setHistory(Array.isArray(data.history) ? data.history : []);
        }
      } catch (err) {
        console.error('History fetch error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <div className="history-container"><p>Loading history...</p></div>;
  if (error) return <div className="history-container"><p>{error}</p></div>;

  return (
    <div className="history-container">
      <h2 className="history-title">My Predictions History</h2>
      {history.length === 0 ? (
        <div className="no-history">No predictions yet</div>
      ) : (
        <div className="history-grid">
          {history.map((item, idx) => (
            <div key={item._id || idx} className="history-card">
              <div className="history-card-header">
                <div className="history-timestamp">{new Date(item.timestamp).toLocaleString()}</div>
                <div className="history-model">Model: <strong>{item.model_version}</strong></div>
              </div>

              <div className="history-card-body">
                <div className="history-inputs">
                  <h4>Inputs</h4>
                  <div className="inputs-list">
                    {item.inputs && typeof item.inputs === 'object' ? (
                      Object.entries(item.inputs).map(([k, v]) => (
                        <div key={k} className="input-row">
                          <div className="input-key">{k}</div>
                          <div className="input-val">{String(v)}</div>
                        </div>
                      ))
                    ) : (
                      <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(item.inputs, null, 2)}</pre>
                    )}
                  </div>
                </div>

                <div className="history-result">
                  <h4>Prediction</h4>
                  <div className="prediction-percentage">{item.recovered_probability_percent}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
