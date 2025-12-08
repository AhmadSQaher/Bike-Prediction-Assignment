// frontend/src/utils/validation.js

/**
 * Display form errors from API response
 * @param {Object} errors - Error object from API response
 * @param {Function} setFieldError - Function to set field errors (e.g., setFieldError from Formik)
 * @param {Function} setGeneralError - Function to set general error message
 */
export const displayApiErrors = (errors, setFieldError = null, setGeneralError = null) => {
  if (!errors) return;
  
  // Handle string errors
  if (typeof errors === 'string') {
    if (setGeneralError) {
      setGeneralError(errors);
    }
    return;
  }
  
  // Handle object with details (field-specific errors)
  if (errors.details && typeof errors.details === 'object') {
    if (setFieldError) {
      for (const [field, message] of Object.entries(errors.details)) {
        setFieldError(field, message);
      }
    } else if (setGeneralError) {
      const messages = Object.values(errors.details);
      setGeneralError(messages.join(', '));
    }
    return;
  }
  
  // Handle general error object
  if (errors.error && typeof errors.error === 'string') {
    if (setGeneralError) {
      setGeneralError(errors.error);
    }
    return;
  }
};

/**
 * Format validation error for display
 * @param {Object} error - Error object from API
 * @returns {String} Formatted error message
 */
export const formatValidationError = (error) => {
  if (!error) return 'An error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.details && typeof error.details === 'object') {
    const messages = Object.values(error.details);
    return messages.join(', ');
  }
  
  return error.error || error.message || 'An error occurred';
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {String|undefined} Error message or undefined if valid
 */
export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return undefined;
};

/**
 * Validate password
 * @param {String} password - Password to validate
 * @returns {String|undefined} Error message or undefined if valid
 */
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return undefined;
};

/**
 * Validate required field
 * @param {String} value - Value to validate
 * @param {String} fieldName - Name of the field for error message
 * @returns {String|undefined} Error message or undefined if valid
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return undefined;
};

/**
 * Validate number range
 * @param {Number} value - Number to validate
 * @param {Object} options - Validation options
 * @returns {String|undefined} Error message or undefined if valid
 */
export const validateNumberRange = (value, { min, max, fieldName }) => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} must be a number`;
  
  if (min !== undefined && num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (max !== undefined && num > max) {
    return `${fieldName} must be at most ${max}`;
  }
  
  return undefined;
};

/**
 * Client-side validation for prediction form data
 * @param {Object} formData - Form data to validate
 * @param {String} modelVersion - Model version ('v1' or 'v2')
 * @returns {Object} Object with errors if any
 */
export const validatePredictionInput = (formData, modelVersion) => {
  const errors = {};
  
  // Common validation rules
  const validationRules = {
    BIKE_COST: (value) => {
      if (!value) return 'Bike cost is required';
      const num = Number(value);
      if (isNaN(num)) return 'Bike cost must be a number';
      if (num < 0) return 'Bike cost cannot be negative';
      return undefined;
    },
    
    LAT_WGS84: (value) => {
      if (!value) return 'Latitude is required';
      const num = Number(value);
      if (isNaN(num)) return 'Latitude must be a number';
      if (num < -90 || num > 90) return 'Latitude must be between -90 and 90';
      return undefined;
    },
    
    REPORT_YEAR: (value) => {
      if (!value) return 'Report year is required';
      const num = Number(value);
      if (isNaN(num)) return 'Report year must be a number';
      const currentYear = new Date().getFullYear();
      if (num < 2000 || num > currentYear + 1) {
        return `Report year must be between 2000 and ${currentYear + 1}`;
      }
      return undefined;
    },
    
    OCC_DOY: (value) => {
      if (!value) return 'Day of year is required';
      const num = Number(value);
      if (isNaN(num)) return 'Day of year must be a number';
      if (num < 1 || num > 366) return 'Day of year must be between 1 and 366';
      return undefined;
    },
    
    REPORT_DAY: (value) => {
      if (!value) return 'Report day is required';
      const num = Number(value);
      if (isNaN(num)) return 'Report day must be a number';
      if (num < 1 || num > 31) return 'Report day must be between 1 and 31';
      return undefined;
    },
    
    OCC_DAY: (value) => {
      if (!value) return 'Occurrence day is required';
      const num = Number(value);
      if (isNaN(num)) return 'Occurrence day must be a number';
      if (num < 1 || num > 31) return 'Occurrence day must be between 1 and 31';
      return undefined;
    },
    
    OCC_DOW: (value) => {
      if (!value) return 'Day of week is required';
      const num = Number(value);
      if (isNaN(num)) return 'Day of week must be a number';
      if (num < 0 || num > 6) return 'Day of week must be between 0 (Sunday) and 6 (Saturday)';
      return undefined;
    },
    
    BIKE_SPEED: (value) => {
      if (!value) return 'Bike speed is required';
      const num = Number(value);
      if (isNaN(num)) return 'Bike speed must be a number';
      if (num < 0) return 'Bike speed cannot be negative';
      return undefined;
    }
  };
  
  // Validate all fields
  Object.keys(formData).forEach(field => {
    const value = formData[field];
    
    // Check if field is empty
    if (!value && value !== 0) {
      errors[field] = `${field.replace(/_/g, ' ')} is required`;
      return;
    }
    
    // Apply specific validation rules if they exist
    if (validationRules[field]) {
      const error = validationRules[field](value);
      if (error) {
        errors[field] = error;
      }
    } else if (field.includes('NEIGHBOURHOOD') || field.includes('PRIMARY_OFFENCE') || 
               field.includes('BIKE_') || field.includes('DIVISION') || 
               field.includes('PREMISES_TYPE')) {
      // For dropdown fields, just check if they have a value
      if (!value) {
        errors[field] = `${field.replace(/_/g, ' ')} is required`;
      }
    }
  });
  
  return errors;
};

/**
 * Check if form has errors
 * @param {Object} formData - Form data
 * @param {Object} errors - Current errors object
 * @returns {Boolean} True if form is valid
 */
export const isFormValid = (formData, errors) => {
  // Check if all required fields are filled
  const requiredFields = Object.keys(formData);
  const allFieldsFilled = requiredFields.every(field => {
    const value = formData[field];
    return value !== '' && value !== null && value !== undefined;
  });
  
  // Check if there are no errors
  const noErrors = Object.keys(errors).length === 0;
  
  return allFieldsFilled && noErrors;
};