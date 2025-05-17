// src/Main.js
import React from 'react';
import { AuthProvider } from './contexts/AuthContext'; // Adjusted path
import App from './App';

const Main = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default Main;
