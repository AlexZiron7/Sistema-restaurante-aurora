import { useState, useEffect } from 'react';
import { History, Calendar, RefreshCw, Receipt, DollarSign, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';

const METODO_LABELS = {
  efectivo: 'Efectivo',
  pago_movil: 'Pago Móvil',
  tarjeta: 'Tarjeta',
  zelle: 'Zelle',
  zinli: 'Zinli'
};

export default function MiHistorialPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { success } = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState('hoy');
  const [notifCount, setNotifCount] = useState(0);
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('mi_pedido_listo', (data) => {
      success(`🍽️ ${data.mensaje}`);
      setNotifCount(prev => prev + 1);
      cargarHistorial();
    });
    
    return () => {
      socket.off('mi_pedido_listo');
    };
  }, [socket, success]);
  
  const getFechas = (p) => {
    const hoy = new Date();
    const fecha = new Date();
    
    if (p === 'hoy') {
      return { desde: hoy.toISOString().split('T')[0], hasta: hoy.toISOString().split('T')[0] };
    } else if (p === '7dias') {
      fecha.setDate(fecha.getDate() - 7);
      return { desde: fecha.toISOString().split('T')[0], hasta: hoy.toISOString().split('T')[0] };
    } else if (p === '30dias') {
      fecha.setDate(fecha.getDate() - 30);
      return { desde: fecha.toISOString().split('T')[0], hasta: hoy.toISOString().split('T')[0] };
    }
    return { desde: hoy.toISOString().split('T')[0], hasta: hoy.toISOString().split('T')[0] };
  };

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const { desde, hasta } = getFechas(periodo);
      const data = await api.getMiHistorial(user.id, desde, hasta);
      setPedidos(data.pedidos || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarHistorial();
  }, [periodo, user.id]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <History size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Mi Historial</h1>
            <p className="text-xs text-gray-400">Tus atenciones</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b px-4 py-3">
        <div className="flex gap-2">
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: '7dias', label: '7 días' },
            { id: '30dias', label: '30 días' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                periodo === p.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={cargarHistorial}
            className="p-2 hover:bg-gray-100 rounded-xl ml-auto"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-gray-600' : 'text-gray-600'} />
          </button>
        </div>
      </div>

      {stats && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-black">{stats.pedidos || 0}</div>
              <div className="text-xs opacity-80">Pedidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">${(stats.ventas || 0).toFixed(2)}</div>
              <div className="text-xs opacity-80">Ventas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black">${(stats.propinas || 0).toFixed(2)}</div>
              <div className="text-xs opacity-80">Propinas</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="animate-spin text-indigo-400" size={36} />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <History size={48} className="mb-3 opacity-30" />
            <p className="font-medium">Sin pedidos en este período</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-2xl shadow-sm border p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <span className="text-indigo-700 font-black">{pedido.numero_mesa}</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">Mesa {pedido.numero_mesa}</div>
                      <div className="text-xs text-gray-400">
                        {pedido.fecha_cierre ? new Date(pedido.fecha_cierre).toLocaleString('es-VE') : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">${((pedido.total || 0) + (pedido.propina || 0)).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{METODO_LABELS[pedido.metodo_pago] || pedido.metodo_pago}</div>
                  </div>
                </div>
                {pedido.propina > 0 && (
                  <div className="text-xs text-emerald-600 font-medium">
                    +${pedido.propina.toFixed(2)} propina
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
