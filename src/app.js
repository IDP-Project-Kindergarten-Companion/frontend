// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // Path to AuthContext.js
import Navbar from './components/layout/Navbar'; // Path to Navbar.js

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
  const { user, isLoading } = useAuth(); // Get user and loading state from auth context

  if (isLoading) {
    // You might want a more sophisticated loading spinner here
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-brand-primary">Authenticating...</p></div>;
  }

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to so we can send them along after they login.
    // `replace` avoids adding /login to history when user is unauthenticated.
    return <Navigate to="/login" replace />;
  }

  return children; // Render the children (the protected page) if user is authenticated
};

const App = () => {
  const { isLoading: authIsLoading } = useAuth(); // Get auth loading state

  // If auth is still loading, show a global loading indicator for the whole app
  // This prevents rendering routes before user status is known and avoids flashes of login page
  if (authIsLoading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-brand-primary">Loading application...</p></div>;
  }

  return (
    <div className="min-h-screen bg-brand-background font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          {/* Public Routes: Render directly. If user is logged in, they might be redirected by logic within the page or by a top-level redirect */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes: Wrapped with ProtectedRoute */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          <Route path="/add-child" element={<ProtectedRoute><AddChildPage /></ProtectedRoute>} />
          <Route path="/link-child" element={<ProtectedRoute><LinkChildPage /></ProtectedRoute>} />
          <Route path="/child/:childId" element={<ProtectedRoute><ChildProfilePage /></ProtectedRoute>} />
          
          {/* Default route: redirect to /dashboard. ProtectedRoute will handle auth check. */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* Fallback for any other unmatched route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} /> 
        </Routes>
      </main>
    </div>
  );
};

export default App;
