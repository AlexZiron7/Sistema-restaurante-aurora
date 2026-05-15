import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ChefHat, Check, Clock, Trash2, Printer, Volume2, VolumeX } from 'lucide-react';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Audio not supported
  }
};

const getTiempoColor = (minutos) => {
  if (minutos < 10) return { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'text-emerald-300' };
  if (minutos < 20) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'text-yellow-300' };
  return { bg: 'bg-red-500', text: 'text-red-400', label: 'text-red-300' };
};

const imprimirTicketCocina = (mesa, items, mesoneroNombre) => {
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orden Cocina - Mesa ${escapeHtml(String(mesa.numero_mesa))}</title>
      <style>
        @page { margin: 0; size: 58mm auto; }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 14px; 
          width: 58mm; 
          margin: 0; 
          padding: 8px;
          box-sizing: border-box;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .mesa-num { font-size: 32px; font-weight: bold; margin: 10px 0; }
        .divider { border-top: 2px dashed #000; margin: 8px 0; }
        .item { margin: 4px 0; }
        .item-num { font-weight: bold; }
        .notas { color: #d97706; font-size: 12px; margin-left: 10px; }
        .mesonero { text-align: center; margin-top: 10px; font-size: 12px; }
        @media print { body { width: 58mm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <strong>🍽️ PEDIDO</strong>
      </div>
      <div class="mesa-num">MESA #${escapeHtml(String(mesa.numero_mesa))}</div>
      <div class="divider"></div>
      ${items.map((item, idx) => `
        <div class="item">
          <span class="item-num">${idx + 1}.</span> ${escapeHtml(item.nombre_producto)}
          ${item.notas_especiales ? `<div class="notas">⚠️ ${escapeHtml(item.notas_especiales)}</div>` : ''}
        </div>
      `).join('')}
      <div class="divider"></div>
      <div class="mesonero">
        👤 ${escapeHtml(mesoneroNombre || 'Mesonero')}
      </div>
      <script>window.print(); window.close();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

export default function CocinaPage() {
  const { mesas, fetchMesas, isMesaCerrada, setMesasCerradas } = useRestaurant();
  const { socket } = useSocket();
  const { info } = useToast();
  
  const [pedidosCocina, setPedidosCocina] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesasOcultas, setMesasOcultas] = useState(new Set());
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const pedidosPreviosRef = useRef(0);

  const cargarPedidos = useCallback(async () => {
    try {
      const pedidos = await api.getCocinaPedidosPendientes();
      
      const filtrados = pedidos.filter(p => !mesasOcultas.has(p.mesa.id));
      
      const cantidadAnterior = pedidosPreviosRef.current;
      pedidosPreviosRef.current = filtrados.length;
      
      if (cantidadAnterior > 0 && filtrados.length > cantidadAnterior && sonidoActivo) {
        playNotificationSound();
      }
      
      setPedidosCocina(filtrados);
    } catch (err) {
      // Error cargando pedidos
    }
    setLoading(false);
  }, [mesasOcultas, sonidoActivo]);

  useEffect(() => {
    cargarPedidos();
  }, [mesas, mesasOcultas]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('nuevo_pedido', ({ id_mesa }) => {
      info(`Nuevo pedido para mesa ${id_mesa}`);
      if (sonidoActivo) playNotificationSound();
      cargarPedidos();
    });

    socket.on('pedido_actualizado', ({ id_mesa }) => {
      if (id_mesa) info(`Nuevos platos en mesa ${id_mesa}`);
      if (sonidoActivo) playNotificationSound();
      cargarPedidos();
    });

    socket.on('mesa_cerrada', ({ id }) => {
      setMesasOcultas(prev => new Set([...prev, id]));
      setPedidosCocina(prev => prev.filter(p => p.mesa.id !== id));
    });

    return () => {
      socket.off('nuevo_pedido');
      socket.off('pedido_actualizado');
      socket.off('mesa_cerrada');
    };
  }, [socket, sonidoActivo, cargarPedidos]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMesasOcultas(new Set());
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleCompletar = async (mesaId) => {
    try {
      await api.marcarPedidoListo(mesaId);
      fetchMesas();
      cargarPedidos();
    } catch (err) {
      // Error al marcar pedido como listo
    }
  };

  const handleDescartar = (mesaId) => {
    setMesasOcultas(prev => new Set([...prev, mesaId]));
    setPedidosCocina(prev => prev.filter(p => p.mesa.id !== mesaId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  const getTiempoActualizado = (fechaPedido, tiempoMinutos) => {
    const fecha = new Date(fechaPedido);
    const ahora = new Date();
    return Math.floor((ahora - fecha) / 60000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 animate-fade-in">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <ChefHat size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Cocina / Bar</h1>
              <p className="text-gray-400 text-sm">{pedidosCocina.length} pedidos activos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSonidoActivo(!sonidoActivo)}
              className={`p-2 rounded-lg transition-colors btn-press ${
                sonidoActivo ? 'hover:bg-gray-700 text-green-400' : 'hover:bg-gray-700 text-gray-500'
              }`}
              title={sonidoActivo ? 'Silenciar' : 'Activar sonido'}
            >
              {sonidoActivo ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={cargarPedidos}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors btn-press"
            >
              <RefreshCw size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {pedidosCocina.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <ChefHat size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-medium">No hay pedidos pendientes</p>
            <p className="text-sm">Los nuevos pedidos aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidosCocina.map((pedido) => {
              const { mesa, items, mesonero, fecha_pedido } = pedido;
              const tiempoActualizado = getTiempoActualizado(fecha_pedido, pedido.tiempo_minutos);
              const tiempoColor = getTiempoColor(tiempoActualizado);
              
              return (
                <div
                  key={mesa.id}
                  className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{mesa.numero_mesa}</span>
                      </div>
                      <div>
                        <div className="text-white font-bold">Mesa {mesa.numero_mesa}</div>
                        <div className="text-white/70 text-xs flex items-center gap-1">
                          <Clock size={12} />
                          {items.length} items
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => imprimirTicketCocina(mesa, items, mesonero?.nombre)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors btn-press"
                        title="Imprimir ticket"
                      >
                        <Printer size={18} className="text-white" />
                      </button>
                      <button
                        onClick={() => handleDescartar(mesa.id)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors btn-press"
                        title="Descartar"
                      >
                        <Trash2 size={18} className="text-white" />
                      </button>
                      <button
                        onClick={() => handleCompletar(mesa.id)}
                        className="px-4 py-2 bg-white text-orange-600 font-bold rounded-lg hover:bg-gray-100 transition-colors btn-press flex items-center gap-2"
                      >
                        <Check size={18} />
                        Listo
                      </button>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-gray-700/30 border-b border-gray-700 flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      👤 <span className="text-gray-300 font-medium">{mesonero?.nombre || 'Mesonero'}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${tiempoColor.label}`}>
                      <Clock size={12} />
                      {tiempoActualizado} min
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {items.map((item, idx) => (
                      <div
                        key={item.id || `${item.nombre_producto}-${idx}`}
                        className="bg-gray-700/50 rounded-xl p-3 flex items-start gap-3"
                      >
                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-400 font-bold">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{item.nombre_producto}</div>
                          {item.notas_especiales && (
                            <div className="text-yellow-400 text-sm mt-1">
                              📝 {item.notas_especiales}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
