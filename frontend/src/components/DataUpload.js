// src/components/DataUpload.js
import React, { useState } from 'react';

const DataUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setMessage('');
      } else {
        setMessage('Please select a CSV file');
        setMessageType('error');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/admin/upload-data', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Upload successful! ${data.row_count} rows processed. Backup created: ${data.backup_created}`);
        setMessageType('success');
        setFile(null);
        // Reset file input
        document.getElementById('file-input').value = '';
      } else {
        setMessage(`❌ Upload failed: ${data.error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('❌ Network error. Please try again.');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="data-upload" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#011b37', marginBottom: '10px' }}>📊 Data Management</h2>
        <p style={{ color: '#6c757d' }}>Upload new bicycle theft data to update the system</p>
      </div>

      <div style={{
        backgroundColor: '#fff3cd',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #ffeaa7'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#856404' }}>⚠️ Important Information</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
          <li><strong>File Format:</strong> Only CSV files are accepted</li>
          <li><strong>Required Columns:</strong> LAT_WGS84, LONG_WGS84, STATUS, DIVISION</li>
          <li><strong>Backup:</strong> Current data will be automatically backed up before replacement</li>
          <li><strong>Validation:</strong> File will be validated before processing</li>
          <li><strong>Impact:</strong> This will update data for all theft map visualizations and statistics</li>
        </ul>
      </div>

      <div style={{
        backgroundColor: '#fff',
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>📁</div>
        <h3 style={{ color: '#333', marginBottom: '10px' }}>Upload CSV File</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Select a CSV file containing bicycle theft data
        </p>
        
        <input
          id="file-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <label
          htmlFor="file-input"
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'inline-block',
            border: 'none',
            fontSize: '16px',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Choose CSV File
        </label>
      </div>

      {file && (
        <div style={{
          backgroundColor: '#e7f3ff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #b3d7ff'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>📄 Selected File</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0', fontWeight: 'bold' }}>{file.name}</p>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                Size: {getFileSize(file.size)} | Type: {file.type || 'CSV'}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                document.getElementById('file-input').value = '';
                setMessage('');
              }}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                width: '60px',
                height: '28px'
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {file && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              backgroundColor: uploading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {uploading ? '⏳ Uploading...' : '🚀 Upload Data'}
          </button>
        </div>
      )}

      {message && (
        <div style={{
          backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
          color: messageType === 'success' ? '#155724' : '#721c24',
          padding: '15px',
          borderRadius: '5px',
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>💡 Tips for Data Upload</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Ensure your CSV has all required columns with correct names</li>
          <li>Check that latitude and longitude values are valid (numeric)</li>
          <li>STATUS column should contain values like 'STOLEN', 'RECOVERED', or 'UNKNOWN'</li>
          <li>Larger files may take longer to process and validate</li>
          <li>The system will automatically create a backup before replacing data</li>
        </ul>
      </div>
    </div>
  );
};

export default DataUpload;
