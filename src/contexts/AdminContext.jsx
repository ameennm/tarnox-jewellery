import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('tarnox_admin_auth');
    if (authStatus === 'true') {
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  const login = (password) => {
    if (password === 'admin') {
      setIsAdmin(true);
      localStorage.setItem('tarnox_admin_auth', 'true');
      return { success: true };
    }
    return { success: false, error: 'Invalid password' };
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('tarnox_admin_auth');
  };

  return (
    <AdminContext.Provider value={{ isAdmin, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
