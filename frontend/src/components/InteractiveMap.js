import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for recovered vs not recovered
const recoveredIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const notRecoveredIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const InteractiveMap = () => {
  const [theftData, setTheftData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all', // all, RECOVERED, STOLEN
    year: 'all',
    limit: 1000
  });
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    fetchTheftData();
  }, [filters]);

  const fetchTheftData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.year !== 'all') params.append('year', filters.year);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('limit', filters.limit);

      const response = await fetch(`http://localhost:5000/api/theft-data?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTheftData(data.theft_data);
        
        // Extract unique years for filter dropdown
        const years = [...new Set(data.theft_data.map(item => item.occ_year))].sort();
        setAvailableYears(years);
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

  const getStatsForData = (data) => {
    const recovered = data.filter(item => item.recovered).length;
    const notRecovered = data.length - recovered;
    const recoveryRate = data.length > 0 ? ((recovered / data.length) * 100).toFixed(1) : 0;
    
    // Get top neighbourhoods
    const neighbourhoodCounts = {};
    data.forEach(item => {
      const neighbourhood = item.neighbourhood || 'Unknown';
      neighbourhoodCounts[neighbourhood] = (neighbourhoodCounts[neighbourhood] || 0) + 1;
    });
    
    const topNeighbourhoods = Object.entries(neighbourhoodCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    return { 
      recovered, 
      notRecovered, 
      recoveryRate, 
      total: data.length,
      topNeighbourhoods
    };
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  if (loading) {
    return (
      <div className="interactive-map" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🗺️ Interactive Theft Data Map</h2>
        <div style={{ 
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          margin: '20px 0'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>📍</div>
          <p>Loading theft data from Toronto Police Service database...</p>
          <div style={{ 
            width: '100px', 
            height: '4px', 
            backgroundColor: '#007bff', 
            borderRadius: '2px',
            margin: '10px auto',
            animation: 'pulse 1.5s infinite'
          }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interactive-map" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🗺️ Interactive Theft Data Map</h2>
        <div style={{ 
          color: '#dc3545', 
          padding: '20px',
          backgroundColor: '#f8d7da',
          borderRadius: '8px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      </div>
    );
  }

  const stats = getStatsForData(theftData);

  return (
    <div className="interactive-map" style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        color: '#011b37',
        marginBottom: '30px',
        fontSize: '32px'
      }}>
        🗺️ Toronto Bicycle Theft Data Visualization
      </h2>
      
      {/* Filter Controls */}
      <div className="map-controls" style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '25px',
        border: '2px solid #022a56',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#011b37', marginBottom: '15px' }}>🔍 Data Filters</h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
              Status Filter:
            </label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{ 
                width: '100%',
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #ced4da',
                fontSize: '14px'
              }}
            >
              <option value="all">All Thefts</option>
              <option value="RECOVERED">Recovered Only</option>
              <option value="STOLEN">Not Recovered Only</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
              Year Filter:
            </label>
            <select 
              value={filters.year} 
              onChange={(e) => handleFilterChange('year', e.target.value)}
              style={{ 
                width: '100%',
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #ced4da',
                fontSize: '14px'
              }}
            >
              <option value="all">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#495057' }}>
              Data Limit:
            </label>
            <select 
              value={filters.limit} 
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              style={{ 
                width: '100%',
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #ced4da',
                fontSize: '14px'
              }}
            >
              <option value={500}>500 records</option>
              <option value={1000}>1,000 records</option>
              <option value={2000}>2,000 records</option>
              <option value={5000}>5,000 records</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '2px solid #007bff',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#007bff' }}>
            {stats.total.toLocaleString()}
          </div>
          <p style={{ color: '#6c757d', margin: '5px 0' }}>Total Thefts</p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '2px solid #28a745',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>
            {stats.recovered.toLocaleString()}
          </div>
          <p style={{ color: '#6c757d', margin: '5px 0' }}>Recovered</p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '2px solid #dc3545',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545' }}>
            {stats.notRecovered.toLocaleString()}
          </div>
          <p style={{ color: '#6c757d', margin: '5px 0' }}>Not Recovered</p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          border: '2px solid #ffc107',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffc107' }}>
            {stats.recoveryRate}%
          </div>
          <p style={{ color: '#6c757d', margin: '5px 0' }}>Recovery Rate</p>
        </div>
      </div>

      {/* Top Neighbourhoods */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '2px solid #022a56',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#011b37', marginBottom: '20px' }}>🏘️ Top 5 Affected Neighbourhoods</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {stats.topNeighbourhoods.map(([neighbourhood, count], index) => (
            <div key={neighbourhood} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 15px',
              backgroundColor: index === 0 ? '#fff3cd' : '#f8f9fa',
              borderRadius: '8px',
              border: index === 0 ? '1px solid #ffeaa7' : '1px solid #e9ecef'
            }}>
              <span style={{ fontWeight: 'bold', color: '#495057' }}>
                {index + 1}. {neighbourhood}
              </span>
              <span style={{ 
                color: '#007bff', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {count} thefts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Map Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center',
        border: '2px solid #022a56',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#011b37', marginBottom: '20px' }}>🗺️ Interactive Theft Map</h3>
        
        {/* Real Leaflet Map */}
        <div style={{ 
          height: '500px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #dee2e6',
          marginBottom: '20px'
        }}>
          {theftData.length > 0 ? (
            <MapContainer
              center={[43.6532, -79.3832]} // Toronto center
              zoom={11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Plot theft locations as markers */}
              {theftData.map((theft, index) => (
                <Marker
                  key={index}
                  position={[theft.lat, theft.lng]}
                  icon={theft.recovered ? recoveredIcon : notRecoveredIcon}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#011b37' }}>
                        {theft.recovered ? '✅ Recovered' : '❌ Not Recovered'}
                      </h4>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Neighbourhood:</strong> {theft.neighbourhood}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Bike:</strong> {theft.bike_make} {theft.bike_type}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Color:</strong> {theft.bike_colour}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Cost:</strong> ${theft.bike_cost || 'Unknown'}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Division:</strong> {theft.division}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Year:</strong> {theft.occ_year}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Premises:</strong> {theft.premises_type}
                      </p>
                      <hr style={{ margin: '10px 0' }} />
                      <small style={{ color: '#6c757d' }}>
                        📍 {theft.lat.toFixed(4)}, {theft.lng.toFixed(4)}
                      </small>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#e9ecef',
              color: '#6c757d'
            }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>�️</div>
                <p>No theft data matches the selected filters</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Map Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          padding: '15px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#28a745',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}></div>
            <span style={{ fontWeight: 'bold', color: '#495057' }}>Recovered Bikes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#dc3545',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}></div>
            <span style={{ fontWeight: 'bold', color: '#495057' }}>Not Recovered Bikes</span>
          </div>
        </div>
      </div>

      {/* Data Integration Info */}
      <div style={{
        backgroundColor: '#d4edda',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px',
        border: '1px solid #c3e6cb'
      }}>
        <h4 style={{ color: '#155724', marginBottom: '10px' }}>✅ Interactive Map with Real Data</h4>
        <p style={{ color: '#155724', margin: 0 }}>
          The theft map now displays actual Toronto Police Service bicycle theft data 
          ({stats.total.toLocaleString()} records) with interactive pins at real GPS coordinates. 
          Click on any pin to see detailed theft information. Green pins = recovered bikes, Red pins = not recovered.
        </p>
      </div>
    </div>
  );
};

export default InteractiveMap;
