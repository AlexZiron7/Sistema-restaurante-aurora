import { useState, useEffect } from 'react';
import { RefreshCw, DollarSign, Eye, EyeOff, Save, CheckCircle, HardDrive, Download, Trash2, RotateCcw, FileText } from 'lucide-react';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

function formatearBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleString('es-VE', {
    dateStyle: 'short', timeStyle: 'short'
  });
}

export default function ConfigPage({ onUpdate }) {
  const { config, tasaBCV, updateConfig, actualizarTasaBCV } = useRestaurant();
  const { success, error } = useToast();
  const [actualizandoTasa, setActualizandoTasa] = useState(false);
  const [tasaActual, setTasaActual] = useState(0);

  const [backups, setBackups] = useState([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [creandoBackup, setCreandoBackup] = useState(false);
  const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    setTasaActual(tasaBCV);
  }, [tasaBCV]);

  useEffect(() => { cargarBackups(); }, []);

  const cargarBackups = async () => {
    setBackupsLoading(true);
    try {
      const data = await api.getBackups();
      setBackups(data);
    } catch { setBackups([]); }
    setBackupsLoading(false);
  };

  const handleCrearBackup = async () => {
    setCreandoBackup(true);
    try {
      const result = await api.crearBackup();
      if (result.success) {
        success(`Backup creado: ${result.backup.nombre}`);
        cargarBackups();
      }
    } catch (e) {
      error(e.message);
    }
    setCreandoBackup(false);
  };

  const handleRestaurarBackup = async (nombre) => {
    setConfirm({
      isOpen: true,
      title: 'Restaurar Backup',
      message: `¿Restaurar backup "${nombre}"?\n\nSe perderán todos los datos actuales. El servidor debe reiniciarse después de la restauración.`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, isOpen: false }));
        try {
          const result = await api.restaurarBackup(nombre);
          if (result.success) success(result.message);
        } catch (e) { error(e.message); }
      }
    });
  };

  const handleEliminarBackup = async (nombre) => {
    setConfirm({
      isOpen: true,
      title: 'Eliminar Backup',
      message: `¿Eliminar backup "${nombre}"?`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, isOpen: false }));
        try {
          await api.eliminarBackup(nombre);
          success('Backup eliminado');
          cargarBackups();
        } catch (e) { error(e.message); }
      }
    });
  };

  const handleToggle = async (clave, valorActual) => {
    const nuevoValor = !valorActual;
    const result = await updateConfig(clave, nuevoValor);
    if (result.success) {
      success(`${clave === 'mostrar_precios_usd' ? 'Precios USD' : 'Precios Bs.'} ${nuevoValor ? 'visibles' : 'ocultos'}`);
    } else {
      error('Error al actualizar');
    }
  };

  const handleActualizarTasa = async () => {
    setActualizandoTasa(true);
    const result = await actualizarTasaBCV();
    setActualizandoTasa(false);

    if (result.success) {
      setTasaActual(result.tasa);
      success(`Tasa BCV actualizada: $${result.tasa.toLocaleString('es-VE')}`);
      if (onUpdate) onUpdate();
    } else {
      error('No se pudo actualizar la tasa BCV');
    }
  };

  const formatearTasa = (tasa) => {
    if (!tasa || tasa === 0) return 'No disponible';
    return parseFloat(tasa).toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Configuración General</h2>

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-green-600" />
            Tasa BCV
          </h3>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
            <div>
              <p className="text-sm text-gray-500">Tasa actual del dólar:</p>
              <p className="text-2xl font-bold text-green-600">
                {actualizandoTasa ? 'Actualizando...' : formatearTasa(tasaActual)}
              </p>
            </div>
            <button
              onClick={handleActualizarTasa}
              disabled={actualizandoTasa}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors btn-press"
            >
              {actualizandoTasa ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <RefreshCw size={18} />
              )}
              Actualizar
            </button>
          </div>

          <p className="text-xs text-gray-500">
            La tasa se obtiene automáticamente de fuentes en línea. Si no hay conexión, se mantendrá la última tasa guardada.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Eye size={20} className="text-blue-600" />
            Visualización de Precios
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Precios en USD</p>
                <p className="text-sm text-gray-500">Mostrar precios en dólares americanos</p>
              </div>
              <button
                onClick={() => handleToggle('mostrar_precios_usd', config.mostrar_precios_usd)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  config.mostrar_precios_usd ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  config.mostrar_precios_usd ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Precios en Bolívares (REF)</p>
                <p className="text-sm text-gray-500">Mostrar precios convertidos en Bs.</p>
              </div>
              <button
                onClick={() => handleToggle('mostrar_precios_bs', config.mostrar_precios_bs)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  config.mostrar_precios_bs ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  config.mostrar_precios_bs ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
          <h3 className="font-bold text-primary-800 mb-2">Vista previa de precios</h3>
          <div className="bg-white rounded-lg p-4">
            <p className="text-gray-600 mb-1">Ejemplo con producto de $20.00:</p>
            <div className="space-y-1">
              {config.mostrar_precios_usd && (
                <p className="text-green-600 font-bold">$20.00 USD</p>
              )}
              {config.mostrar_precios_bs && tasaBCV > 0 && (
                <p className="text-gray-600">
                  Bs. {(20 * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </p>
              )}
              {!config.mostrar_precios_usd && !config.mostrar_precios_bs && (
                <p className="text-gray-400 italic">Sin precios visibles</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <HardDrive size={20} className="text-gray-600" />
            Copias de Seguridad
          </h3>

          <button
            onClick={handleCrearBackup}
            disabled={creandoBackup}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors btn-press mb-4"
          >
            {creandoBackup ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {creandoBackup ? 'Creando...' : 'Crear copia de seguridad'}
          </button>

          {backupsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-gray-400" size={24} />
            </div>
          ) : backups.length === 0 ? (
            <EmptyState
              icon={FileText}
              message="No hay copias de seguridad"
            />
          ) : (
            <div className="space-y-2">
              {backups.map(b => (
                <div key={b.nombre} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{b.nombre}</p>
                    <p className="text-xs text-gray-500">{formatearBytes(b.tamaño)} — {formatearFecha(b.fecha)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleRestaurarBackup(b.nombre)}
                      className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-600"
                      title="Restaurar"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => handleEliminarBackup(b.nombre)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, isOpen: false }))}
        title={confirm.title}
        message={confirm.message}
      />
    </div>
  );
}
