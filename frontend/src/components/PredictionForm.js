import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';

const loadMapping = async (filePath) => {
  const response = await fetch(filePath);
  const csvData = await response.text();
  return new Promise((resolve, reject) => {
    Papa.parse(csvData, {
      header: true,
      complete: (results) => {
        const mapping = results.data
          .filter(row => row["Original Category"] && row["Encoded Value"] !== undefined)
          .map(row => ({
            label: row["Original Category"],
            value: parseInt(row["Encoded Value"], 10)
          }));
        resolve(mapping);
      },
      error: (error) => reject(error)
    });
  });
};

const PredictionForm = ({ setResponse }) => {
  const navigate = useNavigate();
  const [modelVersion, setModelVersion] = useState("v1");
  const [showTips, setShowTips] = useState(false);

  // Common mapping for both models
  const [primaryOffenceOptions, setPrimaryOffenceOptions] = useState([]);

  // v1 mappings
  const [bikeMakeOptions, setBikeMakeOptions] = useState([]);
  const [neighbourhood158Options, setNeighbourhood158Options] = useState([]);
  const [neighbourhood140Options, setNeighbourhood140Options] = useState([]);

  // v2 mappings
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [premisesTypeOptions, setPremisesTypeOptions] = useState([]);
  const [bikeTypeOptions, setBikeTypeOptions] = useState([]);
  const [bikeColourOptions, setBikeColourOptions] = useState([]);

  useEffect(() => {
    loadMapping('/data/mapping_PRIMARY_OFFENCE.csv')
      .then(data => setPrimaryOffenceOptions(data))
      .catch(err => console.error("Error loading primary offence mapping:", err));

    if (modelVersion === "v1") {
      loadMapping('/data/mapping_BIKE_MAKE.csv')
        .then(data => setBikeMakeOptions(data))
        .catch(err => console.error("Error loading bike make mapping:", err));
      loadMapping('/data/mapping_NEIGHBOURHOOD_158.csv')
        .then(data => setNeighbourhood158Options(data))
        .catch(err => console.error("Error loading neighbourhood 158 mapping:", err));
      loadMapping('/data/mapping_NEIGHBOURHOOD_140.csv')
        .then(data => setNeighbourhood140Options(data))
        .catch(err => console.error("Error loading neighbourhood 140 mapping:", err));
    } else {
      loadMapping('/data/mapping_DIVISION.csv')
        .then(data => setDivisionOptions(data))
        .catch(err => console.error("Error loading division mapping:", err));
      loadMapping('/data/mapping_PREMISES_TYPE.csv')
        .then(data => setPremisesTypeOptions(data))
        .catch(err => console.error("Error loading premises type mapping:", err));
      loadMapping('/data/mapping_BIKE_TYPE.csv')
        .then(data => setBikeTypeOptions(data))
        .catch(err => console.error("Error loading bike type mapping:", err));
      loadMapping('/data/mapping_BIKE_COLOUR.csv')
        .then(data => setBikeColourOptions(data))
        .catch(err => console.error("Error loading bike colour mapping:", err));
      loadMapping('/data/mapping_NEIGHBOURHOOD_140.csv')
        .then(data => setNeighbourhood140Options(data))
        .catch(err => console.error("Error loading neighbourhood 140 mapping:", err));
    }
  }, [modelVersion]);

  // Form state for v1
  const [formDataV1, setFormDataV1] = useState({
    PRIMARY_OFFENCE: '',
    BIKE_COST: '',
    LAT_WGS84: '',
    BIKE_MAKE: '',
    OCC_DOY: '',
    REPORT_YEAR: '',
    NEIGHBOURHOOD_158: '',
    NEIGHBOURHOOD_140: '',
    REPORT_DAY: '',
    OCC_DAY: ''
  });

  // Form state for v2
  const [formDataV2, setFormDataV2] = useState({
    PRIMARY_OFFENCE: '',
    DIVISION: '',
    OCC_DOW: '',
    REPORT_YEAR: '',
    BIKE_TYPE: '',
    PREMISES_TYPE: '',
    BIKE_SPEED: '',
    BIKE_COLOUR: '',
    BIKE_COST: '',
    NEIGHBOURHOOD_140: ''
  });

  const handleModelVersionChange = (e) => {
    setModelVersion(e.target.value);
    setResponse(null);
  };

  const handleChangeV1 = (e) => {
    const { name, value } = e.target;
    setFormDataV1(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeV2 = (e) => {
    const { name, value } = e.target;
    setFormDataV2(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let payload = { modelVersion };

    if (modelVersion === "v1") {
      for (let key in formDataV1) {
        if (!formDataV1[key]) {
          setResponse({ error: `Please fill out field: ${key}` });
          return;
        }
      }
      payload = { ...payload, ...formDataV1 };
    } else {
      for (let key in formDataV2) {
        if (!formDataV2[key]) {
          setResponse({ error: `Please fill out field: ${key}` });
          return;
        }
      }
      payload = { ...payload, ...formDataV2 };
    }

    try {
      const res = await fetch(`http://localhost:5000/predict/${modelVersion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include credentials for authentication
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.status === 401) {
        // User not authenticated
        setResponse({ error: 'Please log in to make predictions.' });
        navigate('/login');
        return;
      }
      
      if (res.status === 403) {
        // Admin users forbidden
        setResponse({ error: 'Admin users cannot generate predictions.' });
        return;
      }
      
      setResponse(data);
      navigate('/result');
    } catch (error) {
      setResponse({ error: 'Error connecting to server.' });
    }
  };

  const handleClear = () => {
    if (modelVersion === "v1") {
      setFormDataV1({
        PRIMARY_OFFENCE: '',
        BIKE_COST: '',
        LAT_WGS84: '',
        BIKE_MAKE: '',
        OCC_DOY: '',
        REPORT_YEAR: '',
        NEIGHBOURHOOD_158: '',
        NEIGHBOURHOOD_140: '',
        REPORT_DAY: '',
        OCC_DAY: ''
      });
    } else {
      setFormDataV2({
        PRIMARY_OFFENCE: '',
        DIVISION: '',
        OCC_DOW: '',
        REPORT_YEAR: '',
        BIKE_TYPE: '',
        PREMISES_TYPE: '',
        BIKE_SPEED: '',
        BIKE_COLOUR: '',
        BIKE_COST: '',
        NEIGHBOURHOOD_140: ''
      });
    }
    setResponse(null);
  };

  return (
    <div className="prediction-form">
      <h2>Enter Bicycle Theft Details</h2>
      <div className="model-version-toggle">
        <label>
          <input
            type="radio"
            name="modelVersion"
            value="v1"
            checked={modelVersion === "v1"}
            onChange={handleModelVersionChange}
          />
          Model v1
        </label>
        <label>
          <input
            type="radio"
            name="modelVersion"
            value="v2"
            checked={modelVersion === "v2"}
            onChange={handleModelVersionChange}
          />
          Model v2
        </label>
      </div>
      
      {/* Tips Section */}
      <div className="tips-section" style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        marginBottom: '25px',
        overflow: 'hidden'
      }}>
        <div 
          onClick={() => setShowTips(!showTips)}
          style={{
            padding: '20px',
            cursor: 'pointer',
            backgroundColor: '#e9ecef',
            borderBottom: showTips ? '1px solid #dee2e6' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#d6d9dc'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#e9ecef'}
        >
          <h3 style={{ margin: '0', color: '#495057' }}>💡 Tips for Filling Out the Form</h3>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            transform: showTips ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}>
            ▼
          </span>
        </div>
        
        {showTips && (
          <div style={{ padding: '20px', paddingTop: '15px' }}>
            <p style={{ marginBottom: '15px', color: '#6c757d' }}>
              Please fill out the fields as instructed for the selected model version.
            </p>
            
            {modelVersion === "v1" ? (
              <div>
                <h4 style={{ color: '#007bff', marginBottom: '10px' }}>For Model v1 (Class Weighting x Random Forest):</h4>
                <ul style={{ paddingLeft: '20px', color: '#495057' }}>
                  <li><strong>PRIMARY OFFENCE:</strong> Select the offence code (e.g., robbery, burglary) from the dropdown.</li>
                  <li><strong>BIKE MAKE:</strong> Select the bike manufacturer from the dropdown.</li>
                  <li><strong>NEIGHBOURHOOD 158:</strong> Choose the neighbourhood code 158 from the dropdown.</li>
                  <li><strong>NEIGHBOURHOOD 140:</strong> Choose the neighbourhood code 140 from the dropdown.</li>
                  <li><strong>BIKE COST:</strong> Enter the bike's cost (e.g., 200).</li>
                  <li><strong>LAT_WGS84:</strong> Enter the latitude coordinate (e.g., 43.6532).</li>
                  <li><strong>OCC_DOY:</strong> Enter the day-of-year the theft occurred (e.g., 200).</li>
                  <li><strong>REPORT YEAR:</strong> Enter the year the report was filed (e.g., 2018).</li>
                  <li><strong>REPORT DAY:</strong> Enter the day of the month of the report (e.g., 15).</li>
                  <li><strong>OCC DAY:</strong> Enter the day of the month the theft occurred (e.g., 10).</li>
                </ul>
              </div>
            ) : (
              <div>
                <h4 style={{ color: '#28a745', marginBottom: '10px' }}>For Model v2 (SMOTETomek x XGBoost):</h4>
                <ul style={{ paddingLeft: '20px', color: '#495057' }}>
                  <li><strong>PRIMARY OFFENCE:</strong> Select the offence code from the dropdown.</li>
                  <li><strong>DIVISION:</strong> Select the police division from the dropdown.</li>
                  <li><strong>PREMISES TYPE:</strong> Choose the type of premises where the theft occurred.</li>
                  <li><strong>BIKE TYPE:</strong> Select the bike type from the dropdown.</li>
                  <li><strong>BIKE COLOUR:</strong> Choose the bike colour from the dropdown.</li>
                  <li><strong>NEIGHBOURHOOD 140:</strong> Select the neighbourhood code 140 from the dropdown.</li>
                  <li><strong>OCC DOW:</strong> Enter the day of the week when the theft occurred (0 for Sunday, 6 for Saturday).</li>
                  <li><strong>REPORT YEAR:</strong> Enter the year the report was filed (e.g., 2018).</li>
                  <li><strong>BIKE SPEED:</strong> Enter the bike's speed (e.g., 6).</li>
                  <li><strong>BIKE COST:</strong> Enter the bike's cost (e.g., 500).</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        {modelVersion === "v1" ? (
          <div className="form-grid">
            {/* v1 Dropdowns */}
            <div className="form-group">
              <label>Primary Offence:</label>
              <select name="PRIMARY_OFFENCE" value={formDataV1.PRIMARY_OFFENCE} onChange={handleChangeV1} required>
                <option value="">Select Primary Offence</option>
                {primaryOffenceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Bike Make:</label>
              <select name="BIKE_MAKE" value={formDataV1.BIKE_MAKE} onChange={handleChangeV1} required>
                <option value="">Select Bike Make</option>
                {bikeMakeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Neighbourhood 158:</label>
              <select name="NEIGHBOURHOOD_158" value={formDataV1.NEIGHBOURHOOD_158} onChange={handleChangeV1} required>
                <option value="">Select Neighbourhood 158</option>
                {neighbourhood158Options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Neighbourhood 140:</label>
              <select name="NEIGHBOURHOOD_140" value={formDataV1.NEIGHBOURHOOD_140} onChange={handleChangeV1} required>
                <option value="">Select Neighbourhood 140</option>
                {neighbourhood140Options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* v1 Numeric/Text Fields with placeholders */}
            <div className="form-group">
              <label>Bike Cost:</label>
              <input type="number" name="BIKE_COST" placeholder="e.g., 500" value={formDataV1.BIKE_COST} onChange={handleChangeV1} required />
            </div>
            <div className="form-group">
              <label>Latitude (WGS84):</label>
              <input type="number" step="0.000001" name="LAT_WGS84" placeholder="e.g., 43.6532" value={formDataV1.LAT_WGS84} onChange={handleChangeV1} required />
            </div>
            <div className="form-group">
              <label>Occurrence Day-of-Year (OCC_DOY):</label>
              <input type="number" name="OCC_DOY" placeholder="e.g., 200" value={formDataV1.OCC_DOY} onChange={handleChangeV1} required />
            </div>
            <div className="form-group">
              <label>Report Year:</label>
              <input type="number" name="REPORT_YEAR" placeholder="e.g., 2024" value={formDataV1.REPORT_YEAR} onChange={handleChangeV1} required />
            </div>
            <div className="form-group">
              <label>Report Day:</label>
              <input type="number" name="REPORT_DAY" placeholder="e.g., 1 - 31" value={formDataV1.REPORT_DAY} onChange={handleChangeV1} required />
            </div>
            <div className="form-group">
              <label>Occurrence Day:</label>
              <input type="number" name="OCC_DAY" placeholder="e.g., 1 - 31" value={formDataV1.OCC_DAY} onChange={handleChangeV1} required />
            </div>
          </div>
        ) : (
          <div className="form-grid">
            {/* v2 Dropdowns */}
            <div className="form-group">
              <label>Primary Offence:</label>
              <select name="PRIMARY_OFFENCE" value={formDataV2.PRIMARY_OFFENCE} onChange={handleChangeV2} required>
                <option value="">Select Primary Offence</option>
                {primaryOffenceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Division:</label>
              <select name="DIVISION" value={formDataV2.DIVISION} onChange={handleChangeV2} required>
                <option value="">Select Division</option>
                {divisionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Premises Type:</label>
              <select name="PREMISES_TYPE" value={formDataV2.PREMISES_TYPE} onChange={handleChangeV2} required>
                <option value="">Select Premises Type</option>
                {premisesTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Bike Type:</label>
              <select name="BIKE_TYPE" value={formDataV2.BIKE_TYPE} onChange={handleChangeV2} required>
                <option value="">Select Bike Type</option>
                {bikeTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Bike Colour:</label>
              <select name="BIKE_COLOUR" value={formDataV2.BIKE_COLOUR} onChange={handleChangeV2} required>
                <option value="">Select Bike Colour</option>
                {bikeColourOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Neighbourhood 140:</label>
              <select name="NEIGHBOURHOOD_140" value={formDataV2.NEIGHBOURHOOD_140} onChange={handleChangeV2} required>
                <option value="">Select Neighbourhood 140</option>
                {neighbourhood140Options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* v2 Numeric Fields with placeholders */}
            <div className="form-group">
              <label>OCC DOW:</label>
              <input type="number" name="OCC_DOW" placeholder="e.g., 0 (Sunday) to 6 (Saturday)" value={formDataV2.OCC_DOW} onChange={handleChangeV2} required />
            </div>
            <div className="form-group">
              <label>Report Year:</label>
              <input type="number" name="REPORT_YEAR" placeholder="e.g., 2024" value={formDataV2.REPORT_YEAR} onChange={handleChangeV2} required />
            </div>
            <div className="form-group">
              <label>Bike Speed:</label>
              <input type="number" name="BIKE_SPEED" placeholder="e.g., 6" value={formDataV2.BIKE_SPEED} onChange={handleChangeV2} required />
            </div>
            <div className="form-group">
              <label>Bike Cost:</label>
              <input type="number" name="BIKE_COST" placeholder="e.g., 500" value={formDataV2.BIKE_COST} onChange={handleChangeV2} required />
            </div>
          </div>
        )}
        <div className="form-buttons">
          <button type="submit">Submit</button>
          <button type="button" onClick={handleClear}>Clear</button>
        </div>
      </form>
    </div>
  );
};

export default PredictionForm;
