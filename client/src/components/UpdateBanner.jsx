import { useState, useEffect } from 'react';
import { Download, X, Rocket } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function UpdateBanner() {
  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const data = await api.getUpdatesCheck();
        if (data && data.available) {
          setUpdate(data);
        }
      } catch (err) {
        console.error('Error al buscar actualizaciones:', err);
      }
    };

    checkUpdates();
    // Revisar cada hora
    const interval = setInterval(checkUpdates, 3600000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    if (!update) return;
    setLoading(true);
    try {
      success('Iniciando descarga de actualización...');
      await api.instalarUpdate(update.url);
      // El servidor se cerrará, el cliente perderá conexión
    } catch (err) {
      error(err.message || 'Error al iniciar la actualización');
      setLoading(false);
    }
  };

  if (!update || !visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:bottom-6 lg:right-6 lg:left-auto lg:w-96 z-50 animate-bounce-in">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 rounded-2xl shadow-2xl shadow-indigo-200 border border-indigo-400/30 relative overflow-hidden">
        {/* Decoración fondo */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        
        <div className="flex gap-4 relative">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Rocket className="text-white" size={24} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-sm">Nueva versión disponible (v{update.version})</h3>
            <p className="text-xs text-indigo-100 mt-1 line-clamp-2">
              {update.notes || 'Mejoras de rendimiento y nuevas funciones.'}
            </p>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={loading}
                className="flex-1 bg-white text-indigo-600 py-1.5 px-3 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                Actualizar ahora
              </button>
              <button
                onClick={() => setVisible(false)}
                className="bg-indigo-500/30 text-white py-1.5 px-3 rounded-lg text-xs font-medium hover:bg-indigo-500/50 transition-colors"
              >
                Después
              </button>
            </div>
          </div>

          <button 
            onClick={() => setVisible(false)}
            className="absolute -top-1 -right-1 p-1 text-white/70 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
