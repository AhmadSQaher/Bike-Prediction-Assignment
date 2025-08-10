import React, { useState, useEffect } from 'react';

const InteractiveMap = () => {
  const [theftData, setTheftData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, recovered, not-recovered

  useEffect(() => {
    fetchTheftData();
  }, []);

  const fetchTheftData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/theft-data', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTheftData(data.theft_data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load theft data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (filter === 'all') return theftData;
    return theftData.filter(item => {
      if (filter === 'recovered') return item.recovered;
      if (filter === 'not-recovered') return !item.recovered;
      return true;
    });
  };

  const getStatsForData = (data) => {
    const recovered = data.filter(item => item.recovered).length;
    const notRecovered = data.length - recovered;
    const recoveryRate = data.length > 0 ? ((recovered / data.length) * 100).toFixed(1) : 0;
    
    return { recovered, notRecovered, recoveryRate, total: data.length };
  };

  if (loading) {
    return (
      <div className="interactive-map" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🗺️ Interactive Theft Data Map</h2>
        <p>Loading theft data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interactive-map" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🗺️ Interactive Theft Data Map</h2>
        <div style={{ color: 'red', padding: '10px' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const stats = getStatsForData(filteredData);

  return (
    <div className="interactive-map" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>🗺️ Interactive Theft Data Map</h2>
      
      {/* Filter Controls */}
      <div className="map-controls" style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Filter by Status:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="all">All Thefts</option>
            <option value="recovered">Recovered Only</option>
            <option value="not-recovered">Not Recovered Only</option>
          </select>
        </div>
        
        <div className="map-stats" style={{ display: 'flex', gap: '15px', fontSize: '14px' }}>
          <span style={{ color: '#28a745' }}>✅ Recovered: {stats.recovered}</span>
          <span style={{ color: '#dc3545' }}>❌ Not Recovered: {stats.notRecovered}</span>
          <span style={{ fontWeight: 'bold' }}>Recovery Rate: {stats.recoveryRate}%</span>
        </div>
      </div>

      {/* Map Placeholder (In a real implementation, use Google Maps or Leaflet) */}
      <div className="map-container" style={{
        backgroundColor: '#e9ecef',
        height: '400px',
        borderRadius: '8px',
        border: '2px solid #dee2e6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Simulated Map Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          opacity: 0.3
        }} />
        
        {/* Map Points */}
        {filteredData.map((theft, index) => {
          // Simulate positioning based on lat/lng (scaled for display)
          const x = ((theft.lng + 79.4) * 800) + 50; // Rough Toronto area scaling
          const y = ((43.7 - theft.lat) * 800) + 50;
          
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${Math.min(Math.max(x, 10), 90)}%`,
                top: `${Math.min(Math.max(y, 10), 90)}%`,
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: theft.recovered ? '#28a745' : '#dc3545',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
              title={`${theft.bike_type} bike - ${theft.recovered ? 'Recovered' : 'Not Recovered'} - ${theft.division}`}
            />
          );
        })}
        
        {filteredData.length === 0 && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: 0, color: '#6c757d' }}>No theft data matches the selected filter</p>
          </div>
        )}
        
        {filteredData.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#28a745'
                }} />
                <span>Recovered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#dc3545'
                }} />
                <span>Not Recovered</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="data-summary" style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginTop: 0, color: '#495057' }}>📊 Data Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{stats.total}</div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Incidents</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{stats.recovered}</div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>Recovered</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{stats.notRecovered}</div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>Not Recovered</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{stats.recoveryRate}%</div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>Recovery Rate</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#0066cc' }}>
          💡 <strong>Tip:</strong> Click on map points to see theft details. Use filters to focus on specific case types.
          In a full implementation, this would show real geographic data with clustering and detailed popups.
        </p>
      </div>
    </div>
  );
};

export default InteractiveMap;
