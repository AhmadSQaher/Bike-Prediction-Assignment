import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Papa from 'papaparse';
import { 
  validatePredictionInput, 
  displayApiErrors, 
  formatValidationError 
} from '../utils/validation';

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
  const location = useLocation();
  const [modelVersion, setModelVersion] = useState("v1");
  const [showTips, setShowTips] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

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
    
    // Clear errors when model version changes
    setFieldErrors({});
    setGeneralError('');
  }, [modelVersion]);

  // Prefill form if navigated with state (from History re-run)
  useEffect(() => {
    const prefill = location.state && location.state.prefill;
    const prefModel = location.state && location.state.modelVersion;
    if (prefModel) {
      setModelVersion(prefModel);
    }

    if (prefill && prefModel) {
      // Wait for modelVersion to be applied; use a small timeout to ensure mapping loads if needed
      // We'll set form fields based on keys present in prefill
      if (prefModel === 'v1') {
        const newV1 = { ...formDataV1 };
        Object.keys(newV1).forEach(k => {
          if (prefill[k] !== undefined && prefill[k] !== null) newV1[k] = String(prefill[k]);
        });
        setFormDataV1(newV1);
      } else {
        const newV2 = { ...formDataV2 };
        Object.keys(newV2).forEach(k => {
          if (prefill[k] !== undefined && prefill[k] !== null) newV2[k] = String(prefill[k]);
        });
        setFormDataV2(newV2);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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
    setFieldErrors({});
    setGeneralError('');
  };

  const handleChangeV1 = (e) => {
    const { name, value } = e.target;
    setFormDataV1(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[name];
      setFieldErrors(newErrors);
    }
    
    // Clear general error
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleChangeV2 = (e) => {
    const { name, value } = e.target;
    setFormDataV2(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[name];
      setFieldErrors(newErrors);
    }
    
    // Clear general error
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = () => {
    const currentFormData = modelVersion === "v1" ? formDataV1 : formDataV2;
    const errors = validatePredictionInput(currentFormData, modelVersion);
    setFieldErrors(errors);
    
    // Also check for empty fields
    const emptyFields = Object.keys(currentFormData).filter(key => !currentFormData[key]);
    if (emptyFields.length > 0 && Object.keys(errors).length === 0) {
      emptyFields.forEach(field => {
        errors[field] = `${field.replace(/_/g, ' ')} is required`;
      });
      setFieldErrors(errors);
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }
    
    let payload = { modelVersion };

    if (modelVersion === "v1") {
      payload = { ...payload, ...formDataV1 };
    } else {
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
        setGeneralError('Please log in to make predictions.');
        navigate('/login');
        return;
      }
      
      if (res.status === 403) {
        // Admin users forbidden
        setGeneralError('Admin users cannot generate predictions.');
        return;
      }
      
      if (res.status === 400) {
        // Validation error from server
        displayApiErrors(data, setFieldError, setGeneralError);
        return;
      }
      
      if (!res.ok) {
        setGeneralError(formatValidationError(data));
        return;
      }
      
      setResponse(data);
      navigate('/result');
    } catch (error) {
      setGeneralError('Network error. Please try again.');
    }
  };

  // Helper function to set field errors
  const setFieldError = (field, message) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
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
    setFieldErrors({});
    setGeneralError('');
  };

  // Function to render field with error styling
  const renderField = (name, value, onChange, type = 'select', options = [], placeholder = '') => {
    const error = fieldErrors[name];
    
    return (
      <div className="form-group">
        <label>{name.replace(/_/g, ' ')}:</label>
        {type === 'select' ? (
          <select 
            name={name} 
            value={value} 
            onChange={onChange}
            className={error ? 'error-field' : ''}
            style={error ? { border: '2px solid red' } : {}}
          >
            <option value="">Select {name.replace(/_/g, ' ')}</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input 
            type="number" 
            name={name} 
            placeholder={placeholder}
            value={value} 
            onChange={onChange}
            className={error ? 'error-field' : ''}
            style={error ? { border: '2px solid red' } : {}}
          />
        )}
        {error && (
          <div className="field-error" style={{ 
            color: 'red', 
            fontSize: '14px', 
            marginTop: '5px' 
          }}>
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="prediction-form">
      <h2>Enter Bicycle Theft Details</h2>
      
      {/* General Error Display */}
      {generalError && (
        <div className="error-message" style={{ 
          color: 'red', 
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#fee',
          borderRadius: '4px',
          border: '1px solid #fcc'
        }}>
          {generalError}
        </div>
      )}
      
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
            {/* v1 Fields */}
            {renderField('PRIMARY_OFFENCE', formDataV1.PRIMARY_OFFENCE, handleChangeV1, 'select', primaryOffenceOptions)}
            {renderField('BIKE_MAKE', formDataV1.BIKE_MAKE, handleChangeV1, 'select', bikeMakeOptions)}
            {renderField('NEIGHBOURHOOD_158', formDataV1.NEIGHBOURHOOD_158, handleChangeV1, 'select', neighbourhood158Options)}
            {renderField('NEIGHBOURHOOD_140', formDataV1.NEIGHBOURHOOD_140, handleChangeV1, 'select', neighbourhood140Options)}
            {renderField('BIKE_COST', formDataV1.BIKE_COST, handleChangeV1, 'input', [], 'e.g., 500')}
            {renderField('LAT_WGS84', formDataV1.LAT_WGS84, handleChangeV1, 'input', [], 'e.g., 43.6532')}
            {renderField('OCC_DOY', formDataV1.OCC_DOY, handleChangeV1, 'input', [], 'e.g., 200')}
            {renderField('REPORT_YEAR', formDataV1.REPORT_YEAR, handleChangeV1, 'input', [], 'e.g., 2024')}
            {renderField('REPORT_DAY', formDataV1.REPORT_DAY, handleChangeV1, 'input', [], 'e.g., 1 - 31')}
            {renderField('OCC_DAY', formDataV1.OCC_DAY, handleChangeV1, 'input', [], 'e.g., 1 - 31')}
          </div>
        ) : (
          <div className="form-grid">
            {/* v2 Fields */}
            {renderField('PRIMARY_OFFENCE', formDataV2.PRIMARY_OFFENCE, handleChangeV2, 'select', primaryOffenceOptions)}
            {renderField('DIVISION', formDataV2.DIVISION, handleChangeV2, 'select', divisionOptions)}
            {renderField('PREMISES_TYPE', formDataV2.PREMISES_TYPE, handleChangeV2, 'select', premisesTypeOptions)}
            {renderField('BIKE_TYPE', formDataV2.BIKE_TYPE, handleChangeV2, 'select', bikeTypeOptions)}
            {renderField('BIKE_COLOUR', formDataV2.BIKE_COLOUR, handleChangeV2, 'select', bikeColourOptions)}
            {renderField('NEIGHBOURHOOD_140', formDataV2.NEIGHBOURHOOD_140, handleChangeV2, 'select', neighbourhood140Options)}
            {renderField('OCC_DOW', formDataV2.OCC_DOW, handleChangeV2, 'input', [], 'e.g., 0 (Sunday) to 6 (Saturday)')}
            {renderField('REPORT_YEAR', formDataV2.REPORT_YEAR, handleChangeV2, 'input', [], 'e.g., 2024')}
            {renderField('BIKE_SPEED', formDataV2.BIKE_SPEED, handleChangeV2, 'input', [], 'e.g., 6')}
            {renderField('BIKE_COST', formDataV2.BIKE_COST, handleChangeV2, 'input', [], 'e.g., 500')}
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