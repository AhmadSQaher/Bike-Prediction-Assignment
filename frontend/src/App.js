import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import PredictionForm from './components/PredictionForm';
import ResponseDisplay from './components/ResponseDisplay';
import Tips from './components/Tips';
import About from './components/About';
import References from './components/References';
import Footer from './components/Footer';

function App() {
  const [response, setResponse] = useState(null);
  const location = useLocation();

  const hideStaticContent = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      <Navbar />
      <div className="main-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/predict" element={<PredictionForm setResponse={setResponse} />} />
          <Route path="/result" element={<ResponseDisplay response={response} />} />
        </Routes>

        {!hideStaticContent && (
          <>
            <Tips />
            <About />
            <References />
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

export default App;