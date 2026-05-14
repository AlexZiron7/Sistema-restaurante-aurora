import { useState, useEffect } from 'react';
import { RefreshCw, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import MesaCard from '../components/MesaCard';
import Modal from '../components/Modal';
import PedidoModal from './PedidoModal';
import CerrarMesaModal from '../components/CerrarMesaModal';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { puedeVerConfig } from '../services/api';

export default function MesasPage() {
  const { mesas, loading, fetchMesas, updateEstadoMesa } = useRestaurant();
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [showMesaModal, setShowMesaModal] = useState(false);
  const [mesaEditando, setMesaEditando] = useState(null);
  const [mesaNumero, setMesaNumero] = useState('');
  const [mesaCapacidad, setMesaCapacidad] = useState(4);
  const [eliminandoMesa, setEliminandoMesa] = useState(null);
  const [filter, setFilter] = useState('todas');

  useEffect(() => {
    fetchMesas();
  }, []);

  const siguienteNumero = () => {
    if (mesas.length === 0) return 1;
    const maxNum = Math.max(...mesas.map(m => m.numero_mesa));
    return maxNum + 1;
  };

  const openNuevaMesa = () => {
    setMesaEditando(null);
    setMesaNumero(siguienteNumero().toString());
    setMesaCapacidad(4);
    setShowMesaModal(true);
  };

  const openEditarMesa = (mesa) => {
    setMesaEditando(mesa);
    setMesaNumero(mesa.numero_mesa.toString());
    setMesaCapacidad(mesa.capacidad || 4);
    setShowMesaModal(true);
  };

  const handleGuardarMesa = async () => {
    const numero = parseInt(mesaNumero);
    if (isNaN(numero) || numero < 1) {
      error('Ingresa un número de mesa válido');
      return;
    }

    let result;
    if (mesaEditando) {
      result = await api.actualizarMesa(mesaEditando.id, numero, mesaCapacidad);
    } else {
      result = await api.crearMesa(numero, mesaCapacidad);
    }

    if (result.success) {
      success(mesaEditando ? 'Mesa actualizada' : 'Mesa creada');
      setShowMesaModal(false);
      fetchMesas();
    } else {
      error(result.message || 'Error al guardar la mesa');
    }
  };

  const handleEliminarMesa = async () => {
    if (!eliminandoMesa) return;
    
    const result = await api.eliminarMesa(eliminandoMesa.id);
    if (result.success) {
      success('Mesa eliminada');
      setEliminandoMesa(null);
      fetchMesas();
    } else {
      error(result.message || 'No se pudo eliminar la mesa');
    }
  };

  const handleMesaClick = (mesa) => {
    setSelectedMesa(mesa);
    if (mesa.estado === 'libre' || mesa.estado === 'atendida') {
      setShowPedidoModal(true);
    }
  };

  const handleCerrarMesa = (mesa) => {
    setSelectedMesa(mesa);
    setShowCerrarModal(true);
  };

  const handleEstadoChange = async (id, nuevoEstado) => {
    const result = await updateEstadoMesa(id, nuevoEstado);
    if (result.success) {
      success(`Mesa actualizada a ${nuevoEstado}`);
    } else {
      error('Error al actualizar la mesa');
    }
  };

  const filteredMesas = mesas.filter(mesa => {
    if (filter === 'todas') return true;
    return mesa.estado === filter;
  });

  const statusCounts = {
    todas: mesas.length,
    libre: mesas.filter(m => m.estado === 'libre').length,
    ocupada: mesas.filter(m => m.estado === 'ocupada').length,
    atendida: mesas.filter(m => m.estado === 'atendida').length,
    cuenta: mesas.filter(m => m.estado === 'cuenta').length,
    limpiando: mesas.filter(m => m.estado === 'limpiando').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-800">Mesas del Restaurante</h1>
          <div className="flex items-center gap-2">
            {puedeVerConfig(user?.rol) && (
              <button
                onClick={openNuevaMesa}
                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full btn-press"
                title="Agregar mesa"
              >
                <Plus size={20} />
              </button>
            )}
            <button
              onClick={fetchMesas}
              className="p-2 hover:bg-gray-100 rounded-full btn-press"
            >
              <RefreshCw size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'todas', label: 'Todas', color: 'bg-gray-500' },
            { key: 'libre', label: 'Libres', color: 'bg-green-500' },
            { key: 'ocupada', label: 'Ocupadas', color: 'bg-red-500' },
            { key: 'atendida', label: 'Atendidas', color: 'bg-blue-500' },
            { key: 'cuenta', label: 'Cuentas', color: 'bg-purple-500' },
            { key: 'limpiando', label: 'Limpiando', color: 'bg-yellow-500' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === key
                  ? `${color} text-white`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label} ({statusCounts[key]})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMesas.map((mesa) => (
            <MesaCard
              key={mesa.id}
              mesa={mesa}
              onClick={handleMesaClick}
              onEstadoChange={handleEstadoChange}
              onCerrarMesa={handleCerrarMesa}
              onEditar={puedeVerConfig(user?.rol) ? openEditarMesa : undefined}
              onEliminar={puedeVerConfig(user?.rol) && mesa.estado === 'libre' ? setEliminandoMesa : undefined}
            />
          ))}
        </div>

        {filteredMesas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay mesas con este estado</p>
          </div>
        )}
      </div>

      <PedidoModal
        isOpen={showPedidoModal}
        onClose={() => {
          setShowPedidoModal(false);
          setSelectedMesa(null);
        }}
        mesa={selectedMesa}
      />

      <CerrarMesaModal
        isOpen={showCerrarModal}
        onClose={() => {
          setShowCerrarModal(false);
          setSelectedMesa(null);
        }}
        mesa={selectedMesa}
      />

      <Modal
        isOpen={showMesaModal}
        onClose={() => setShowMesaModal(false)}
        title={mesaEditando ? 'Editar Mesa' : 'Nueva Mesa'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Mesa</label>
            <input
              type="number"
              min="1"
              value={mesaNumero}
              onChange={(e) => setMesaNumero(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
            <select
              value={mesaCapacidad}
              onChange={(e) => setMesaCapacidad(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value={2}>2 personas</option>
              <option value={4}>4 personas</option>
              <option value={6}>6 personas</option>
              <option value={8}>8 personas</option>
              <option value={10}>10 personas</option>
              <option value={12}>12 personas</option>
            </select>
          </div>
          <button
            onClick={handleGuardarMesa}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors"
          >
            {mesaEditando ? 'Guardar Cambios' : 'Crear Mesa'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!eliminandoMesa}
        onClose={() => setEliminandoMesa(null)}
        title="Eliminar Mesa"
        size="sm"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            ¿Estás seguro de eliminar la mesa <strong>#{eliminandoMesa?.numero_mesa}</strong>?
          </p>
          <p className="text-sm text-red-500 mb-4">
            Solo se pueden eliminar mesas que estén libres.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setEliminandoMesa(null)}
              className="flex-1 py-2 border rounded-lg font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminarMesa}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
