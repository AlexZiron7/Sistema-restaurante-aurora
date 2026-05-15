import { useState, useEffect } from 'react';
import { Users, UtensilsCrossed, Settings, RefreshCw, History, Calendar, DollarSign, Receipt, FileText, FileSpreadsheet, File } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';
import UsuariosPage from './UsuariosPage';
import MenuPage from './MenuPage';
import ConfigPage from './ConfigPage';

function HistorialMesoneros() {
  const { user } = useAuth();
  const { error } = useToast();
  const [mesoneros, setMesoneros] = useState([]);
  const [selectedMesonero, setSelectedMesonero] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [desde, setDesde] = useState(new Date().toISOString().split('T')[0]);
  const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);

  const isAdmin = user?.rol === 'dueno' || user?.rol === 'admin';

  useEffect(() => {
    api.getMesoneros().then(setMesoneros).catch(() => error('Error al cargar mesoneros'));
  }, []);

  const cargarHistorial = async (mesoneroId) => {
    setLoading(true);
    try {
      const data = await api.getHistorialMesonero(mesoneroId, { desde, hasta });
      setHistorial(data);
    } catch {
      error('Error al cargar historial');
    }
    setLoading(false);
  };

  const handleSelectMesonero = (mesonero) => {
    setSelectedMesonero(mesonero);
    cargarHistorial(mesonero.id);
  };

  const columnas = {
    headers: [
      { key: 'id', label: 'ID' },
      { key: 'numero_mesa', label: 'Mesa' },
      { key: 'total', label: 'Total' },
      { key: 'propina', label: 'Propina' },
      { key: 'metodo_pago', label: 'Método' },
      { key: 'fecha_cierre', label: 'Fecha' }
    ],
    dataKey: 'pedidos'
  };

  const exportar = async (formato) => {
    if (!historial) return;
    const data = { desde, hasta, pedidos: historial.pedidos, resumen: historial.stats };
    if (formato === 'pdf') exportToPDF(data, `Historial_${historial.mesonero}`, columnas);
    else if (formato === 'excel') await exportToExcel(data, `Historial_${historial.mesonero}`, columnas);
    else if (formato === 'csv') exportToCSV(data, `Historial_${historial.mesonero}`, columnas);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Desde:</span>
          <input
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
            className="text-sm font-semibold bg-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Hasta:</span>
          <input
            type="date"
            value={hasta}
            min={desde}
            onChange={(e) => setHasta(e.target.value)}
            className="text-sm font-semibold bg-transparent outline-none"
          />
        </div>
        {selectedMesonero && (
          <button
            onClick={() => cargarHistorial(selectedMesonero.id)}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Filtrar
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-bold text-gray-700">Mesoneros</h3>
          {mesoneros.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay mesoneros registrados</p>
          ) : (
            mesoneros.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelectMesonero(m)}
                className={`w-full p-3 rounded-xl text-left transition-colors ${
                  selectedMesonero?.id === m.id
                    ? 'bg-primary-50 border-2 border-primary-500'
                    : 'bg-white border border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">{m.nombre}</div>
                <div className="text-xs text-gray-500">@{m.usuario}</div>
              </button>
            ))
          )}
        </div>

        <div className="md:col-span-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="animate-spin text-primary-600" size={32} />
            </div>
          ) : historial ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
                <h3 className="font-bold text-lg">{historial.mesonero}</h3>
                <p className="text-white/70 text-sm">Historial de atención</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-4 border text-center">
                  <Receipt size={20} className="mx-auto text-indigo-500 mb-1" />
                  <div className="text-2xl font-black text-gray-800">{historial.stats?.pedidos || 0}</div>
                  <div className="text-xs text-gray-500">Pedidos</div>
                </div>
                <div className="bg-white rounded-xl p-4 border text-center">
                  <DollarSign size={20} className="mx-auto text-emerald-500 mb-1" />
                  <div className="text-2xl font-black text-gray-800">${(historial.stats?.ventas || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Ventas</div>
                </div>
                <div className="bg-white rounded-xl p-4 border text-center">
                  <History size={20} className="mx-auto text-amber-500 mb-1" />
                  <div className="text-2xl font-black text-gray-800">${(historial.stats?.propinas || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Propinas</div>
                </div>
              </div>

              {isAdmin && historial && (
                <div className="flex gap-2 justify-end">
                  <button onClick={() => exportar('pdf')} className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                    <FileText size={14} /> PDF
                  </button>
                  <button onClick={() => exportar('excel')} className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                    <FileSpreadsheet size={14} /> Excel
                  </button>
                  <button onClick={() => exportar('csv')} className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                    <File size={14} /> CSV
                  </button>
                </div>
              )}

              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border-b">
                  Pedidos ({historial.pedidos?.length || 0})
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {historial.pedidos?.length === 0 ? (
                    <p className="p-4 text-gray-400 text-center text-sm">Sin pedidos en este período</p>
                  ) : (
                    historial.pedidos?.map((pedido) => (
                      <div key={pedido.id} className="px-4 py-3 border-b last:border-0 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-800">Mesa {pedido.numero_mesa}</div>
                          <div className="text-xs text-gray-400">
                            {pedido.fecha_cierre ? new Date(pedido.fecha_cierre).toLocaleString('es-VE') : '-'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800">${((pedido.total || 0) + (pedido.propina || 0)).toFixed(2)}</div>
                          <div className="text-xs text-gray-400">{pedido.metodo_pago}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              <History size={48} className="mx-auto mb-3 opacity-30" />
              <p>Selecciona un mesonero para ver su historial</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = [
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'menu', label: 'Menú', icon: UtensilsCrossed },
    { id: 'mesoneros', label: 'Mesoneros', icon: History },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'usuarios':
        return <UsuariosPage key={refreshKey} />;
      case 'menu':
        return <MenuPage key={refreshKey} />;
      case 'mesoneros':
        return <HistorialMesoneros />;
      case 'config':
        return <ConfigPage onUpdate={() => setRefreshKey(k => k + 1)} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Settings size={20} className="text-white sm:hidden" />
              <Settings size={24} className="text-white hidden sm:block" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-800 leading-tight truncate">Panel de Administración</h1>
              <p className="text-gray-500 text-xs sm:text-sm hidden sm:block">Gestiona usuarios, menú y configuración</p>
            </div>
          </div>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors btn-press flex-shrink-0"
            title="Actualizar"
          >
            <RefreshCw size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="flex overflow-x-auto scrollbar-hide px-2 sm:px-4 gap-0.5">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
}
