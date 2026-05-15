import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RestaurantProvider } from './contexts/RestaurantContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Navbar';
import UpdateBanner from './components/UpdateBanner';
import SocketStatus from './components/SocketStatus';
import ErrorBoundary from './components/ErrorBoundary';
import LockScreen from './components/LockScreen';
import { puedeVerConfig } from './services/api';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const MesasPage = lazy(() => import('./pages/MesasPage'));
const CocinaPage = lazy(() => import('./pages/CocinaPage'));
const CajaPage = lazy(() => import('./pages/CajaPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const HistorialPage = lazy(() => import('./pages/HistorialPage'));
const MiHistorialPage = lazy(() => import('./pages/MiHistorialPage'));
const ManualPage = lazy(() => import('./pages/ManualPage'));
const SoportePage = lazy(() => import('./pages/SoportePage'));

function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
          <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-sky-200">
            <span className="text-white text-2xl font-black italic">A</span>
          </div>
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
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
  const [license, setLicense] = useState({ isSystemLocked: false, lockMessage: '' });

  useEffect(() => {
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
        <Route path="/login" element={user ? <Navigate to="/mesas" replace /> : <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
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
                    <Suspense fallback={<PageLoader />}>
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
                    </Suspense>
                  </div>
                </main>
                <UpdateBanner />
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
              <SocketStatus />
              <AppRoutes />
            </ToastProvider>
          </RestaurantProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
