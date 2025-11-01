import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

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

              <div className="history-card-body compact">
                <div className="history-summary-compact">
                  <h4>Inputs</h4>
                  <div className="inputs-compact-note">Click to view details</div>
                </div>

                <div className="history-result">
                  <h4>Prediction</h4>
                  <div className="prediction-percentage">{item.recovered_probability_percent}%</div>
                </div>
              </div>

              <div className="history-card-actions">
                <button className="btn-view" onClick={() => { setSelectedItem(item); setShowModal(true); }}>View details</button>
                <button className="btn-delete" onClick={async () => {
                  // confirm
                  const ok = window.confirm('Delete this history record? This cannot be undone.');
                  if (!ok) return;
                  const idToDelete = item._id || item.timestamp;
                  try {
                    const res = await fetch(`http://localhost:5000/api/history/${encodeURIComponent(idToDelete)}`, { method: 'DELETE', credentials: 'include' });
                    if (res.ok) {
                      // remove locally
                      setHistory(prev => prev.filter(h => (h._id || h.timestamp) !== idToDelete));
                    } else {
                      const data = await res.json().catch(() => ({}));
                      alert(data.error || 'Failed to delete record');
                    }
                  } catch (err) {
                    console.error('Delete error', err);
                    alert('Network error deleting record');
                  }
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal */}
      {showModal && selectedItem && (
        <div className="history-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h3>Prediction details</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="history-modal-body">
              <div className="modal-meta">
                <div><strong>Date:</strong> {new Date(selectedItem.timestamp).toLocaleString()}</div>
                <div><strong>Model:</strong> {selectedItem.model_version}</div>
                <div><strong>Prediction:</strong> {selectedItem.recovered_probability_percent}%</div>
              </div>

              <h4>Inputs</h4>
              <div className="modal-inputs">
                {selectedItem.inputs && typeof selectedItem.inputs === 'object' ? (
                  Object.entries(selectedItem.inputs).map(([k, v]) => (
                    <div key={k} className="input-row modal-row">
                      <div className="input-key">{k}</div>
                      <div className="input-val">{String(v)}</div>
                    </div>
                  ))
                ) : (
                  <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(selectedItem.inputs, null, 2)}</pre>
                )}
              </div>
            </div>
            <div className="history-modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => {
                // navigate to predict and prefill
                navigate('/predict', { state: { prefill: selectedItem.inputs, modelVersion: selectedItem.model_version } });
                setShowModal(false);
              }}>Re-run</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
