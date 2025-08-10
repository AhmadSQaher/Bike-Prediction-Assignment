# Stolen Bike Recovery Prediction Application

A full-stack application that predicts the likelihood of bicycle theft recovery using machine learning models.

## Project Structure

```
stolen-bike-final-model/
├── backend/           # Flask API server
├── frontend/          # React web application
├── graphs/           # Data visualization charts
└── package.json      # Root package configuration
```

## Features

- **Backend**: Flask API with two ML model versions (v1 and v2)
- **Frontend**: React web application with prediction form
- **Machine Learning**: CatBoost and XGBoost models for theft recovery prediction
- **Concurrent Development**: Run both backend and frontend simultaneously

## Quick Start

### Prerequisites

- Python 3.10+ (with conda/anaconda recommended)
- Node.js 16+ 
- npm or yarn package manager

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd stolen-bike-final-model
   ```

2. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

### Running the Application

**Option 1: Run both backend and frontend together (Recommended)**
```bash
npm run dev
```

**Option 2: Run services separately**

Backend only:
```bash
npm run backend
```

Frontend only:
```bash
npm run frontend
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Test**: http://localhost:5000/ (should show "Stolen Bike Recovery Prediction API is running!")

## API Endpoints

### GET /
Returns API status message.

### POST /predict/v1
Predicts bike recovery using model version 1.

### POST /predict/v2  
Predicts bike recovery using model version 2.

## Development

### Available Scripts

- `npm run dev` - Run both backend and frontend concurrently
- `npm run backend` - Start Flask backend server
- `npm run frontend` - Start React development server
- `npm run build` - Build React app for production
- `npm run install-all` - Install all dependencies
- `npm run install-backend` - Install Python dependencies
- `npm run install-frontend` - Install Node.js dependencies

### Technology Stack

**Backend:**
- Flask 2.2.3
- CatBoost 1.1
- XGBoost 1.7.4
- Scikit-learn 1.2.2
- Pandas 1.5.3

**Frontend:**
- React 18.2.0
- React Router DOM 7.7.0
- Papa Parse 5.4.1

## Troubleshooting

### Backend Issues
- Ensure Python environment is properly configured
- Check if all Python packages are installed: `pip install -r backend/requirements.txt`
- Verify model files exist in `backend/models/` directory

### Frontend Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf frontend/node_modules && npm run install-frontend`

### Port Conflicts
- Backend runs on port 5000
- Frontend runs on port 3000
- Change ports in respective configuration files if needed

## Model Information

The application includes two trained models:
- **Model V1**: Basic feature set
- **Model V2**: Enhanced feature set with additional preprocessing

Both models predict the probability of bicycle theft recovery based on various factors including:
- Bike characteristics (type, color, make)
- Location data (division, neighborhood, premises type)
- Temporal features (occurrence/report dates, day of week, month)
- Incident details (primary offense, status)
