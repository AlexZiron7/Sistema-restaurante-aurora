import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const AuthContext = createContext(null);

const ROL_REDIRECTS = {
  mesonero: '/mesas',
  cajero: '/caja',
  gerente: '/dashboard',
  admin: '/admin',
  dueno: '/admin'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('restaurante_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user && !loading) {
      const redirectPath = ROL_REDIRECTS[user.rol] || '/mesas';
      if (window.location.pathname === '/login' || window.location.pathname === '/') {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const login = async (usuario, pin) => {
    try {
      const response = await api.login(usuario, pin);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('restaurante_user', JSON.stringify(response.user));
        const redirectPath = ROL_REDIRECTS[response.user.rol] || '/mesas';
        navigate(redirectPath, { replace: true });
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Error de conexión' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('restaurante_user');
    localStorage.removeItem('modo_demo');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
