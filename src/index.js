import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import global styles and Tailwind directives
import Main from './app.js'; // Assuming your app.js (which exports Main) is in the src folder

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// import reportWebVitals from './reportWebVitals'; // You would need to create this file if you want to use it
// reportWebVitals();
