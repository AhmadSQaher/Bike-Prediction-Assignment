import React from 'react';

const Home = () => {
  return (
    <section className="home">
      <h1>Welcome to Bike Recovery AI</h1>
      <p>
        This application predicts the likelihood of a stolen bicycle being recovered using machine learning models trained on Toronto Police Service data. 
        Navigate to the prediction page to begin or register for an account to personalize your experience.
      </p>
    </section>
  );
};

export default Home;