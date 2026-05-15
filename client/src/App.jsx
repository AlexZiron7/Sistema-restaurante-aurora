import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RestaurantProvider } from './contexts/RestaurantContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import LockScreen from './components/LockScreen';
import LoginPage from './pages/LoginPage';
import MesasPage from './pages/MesasPage';
import CocinaPage from './pages/CocinaPage';
import CajaPage from './pages/CajaPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import HistorialPage from './pages/HistorialPage';
import MiHistorialPage from './pages/MiHistorialPage';
import ManualPage from './pages/ManualPage';
import SoportePage from './pages/SoportePage';
import { puedeVerConfig } from './services/api';

const ROL_ACCESS = {
  '/mesas': ['dueno', 'admin', 'gerente', 'cajero', 'mesonero', 'cocina'],
  '/mi-historial': ['mesonero'],
  '/cocina': ['dueno', 'admin', 'gerente', 'cocina'],
  '/caja': ['dueno', 'admin', 'gerente', 'cajero'],
  '/dashboard': ['dueno', 'admin', 'gerente'],
  '/historial': ['dueno', 'admin', 'gerente', 'cajero'],
  '/admin': ['dueno', 'admin', 'gerente']
};

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white text-2xl font-black">R</span>
          </div>
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = ROL_ACCESS[location.pathname];
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    const defaultPath = user.rol === 'mesonero' ? '/mi-historial' : 
                       user.rol === 'cajero' ? '/caja' : '/dashboard';
    return <Navigate to={defaultPath} replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || !puedeVerConfig(user.rol)) {
    return <Navigate to="/mesas" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const [license, setLicense] = React.useState({ isSystemLocked: false, lockMessage: '' });

  React.useEffect(() => {
    // Verificar licencia al cargar
      fetch('/api/license-status')
      .then(res => res.json())
      .then(data => setLicense(data))
      .catch(err => console.error('Error al verificar licencia:', err));
  }, []);

  if (license.isSystemLocked) {
    return <LockScreen message={license.lockMessage} clientId={license.clientId} />;
  }

  return (
    <div className="h-[100dvh] flex bg-gray-100">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/mesas" replace /> : <LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex flex-col lg:flex-row h-full w-full">
                {/* Navbar: Sidebar (lg+) + Header + Bottom Nav (< lg) */}
                <Navbar />
                
                {/* Contenido principal */}
                <main className="flex-1 flex flex-col overflow-y-auto pb-16 lg:pb-0 min-h-0">
                  <div className="flex-1 overflow-y-auto w-full relative">
                    <Routes>
                      <Route path="/" element={<Navigate to="/mesas" replace />} />
                      <Route path="/mesas" element={<MesasPage />} />
                      <Route path="/mi-historial" element={<MiHistorialPage />} />
                      <Route path="/cocina" element={<CocinaPage />} />
                      <Route path="/caja" element={<CajaPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/historial" element={<HistorialPage />} />
                      <Route path="/manual" element={<ManualPage />} />
                      <Route path="/soporte" element={<SoportePage />} />
                      <Route path="/admin" element={
                        <AdminRoute>
                          <AdminPage />
                        </AdminRoute>
                      } />
                    </Routes>
                  </div>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <RestaurantProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </RestaurantProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
