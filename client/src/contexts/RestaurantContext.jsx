import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const RestaurantContext = createContext(null);

export function RestaurantProvider({ children }) {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoActual, setPedidoActual] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [config, setConfig] = useState({
    tasa_bcv: 0,
    mostrar_precios_usd: true,
    mostrar_precios_bs: true
  });
  const [tasaBCV, setTasaBCV] = useState(0);
  const { socket } = useSocket();

  const fetchConfig = useCallback(async () => {
    try {
      const [configData, tasaData] = await Promise.all([
        api.getConfig(),
        api.getTasaBCV()
      ]);
      setConfig(configData);
      setTasaBCV(tasaData.tasa || 0);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  }, []);

  const fetchMesas = useCallback(async () => {
    try {
      const data = await api.getMesas();
      setMesas(data);
    } catch (error) {
      console.error('Error fetching mesas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchMesas();
  }, [fetchConfig, fetchMesas]);

  useEffect(() => {
    if (!socket) return;

    socket.on('mesa_actualizada', ({ id, estado, numero_mesa }) => {
      setMesas(prev => prev.map(mesa => 
        mesa.id === id ? { ...mesa, estado } : mesa
      ));
    });

    socket.on('nuevo_pedido', ({ id_pedido, id_mesa }) => {
      setMesas(prev => prev.map(mesa => 
        mesa.id === id_mesa ? { ...mesa, estado: 'ocupada', pedido_id: id_pedido } : mesa
      ));
    });

    socket.on('mesa_cerrada', (data) => {
      setMesas(prev => prev.map(mesa => 
        mesa.id === data.id ? { ...mesa, estado: 'cuenta' } : mesa
      ));
      
      const alerta = {
        id: Date.now(),
        tipo: 'cobrar',
        mesa: data.numero_mesa,
        mensaje: `Cobrar Mesa ${data.numero_mesa}`,
        total: data.total_con_propina,
        porcentaje: data.porcentaje_propina,
        tiempo: new Date()
      };
      setAlertas(prev => [alerta, ...prev]);
    });

    socket.on('mesa_cobrada', (data) => {
      setMesas(prev => prev.map(mesa => 
        mesa.id === data.id ? { ...mesa, estado: 'limpiando' } : mesa
      ));
    });

    socket.on('pedido_actualizado', () => {
      fetchMesas();
    });

    return () => {
      socket.off('mesa_actualizada');
      socket.off('nuevo_pedido');
      socket.off('mesa_cerrada');
      socket.off('mesa_cobrada');
      socket.off('pedido_actualizado');
    };
  }, [socket, fetchMesas]);

  const updateEstadoMesa = async (id, estado) => {
    try {
      await api.updateEstadoMesa(id, estado);
      setMesas(prev => prev.map(mesa => 
        mesa.id === id ? { ...mesa, estado } : mesa
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const crearPedido = async (id_mesa, id_mesonero, items) => {
    try {
      const response = await api.crearPedido(id_mesa, id_mesonero, items);
      if (response.success) {
        setPedidoActual(null);
        await fetchMesas();
      }
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const agregarItemsAPedido = async (id_pedido, items) => {
    try {
      await api.agregarItemsPedido(id_pedido, items);
      setPedidoActual(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const cerrarMesa = async (id, porcentaje_propina) => {
    try {
      const response = await api.cerrarMesa(id, porcentaje_propina);
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getPedidoMesa = async (id_mesa) => {
    try {
      const items = await api.getPedidoMesa(id_mesa);
      return items;
    } catch (error) {
      return [];
    }
  };

  const agregarItemAlPedido = (producto, notas = '') => {
    const item = {
      id: Date.now(),
      nombre: producto.nombre,
      precio: producto.precio_usd || producto.precio,
      notas
    };
    setPedidoActual(prev => prev ? [...prev, item] : [item]);
  };

  const removerItemDelPedido = (id) => {
    setPedidoActual(prev => prev ? prev.filter(item => item.id !== id) : []);
  };

  const limpiarPedido = () => {
    setPedidoActual(null);
  };

  const marcarAlertaLeida = (id) => {
    setAlertas(prev => prev.filter(a => a.id !== id));
  };

  const updateConfig = async (clave, valor) => {
    try {
      await api.updateConfig(clave, valor);
      setConfig(prev => ({ ...prev, [clave]: valor }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const actualizarTasaBCV = async () => {
    try {
      const result = await api.actualizarTasaBCV();
      if (result.success) {
        setTasaBCV(result.tasa);
        setConfig(prev => ({ ...prev, tasa_bcv: result.tasa }));
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const formatearPrecio = (usd) => {
    if (!tasaBCV || tasaBCV === 0) {
      return config.mostrar_precios_usd
        ? { usd: `$${usd.toFixed(2)}`, bs: null }
        : { usd: null, bs: null };
    }

    const bs = usd * tasaBCV;
    const bsFormateado = bs.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    if (config.mostrar_precios_usd && config.mostrar_precios_bs) {
      return { usd: `$${usd.toFixed(2)}`, bs: `Bs. ${bsFormateado}` };
    } else if (config.mostrar_precios_usd) {
      return { usd: `$${usd.toFixed(2)}`, bs: null };
    } else if (config.mostrar_precios_bs) {
      return { usd: null, bs: `Bs. ${bsFormateado}` };
    }
    return { usd: null, bs: null };
  };

  return (
    <RestaurantContext.Provider value={{
      mesas,
      loading,
      pedidoActual,
      alertas,
      config,
      tasaBCV,
      fetchMesas,
      fetchConfig,
      updateEstadoMesa,
      crearPedido,
      agregarItemsAPedido,
      cerrarMesa,
      getPedidoMesa,
      agregarItemAlPedido,
      removerItemDelPedido,
      limpiarPedido,
      setPedidoActual,
      marcarAlertaLeida,
      updateConfig,
      actualizarTasaBCV,
      formatearPrecio
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
