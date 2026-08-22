import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check staffUser, adminUser, or receptionUser from localStorage
    const storedStaff = localStorage.getItem('staffUser') || localStorage.getItem('adminUser') || localStorage.getItem('receptionUser');
    if (storedStaff) {
      try {
        const parsed = JSON.parse(storedStaff);
        const userData = parsed.user || parsed;
        if (userData.role === 'reception') userData.role = 'receptionist';
        setUser(userData);
      } catch (_) {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/staff/login', { email, password });
    const staffData = data.data.user || data.data;
    if (staffData.role === 'reception') staffData.role = 'receptionist';
    const token = data.data.token;

    // Save tokens and user info across standard storage keys
    localStorage.setItem('staffToken', token);
    localStorage.setItem('staffUser', JSON.stringify(staffData));
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(staffData));
    localStorage.setItem('receptionToken', token);
    localStorage.setItem('receptionUser', JSON.stringify(staffData));

    setUser(staffData);
    return { user: staffData, token };
  };

  const logout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('receptionToken');
    localStorage.removeItem('receptionUser');
    setUser(null);
  };

  const updateAdmin = useCallback((updatedFields) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('staffUser', JSON.stringify(updated));
      localStorage.setItem('adminUser', JSON.stringify(updated));
      localStorage.setItem('receptionUser', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateUser = updateAdmin;

  const role = user?.role || null;
  const isAdmin = role === 'admin';
  const isReceptionist = role === 'receptionist' || role === 'reception';

  return (
    <AuthContext.Provider
      value={{
        user,
        admin: user,
        receptionUser: user,
        role,
        isAdmin,
        isReceptionist,
        login,
        logout,
        loading,
        updateAdmin,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
