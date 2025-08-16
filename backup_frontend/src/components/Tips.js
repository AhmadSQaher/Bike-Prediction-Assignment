import React from 'react';

const Tips = () => {
  return (
    <section id="tips" className="tips">
      <h2>Tips for Filling Out the Form</h2>
      <p>Please fill out the fields as instructed for the selected model version.</p>
      
      <h3>For Model v1 (Class Weighting x Random Forest):</h3>
      <ul>
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

      <h3>For Model v2 (SMOTETomek x XGBoost):</h3>
      <ul>
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
    </section>
  );
};

export default Tips;
