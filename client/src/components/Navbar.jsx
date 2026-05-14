import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  ChefHat, 
  Receipt, 
  LayoutDashboard, 
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Bell,
  History,
  BookOpen,
  HeadphonesIcon,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useRestaurant } from '../contexts/RestaurantContext';
import { puedeVerConfig } from '../services/api';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const { alertas, marcarAlertaLeida } = useRestaurant();
  const [showAlertas, setShowAlertas] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const isDemo = localStorage.getItem('modo_demo') === 'true';

  const getNavItems = () => {
    const items = [
      { path: '/mesas', icon: LayoutGrid, label: 'Mesas', roles: ['dueno', 'admin', 'gerente', 'cajero', 'mesonero', 'cocina'] },
      { path: '/mi-historial', icon: History, label: 'Historial', roles: ['mesonero'] },
      { path: '/cocina', icon: ChefHat, label: 'Cocina', roles: ['dueno', 'admin', 'gerente', 'cocina'] },
      { path: '/caja', icon: Receipt, label: 'Caja', roles: ['dueno', 'admin', 'gerente', 'cajero'] },
      { path: '/dashboard', icon: LayoutDashboard, label: 'Estadísticas', roles: ['dueno', 'admin', 'gerente'] },
    ];
    return items.filter(item => item.roles.includes(user?.rol));
  };

  const navItems = getNavItems();

  const secondaryItems = [];
  if (['dueno', 'admin', 'gerente', 'cajero'].includes(user?.rol)) {
    secondaryItems.push({ path: '/historial', icon: History, label: 'Historial' });
  }
  if (puedeVerConfig(user?.rol)) {
    secondaryItems.push({ path: '/admin', icon: Settings, label: 'Administración' });
  }
  secondaryItems.push({ path: '/manual', icon: BookOpen, label: 'Manual' });
  secondaryItems.push({ path: '/soporte', icon: HeadphonesIcon, label: 'Soporte' });

  const isActive = (path) => location.pathname === path;
  const puedeAccederAdmin = ['dueno', 'admin', 'gerente'].includes(user?.rol);

  return (
    <>
      {/* ==================== SIDEBAR - Solo Desktop LG (≥1024px) ==================== */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r shadow-lg h-full flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
              <span className="text-white font-black text-lg">R</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-gray-800 text-sm leading-tight truncate">Restaurante</h1>
              {isDemo && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  DEMO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Principal
          </div>
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Más
            </div>
            {secondaryItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer - User Info */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              socket?.connected ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
            }`}>
              {socket?.connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{socket?.connected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">{user?.nombre?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.nombre}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.rol}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ==================== MOBILE & TABLET HEADER (< 1024px) ==================== */}
      <div className="flex lg:hidden bg-white border-b shadow-sm px-3 py-2 items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">R</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 text-sm leading-tight">{user?.nombre}</span>
            <span className="text-[10px] text-gray-400 capitalize">{user?.rol}</span>
          </div>
          {isDemo && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              DEMO
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {user?.rol === 'cajero' && alertas.length > 0 && (
            <button
              onClick={() => setShowAlertas(!showAlertas)}
              className="relative p-2 rounded-lg text-rose-600 hover:bg-rose-50"
            >
              <Bell size={20} className="animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {alertas.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Alerts Dropdown */}
      {showAlertas && (
        <div className="lg:hidden absolute right-2 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Bell size={16} />
              Cobros Pendientes
            </div>
            <button onClick={() => setShowAlertas(false)} className="text-white/70 hover:text-white text-xl">×</button>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
            {alertas.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">Sin alertas</div>
            ) : (
              alertas.map(alerta => (
                <div
                  key={alerta.id}
                  className="p-3 hover:bg-rose-50 cursor-pointer flex items-center justify-between gap-3"
                  onClick={() => { marcarAlertaLeida(alerta.id); setShowAlertas(false); }}
                >
                  <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center font-black text-rose-600 text-sm">
                    {alerta.mesa}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 text-sm">Mesa {alerta.mesa}</div>
                    <div className="text-xs text-gray-400">
                      {alerta.porcentaje > 0 ? `${alerta.porcentaje}% propina` : 'Sin propina'}
                    </div>
                  </div>
                  <div className="font-black text-emerald-600 text-sm">${alerta.total?.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="lg:hidden absolute top-12 left-0 right-0 bg-white border-b shadow-lg z-40">
          <div className="p-2 space-y-1">
            {secondaryItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  isActive(path) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => { setShowMobileMenu(false); logout(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM NAVIGATION - Mobile & Tablet (< 1024px) ==================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30 h-16">
        <div className="flex justify-around items-center h-full px-2">
          {navItems.slice(0, 5).map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors flex-1 h-full ${
                  isActive 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-gray-500'
                }`
              }
            >
              <Icon size={22} />
              <span className="text-[10px] truncate max-w-full">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
