// src/contexts/AuthContext.js
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Configuration for API base URLs
export const API_BASE_URLS = {
  AUTH: '/auth',
  CHILD_PROFILE: '/profiles',
  ACTIVITY_LOG: '', // Endpoints for activity log will be full paths like /log/meal or /activities
};

// Color Palette (can be moved to a theme.js if preferred)
// Used for placeholder images, Tailwind handles CSS colors via tailwind.config.js
export const brandColors = {
  primary: '#967259', 
  text: '#654321', 
  background: '#FFF7ED',
  // Add other colors if needed by JS, otherwise rely on Tailwind classes
};


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Optional: apiRequest('AUTH', '/logout', 'POST', null, false).catch(e => console.warn("Logout API call failed", e));
  }, []);

  const apiRequest = useCallback(async (serviceKey, endpoint, method = 'GET', body = null, requiresAuth = true, customHeaders = {}) => {
    let baseUrl = API_BASE_URLS[serviceKey];
    if (typeof baseUrl === 'undefined') {
      throw new Error(`Service base path for ${serviceKey} not configured or invalid.`);
    }
    const url = baseUrl ? `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}` : endpoint;
    const headers = { 'Content-Type': 'application/json', ...customHeaders };
    
    let currentToken = token; // Use state token for consistency
    if (requiresAuth && currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const response = await fetch(url, config);
      if (response.status === 401 && requiresAuth) {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (storedRefreshToken) {
          try {
            const refreshBaseUrl = API_BASE_URLS['AUTH'];
            const refreshUrl = `${refreshBaseUrl}/refresh`;
            const refreshResponse = await fetch(refreshUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storedRefreshToken}` },
            });
            if (refreshResponse.ok) {
              const { access_token: newAccessToken, refresh_token: newRefreshToken } = await refreshResponse.json();
              setToken(newAccessToken);
              localStorage.setItem('accessToken', newAccessToken);
              if (newRefreshToken) { // Backend might not always send a new refresh token
                setRefreshToken(newRefreshToken);
                localStorage.setItem('refreshToken', newRefreshToken);
              }
              headers['Authorization'] = `Bearer ${newAccessToken}`; // Update headers for retry
              const retryResponse = await fetch(url, { ...config, headers });
              if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({ message: retryResponse.statusText }));
                throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
              }
              return retryResponse.json().catch(() => ({})); 
            } else {
              logout(); throw new Error("Session expired. Please login again.");
            }
          } catch (refreshError) {
            logout(); throw refreshError;
          }
        } else {
          logout(); throw new Error("Session expired. Please login again.");
        }
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      if (response.status === 204 || response.headers.get("content-length") === "0") return {};
      return response.json();
    } catch (error) {
      console.error(`API Request Error (${method} ${url}):`, error);
      throw error;
    }
  }, [token, logout]); // refreshToken is not directly used here, but its presence is checked via localStorage

  const fetchUserDetails = useCallback(async (currentTokenForFetch) => {
    if (!currentTokenForFetch) {
        setUser(null); // Clear user if no token
        return;
    }
    try {
      const userData = await apiRequest('AUTH', '/me', 'GET', null, true, { 'Authorization': `Bearer ${currentTokenForFetch}`});
      setUser({
        id: userData.user_id, username: userData.username, role: userData.role,
        email: userData.email, firstName: userData.first_name, lastName: userData.last_name,
      });
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      logout(); 
    }
  }, [apiRequest, logout]); 

  const login = async (username, password) => {
    try {
      const data = await apiRequest('AUTH', '/login', 'POST', { username, password }, false);
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      await fetchUserDetails(data.access_token); 
      return data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        setToken(storedToken); 
        await fetchUserDetails(storedToken);
      } else {
        setUser(null); // Ensure user is null if no token
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchUserDetails]); // fetchUserDetails is memoized

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, apiRequest, setUser, setToken, fetchUserDetails }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
