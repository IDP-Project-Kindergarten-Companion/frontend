// src/Main.js
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.js'; // Explicitly added .js extension

const Main = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default Main;
