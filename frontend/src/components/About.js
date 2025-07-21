import React from 'react';

const About = () => {
  return (
    <section id="about" className="about">
      <h2>About Stolen Bike Predictor</h2>
      <p>
        This application predicts the likelihood of a stolen bicycle being recovered using machine learning.
        The model is trained on a dataset from the Toronto Police Service and uses a minimal set of features.
      </p>
    </section>
  );
};

export default About;
