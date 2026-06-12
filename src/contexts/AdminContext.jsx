import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAdminSession, loginAdmin, logoutAdmin } from '../lib/api';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getAdminSession()
      .then(({ isAdmin: hasSession }) => {
        if (isMounted) setIsAdmin(Boolean(hasSession));
      })
      .catch(() => {
        if (isMounted) setIsAdmin(false);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (password) => {
    try {
      await loginAdmin(password);
      setIsAdmin(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await logoutAdmin();
    } finally {
      setIsAdmin(false);
    }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
