import React, { createContext, useState, useContext, useEffect } from 'react';
import { authenticateWithGoogle, getUserProfile, updateUserProfile } from '../services/api';
import { setToken as setAuthToken, removeToken, getToken } from '../utils/auth';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = async () => {
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await getUserProfile(token);
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user:', err);
      setError(err.message);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (googleData) => {
    try {
      setError(null);
      const data = await authenticateWithGoogle(googleData.credential);
      setAuthToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const updateProfile = async (updates) => {
    try {
      setError(null);
      const token = getToken();
      const updatedUser = await updateUserProfile(updates, token);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message);
      throw err;
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, error, login, logout, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 