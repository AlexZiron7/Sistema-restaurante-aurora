import { useState, useEffect, useCallback } from 'react';
import { Receipt, DollarSign, RefreshCw, Bell, Printer, Smartphone, CreditCard, Banknote, Globe, CheckCircle2, X, ArrowLeft, LayoutGrid } from 'lucide-react';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../hooks/useSocket';
import TicketPrinter from '../components/TicketPrinter';
import { api } from '../services/api';

const BANCOS = [
  { codigo: '0001', nombre: 'Banco Central de Venezuela' },
  { codigo: '0102', nombre: 'Banco de Venezuela' },
  { codigo: '0104', nombre: 'Banco Venezolano de Crédito (BVC)' },
  { codigo: '0105', nombre: 'Banco Mercantil' },
  { codigo: '0108', nombre: 'Banco Provincial (BBVA)' },
  { codigo: '0114', nombre: 'Bancaribe' },
  { codigo: '0115', nombre: 'Banco Exterior' },
  { codigo: '0128', nombre: 'Banco Caroní' },
  { codigo: '0134', nombre: 'Banesco Banco Universal' },
  { codigo: '0137', nombre: 'Banco Sofitasa' },
  { codigo: '0138', nombre: 'Banco Plaza' },
  { codigo: '0146', nombre: 'Bangente' },
  { codigo: '0151', nombre: 'Banco Fondo Común (BFC)' },
  { codigo: '0156', nombre: '100% Banco' },
  { codigo: '0157', nombre: 'Del Sur Banco Universal' },
  { codigo: '0163', nombre: 'Banco del Tesoro' },
  { codigo: '0166', nombre: 'Banco Agrícola de Venezuela' },
  { codigo: '0168', nombre: 'Bancrecer' },
  { codigo: '0169', nombre: 'Mi Banco' },
  { codigo: '0171', nombre: 'Banco Activo' },
  { codigo: '0172', nombre: 'Bancamiga' },
  { codigo: '0174', nombre: 'Banplus' },
  { codigo: '0175', nombre: 'Banco Bicentenario' },
  { codigo: '0177', nombre: 'BANFANB' },
  { codigo: '0191', nombre: 'Banco Nacional de Crédito (BNC)' }
];

const getFechaActual = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const METODOS_PAGO = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote, color: 'bg-emerald-50 border-emerald-300 text-emerald-700', activeColor: 'bg-emerald-500 border-emerald-600 text-white' },
  { id: 'pago_movil', label: 'Pago Móvil', icon: Smartphone, color: 'bg-sky-50 border-sky-300 text-sky-700', activeColor: 'bg-sky-500 border-sky-600 text-white' },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'bg-violet-50 border-violet-300 text-violet-700', activeColor: 'bg-violet-500 border-violet-600 text-white' },
  { id: 'zelle', label: 'Zelle', icon: Globe, color: 'bg-purple-50 border-purple-300 text-purple-700', activeColor: 'bg-purple-500 border-purple-600 text-white' },
  { id: 'zinli', label: 'Zinli', icon: DollarSign, color: 'bg-orange-50 border-orange-300 text-orange-700', activeColor: 'bg-orange-500 border-orange-600 text-white' },
];

const estadoColors = {
  libre: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  ocupada: 'bg-rose-50 text-rose-600 border-rose-200',
  atendida: 'bg-sky-50 text-sky-600 border-sky-200',
  cuenta: 'bg-violet-100 text-violet-700 border-violet-300 ring-2 ring-violet-300',
  limpiando: 'bg-amber-50 text-amber-600 border-amber-200',
};

const estadoLabels = {
  libre: 'Libre', ocupada: 'Ocupada', atendida: 'Atendida', cuenta: 'Por Cobrar', limpiando: 'Limpiando'
};

// ─── Componentes Auxiliares (Definidos fuera para evitar pérdida de focus) ─────

const PanelMesas = ({ mesas, mesasPorCobrar, selectedMesa, seleccionarMesa, estadoColors, estadoLabels }) => (
  <div className="flex-1 p-4 overflow-y-auto">
    {/* Cuentas Pendientes */}
    {mesasPorCobrar.length > 0 && (
      <div className="mb-5">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          Cuentas Pendientes
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {mesasPorCobrar.map(mesa => (
            <button
              key={mesa.id}
              onClick={() => seleccionarMesa(mesa)}
              className={`relative p-3 sm:p-4 rounded-2xl border-2 text-left transition-all shadow-sm hover:shadow-md active:scale-95 ${
                selectedMesa?.id === mesa.id
                  ? 'border-violet-500 bg-violet-100 ring-2 ring-violet-200'
                  : 'border-violet-300 bg-white hover:border-violet-400'
              }`}
            >
              <div className="text-xl sm:text-2xl font-black text-violet-800 mb-0.5">{mesa.numero_mesa}</div>
              <div className="text-[10px] font-semibold text-violet-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Por Cobrar
              </div>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Todas las mesas */}
    <div>
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Todas las Mesas
      </h2>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
        {mesas.map(mesa => (
          <button
            key={mesa.id}
            onClick={() => seleccionarMesa(mesa)}
            disabled={mesa.estado === 'libre'}
            className={`relative p-2.5 sm:p-3 rounded-xl border-2 transition-all text-center ${
              selectedMesa?.id === mesa.id
                ? 'ring-2 ring-primary-400 scale-105'
                : mesa.estado !== 'libre'
                  ? 'hover:scale-105 hover:shadow-md cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
            } ${estadoColors[mesa.estado] || 'bg-gray-50 border-gray-200'}`}
          >
            <div className="text-lg sm:text-xl font-black">{mesa.numero_mesa}</div>
            <div className="text-[9px] font-semibold uppercase tracking-wide opacity-80 mt-0.5">
              {estadoLabels[mesa.estado]}
            </div>
            {mesa.estado === 'cuenta' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const PanelDetalle = ({ 
  isMobile = false, 
  selectedMesa, 
  handleCerrarDetalle, 
  estadoColors, 
  estadoLabels, 
  pedidoId, 
  loading, 
  items, 
  total, 
  metodoPago, 
  setMetodoPago, 
  resetDatosPago, 
  datosPago, 
  handleMonedaChange, 
  handleCambioChange, 
  handleReferenciaChange, 
  handleBancoChange, 
  handleFechaHoraChange, 
  handleNombreTitularChange, 
  handleCorreoChange, 
  handleCobrar, 
  cobrando,
  formatearPrecio
}) => (
  <div className={`bg-white flex flex-col ${isMobile ? 'flex-1 min-h-0' : 'w-80 xl:w-96 border-l shadow-xl'}`}>
    {/* Header — sticky */}
    <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-3 sticky top-0 z-10 flex-shrink-0">
      {isMobile && (
        <button
          onClick={handleCerrarDetalle}
          className="p-2 -ml-1 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-800 text-base">Mesa {selectedMesa.numero_mesa}</h2>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${estadoColors[selectedMesa.estado]}`}>
            {estadoLabels[selectedMesa.estado]}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {pedidoId && (
          <TicketPrinter pedidoId={pedidoId} mesaNumero={selectedMesa.numero_mesa} />
        )}
        {!isMobile && (
          <button
            onClick={handleCerrarDetalle}
            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>

    {/* Scrollable body: items + payment */}
    <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20' : ''}`}>
      {/* Items del pedido */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="animate-spin text-primary-400" size={28} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No hay items en esta mesa</div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700 font-medium flex-1">{item.nombre_producto}</span>
                <span className="text-sm font-bold text-gray-800 ml-3">${Number(item.precio).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Total + Pago + Cobrar */}
      <div className="border-t p-4 space-y-4 bg-white">
      {/* Total */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">Total a cobrar</span>
        <span className="text-2xl font-black text-emerald-700">${total.toFixed(2)}</span>
      </div>

      {/* Método de pago */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Método de Pago</p>
        <div className="grid grid-cols-3 gap-1.5">
          {METODOS_PAGO.map(({ id, label, icon: Icon, color, activeColor }) => (
            <button
              key={id}
              onClick={() => { setMetodoPago(id); resetDatosPago(); }}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all text-xs font-semibold active:scale-95 ${
                metodoPago === id ? activeColor : color
              }`}
            >
              <Icon size={16} />
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Datos de pago */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Datos del pago <span className="font-normal normal-case">(opcional)</span>
        </p>

        {metodoPago === 'efectivo' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Moneda</label>
              <select value={datosPago.moneda} onChange={handleMonedaChange} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="USD">USD</option>
                <option value="VES">VES</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Cambio (VES)</label>
              <input type="number" value={datosPago.cambio_devuelto} onChange={handleCambioChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="0" />
            </div>
          </div>
        )}
        {metodoPago === 'pago_movil' && (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Referencia (4-6 dígitos)</label>
              <input type="text" value={datosPago.referencia} onChange={handleReferenciaChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="1234" maxLength={6} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Banco</label>
              <select value={datosPago.banco} onChange={handleBancoChange} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Seleccionar banco...</option>
                {BANCOS.map(banco => (
                  <option key={banco.codigo} value={`${banco.codigo} - ${banco.nombre}`}>{banco.codigo} - {banco.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Fecha y Hora</label>
              <input type="datetime-local" value={datosPago.fecha_hora} onChange={handleFechaHoraChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        )}
        {metodoPago === 'zelle' && (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nombre del titular</label>
              <input type="text" value={datosPago.nombre_titular} onChange={handleNombreTitularChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Juan Perez" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Correo</label>
              <input type="email" value={datosPago.correo} onChange={handleCorreoChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="correo@ejemplo.com" />
            </div>
          </div>
        )}
        {metodoPago === 'zinli' && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Correo del pagador</label>
            <input type="email" value={datosPago.correo} onChange={handleCorreoChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="correo@ejemplo.com" />
          </div>
        )}
        {metodoPago === 'tarjeta' && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Referencia</label>
            <input type="text" value={datosPago.referencia} onChange={handleReferenciaChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Número de referencia" />
          </div>
        )}
      </div>

      {/* Botón Cobrar */}
      <button
        onClick={handleCobrar}
        disabled={cobrando || loading || items.length === 0}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 text-base"
      >
        {cobrando ? <RefreshCw size={18} className="animate-spin" /> : (
          <><CheckCircle2 size={18} />Cobrar ${total.toFixed(2)}</>
        )}
      </button>
      </div>{/* end footer div */}
    </div>{/* end scrollable body */}
  </div>
);

export default function CajaPage() {
  const { mesas, fetchMesas, updateEstadoMesa, formatearPrecio } = useRestaurant();
  const { success, error } = useToast();
  const { socket } = useSocket();

  const [selectedMesa, setSelectedMesa] = useState(null);
  const [items, setItems] = useState([]);
  const [pedidoId, setPedidoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [cobrando, setCobrando] = useState(false);
  // Mobile: 'mesas' | 'detalle'
  const [mobileView, setMobileView] = useState('mesas');

  useEffect(() => {
    if (!socket) return;
    socket.on('pedido_listo', (data) => {
      success(`🍽️ ${data.mensaje}`);
      fetchMesas();
    });
    return () => { socket.off('pedido_listo'); };
  }, [socket, fetchMesas, success]);

  const [datosPago, setDatosPago] = useState({
    moneda: 'USD',
    cambio_devuelto: 0,
    referencia: '',
    banco: '',
    fecha_hora: getFechaActual(),
    nombre_titular: '',
    correo: ''
  });

  const handleMonedaChange = useCallback((e) => {
    setDatosPago(prev => ({ ...prev, moneda: e.target.value }));
  }, []);

  const handleCambioChange = useCallback((e) => {
    setDatosPago(prev => ({ ...prev, cambio_devuelto: e.target.value }));
  }, []);

  const handleReferenciaChange = useCallback((e) => {
    setDatosPago(prev => ({ ...prev, referencia: e.target.value.replace(/\D/g, '').slice(0, 6) }));
  }, []);

  const handleBancoChange = useCallback((e) => {
    setDatosPago(prev => ({ ...prev, banco: e.target.value }));
  }, []);

  const handleFechaHoraChange = useCallback((e) => {
    setDatosPago(prev => ({ ...prev, fecha_hora: e.target.value }));
  }, []);

  const handleNombreTitularChange = useCallback((e) => {
    setDatosPago(prev => ({ ...prev, nombre_titular: e.target.value }));
  }, []);

  const handleCorreoChange = useCallback((e) => {
    setDatosPago(prev => ({ ...prev, correo: e.target.value }));
  }, []);

  const resetDatosPago = () => setDatosPago({
    moneda: 'USD',
    cambio_devuelto: 0,
    referencia: '',
    banco: '',
    fecha_hora: getFechaActual(),
    nombre_titular: '',
    correo: ''
  });

  const seleccionarMesa = async (mesa) => {
    if (mesa.estado === 'limpiando') {
      await updateEstadoMesa(mesa.id, 'libre');
      success(`✅ Mesa ${mesa.numero_mesa} marcada como libre`);
      return;
    }
    if (mesa.estado === 'libre') return;

    setSelectedMesa(mesa);
    setLoading(true);
    setMetodoPago('efectivo');
    resetDatosPago();

    // On mobile: switch to detalle view automatically
    setMobileView('detalle');

    try {
      const data = await api.getPedidoMesa(mesa.id);
      setItems(data);
      if (data.length > 0) setPedidoId(data[0].pedido_id);
    } catch (err) {
      error('Error al cargar el pedido');
    }
    setLoading(false);
  };

  const handleCerrarDetalle = () => {
    setSelectedMesa(null);
    setItems([]);
    setPedidoId(null);
    setMobileView('mesas');
  };

  const handleCobrar = async () => {
    if (!selectedMesa) return;
    setCobrando(true);

    const datosPagoFinal = {
      efectivo: { moneda: datosPago.moneda, cambio_devuelto: Number(datosPago.cambio_devuelto) || 0 },
      pago_movil: { referencia: datosPago.referencia, banco: datosPago.banco, fecha_hora: datosPago.fecha_hora },
      zelle: { nombre_titular: datosPago.nombre_titular, correo: datosPago.correo },
      zinli: { correo_pagador: datosPago.correo },
      tarjeta: { referencia: datosPago.referencia }
    };

    const res = await fetch(`/api/mesas/${selectedMesa.id}/cobrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metodo_pago: metodoPago, datos_pago: datosPagoFinal[metodoPago] })
    });

    if (res.ok) {
      const metodoLabel = METODOS_PAGO.find(m => m.id === metodoPago)?.label || metodoPago;
      success(`💰 Mesa ${selectedMesa.numero_mesa} cobrada por ${metodoLabel}`);
      handleCerrarDetalle();
      fetchMesas();
    } else {
      error('Error al procesar el cobro');
    }
    setCobrando(false);
  };

  // ─── DESKTOP (lg+): layout 2 columnas ───────────────────────────
  const total = items.reduce((acc, item) => acc + Number(item.precio), 0);
  const mesasConActividad = mesas.filter(m => m.estado !== 'libre');
  const mesasPorCobrar = mesas.filter(m => m.estado === 'cuenta');

  const commonProps = {
    selectedMesa,
    estadoColors,
    estadoLabels,
    loading,
    items,
    total,
    metodoPago,
    setMetodoPago,
    resetDatosPago,
    datosPago,
    handleMonedaChange,
    handleCambioChange,
    handleReferenciaChange,
    handleBancoChange,
    handleFechaHoraChange,
    handleNombreTitularChange,
    handleCorreoChange,
    handleCobrar,
    cobrando,
    formatearPrecio
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b px-4 py-3 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Receipt size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800 leading-tight">Caja</h1>
              <p className="text-xs text-gray-400">
                {mesasConActividad.length} activas · {mesasPorCobrar.length} por cobrar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mesasPorCobrar.length > 0 && (
              <div className="flex items-center gap-1.5 bg-violet-100 text-violet-700 px-2.5 py-1.5 rounded-full text-xs font-semibold">
                <Bell size={12} className="animate-pulse" />
                <span className="hidden xs:inline">{mesasPorCobrar.length} pendientes</span>
                <span className="xs:hidden">{mesasPorCobrar.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE: flujo de 2 vistas ─────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto lg:hidden">
        {mobileView === 'mesas' || !selectedMesa ? (
          // Vista mesas — pantalla completa
          <PanelMesas 
            mesas={mesas} 
            mesasPorCobrar={mesasPorCobrar} 
            selectedMesa={selectedMesa} 
            seleccionarMesa={seleccionarMesa}
            estadoColors={estadoColors}
            estadoLabels={estadoLabels}
          />
        ) : (
          // Vista detalle — pantalla completa con "volver" en header
          <PanelDetalle 
            {...commonProps} 
            isMobile={true} 
            handleCerrarDetalle={handleCerrarDetalle}
            pedidoId={pedidoId}
          />
        )}
      </div>

      {/* ── DESKTOP (lg+): layout 2 columnas ─────────────────────────── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <PanelMesas 
          mesas={mesas} 
          mesasPorCobrar={mesasPorCobrar} 
          selectedMesa={selectedMesa} 
          seleccionarMesa={seleccionarMesa}
          estadoColors={estadoColors}
          estadoLabels={estadoLabels}
        />
        {selectedMesa && selectedMesa.estado !== 'limpiando' ? (
          <PanelDetalle 
            {...commonProps} 
            isMobile={false} 
            handleCerrarDetalle={handleCerrarDetalle}
            pedidoId={pedidoId}
          />
        ) : (
          <div className="w-80 xl:w-96 bg-white border-l flex items-center justify-center text-gray-300">
            <div className="text-center p-6">
              <Receipt size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Selecciona una mesa<br />para ver el pedido</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
