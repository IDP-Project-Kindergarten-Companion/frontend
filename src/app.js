// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // Adjusted path
import Navbar from './components/layout/Navbar'; // Adjusted path

// Import Page Components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UserProfilePage from './pages/UserProfilePage';
import AddChildPage from './pages/AddChildPage';
import LinkChildPage from './pages/LinkChildPage';
import ChildProfilePage from './pages/ChildProfilePage';

// A simple ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-brand-primary">Authenticating...</p></div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const { isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-brand-primary">Loading application...</p></div>;
  }

  return (
    <div className="min-h-screen bg-brand-background font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          <Route path="/add-child" element={<ProtectedRoute><AddChildPage /></ProtectedRoute>} />
          <Route path="/link-child" element={<ProtectedRoute><LinkChildPage /></ProtectedRoute>} />
          <Route path="/child/:childId" element={<ProtectedRoute><ChildProfilePage /></ProtectedRoute>} />
          
          {/* Default route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
