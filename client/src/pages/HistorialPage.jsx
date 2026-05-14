import { useState, useEffect } from 'react';
import { History, Search, Calendar, Filter, ChevronDown, ChevronUp, Smartphone, CreditCard, Banknote, Globe, DollarSign, Download, RefreshCw, FileText, FileSpreadsheet, File } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';
import { api } from '../services/api';

const METODOS = [
  { id: 'todos', label: 'Todos' },
  { id: 'efectivo', label: 'Efectivo', icon: Banknote, color: 'text-emerald-600' },
  { id: 'pago_movil', label: 'Pago Móvil', icon: Smartphone, color: 'text-sky-600' },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'text-violet-600' },
  { id: 'zelle', label: 'Zelle', icon: Globe, color: 'text-purple-600' },
  { id: 'zinli', label: 'Zinli', icon: DollarSign, color: 'text-orange-600' },
];

const METODO_ICONS = {
  efectivo: { icon: Banknote, color: 'bg-emerald-100 text-emerald-700', label: 'Efectivo' },
  pago_movil: { icon: Smartphone, color: 'bg-sky-100 text-sky-700', label: 'Pago Móvil' },
  tarjeta: { icon: CreditCard, color: 'bg-violet-100 text-violet-700', label: 'Tarjeta' },
  zelle: { icon: Globe, color: 'bg-purple-100 text-purple-700', label: 'Zelle' },
  zinli: { icon: DollarSign, color: 'bg-orange-100 text-orange-700', label: 'Zinli' },
};

function MetodoBadge({ metodo }) {
  const config = METODO_ICONS[metodo] || { icon: DollarSign, color: 'bg-gray-100 text-gray-600', label: metodo };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

function DatosPago({ datosPago, metodo }) {
  if (!datosPago) return null;
  
  let contenido = null;
  
  try {
    const datos = typeof datosPago === 'string' ? JSON.parse(datosPago) : datosPago;
    
    if (metodo === 'efectivo') {
      contenido = (
        <div className="text-xs text-gray-500">
          Moneda: {datos.moneda} | Cambio: Bs. {Number(datos.cambio_devuelto || 0).toLocaleString('es-VE')}
        </div>
      );
    } else if (metodo === 'pago_movil') {
      contenido = (
        <div className="text-xs text-gray-500">
          Ref: {datos.referencia} | {datos.banco} | {datos.fecha_hora}
        </div>
      );
    } else if (metodo === 'zelle') {
      contenido = (
        <div className="text-xs text-gray-500">
          Titular: {datos.nombre_titular} | {datos.correo}
        </div>
      );
    } else if (metodo === 'zinli') {
      contenido = (
        <div className="text-xs text-gray-500">
          Correo: {datos.correo_pagador || datos.correo}
        </div>
      );
    } else if (metodo === 'tarjeta') {
      contenido = (
        <div className="text-xs text-gray-500">
          Ref: {datos.referencia}
        </div>
      );
    }
  } catch (e) {
    return null;
  }
  
  if (!contenido) return null;
  
  return (
    <div className="mt-2 pt-2 border-t bg-blue-50 px-3 py-2 rounded">
      <span className="text-xs font-semibold text-blue-600">Datos del pago:</span>
      {contenido}
    </div>
  );
}

export default function HistorialPage() {
  const hoy = new Date().toISOString().split('T')[0];
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [metodo, setMetodo] = useState('todos');
  const [pedidos, setPedidos] = useState([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [detalle, setDetalle] = useState({});
  const [page, setPage] = useState(0);
  const [reporteData, setReporteData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const POR_PAGINA = 20;

  const columnasVentas = {
    headers: [
      { key: 'id', label: 'ID' },
      { key: 'numero_mesa', label: 'Mesa' },
      { key: 'nombre_mesonero', label: 'Mesonero' },
      { key: 'total', label: 'Total' },
      { key: 'propina', label: 'Propina' },
      { key: 'metodo_pago', label: 'Método' },
      { key: 'fecha_cierre', label: 'Fecha' }
    ],
    dataKey: 'pedidos'
  };

  const cargarReporteVentas = async (formato) => {
    setExportLoading(true);
    try {
      const data = await api.getReporteVentas(desde, hasta);
      setReporteData(data);
      
      if (formato === 'pdf') {
        exportToPDF(data, 'Reporte de Ventas', columnasVentas);
      } else if (formato === 'excel') {
        exportToExcel(data, 'Reporte de Ventas', columnasVentas);
      } else if (formato === 'csv') {
        exportToCSV(data, 'Reporte de Ventas', columnasVentas);
      }
    } catch (err) {
      console.error('Error exportando:', err);
    }
    setExportLoading(false);
  };

  const cargarReporteProductos = async (formato) => {
    setExportLoading(true);
    try {
      const data = await api.getReporteProductos(desde, hasta);
      
      const columnas = {
        headers: [
          { key: 'nombre_producto', label: 'Producto' },
          { key: 'categoria', label: 'Categoría' },
          { key: 'cantidad', label: 'Cantidad' },
          { key: 'total', label: 'Total' }
        ],
        dataKey: 'productos'
      };
      
      if (formato === 'pdf') {
        exportToPDF(data, 'Reporte de Productos', columnas);
      } else if (formato === 'excel') {
        exportToExcel(data, 'Reporte de Productos', columnas);
      } else if (formato === 'csv') {
        exportToCSV(data, 'Reporte de Productos', columnas);
      }
    } catch (err) {
      console.error('Error exportando:', err);
    }
    setExportLoading(false);
  };

  const cargarReporteMesoneros = async (formato) => {
    setExportLoading(true);
    try {
      const data = await api.getReporteMesoneros(desde, hasta);
      
      const columnas = {
        headers: [
          { key: 'nombre_mesonero', label: 'Mesonero' },
          { key: 'pedidos', label: 'Pedidos' },
          { key: 'ventas', label: 'Ventas' },
          { key: 'propinas', label: 'Propinas' },
          { key: 'mesas_atendidas', label: 'Mesas' }
        ],
        dataKey: 'mesoneros'
      };
      
      if (formato === 'pdf') {
        exportToPDF(data, 'Reporte de Mesoneros', columnas);
      } else if (formato === 'excel') {
        exportToExcel(data, 'Reporte de Mesoneros', columnas);
      } else if (formato === 'csv') {
        exportToCSV(data, 'Reporte de Mesoneros', columnas);
      }
    } catch (err) {
      console.error('Error exportando:', err);
    }
    setExportLoading(false);
  };

  const cargarHistorial = async (resetPage = false) => {
    setLoading(true);
    const currentPage = resetPage ? 0 : page;
    if (resetPage) setPage(0);

    try {
      const params = new URLSearchParams({
        desde, hasta,
        metodo,
        limit: POR_PAGINA,
        offset: currentPage * POR_PAGINA
      });
      const res = await fetch(`/api/pedidos/historial?${params}`);
      const data = await res.json();
      setPedidos(data.pedidos || []);
      setTotalRegistros(data.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { cargarHistorial(true); }, [desde, hasta, metodo]);
  useEffect(() => { cargarHistorial(); }, [page]);

  const cargarDetalle = async (id) => {
    if (detalle[id]) {
      setExpandido(expandido === id ? null : id);
      return;
    }
    try {
      const res = await fetch(`/api/pedidos/${id}/detalle`);
      const data = await res.json();
      setDetalle(prev => ({ ...prev, [id]: data }));
      setExpandido(id);
    } catch (e) {}
  };

  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA);
  const totalMostrado = pedidos.reduce((acc, p) => acc + (p.total || 0) + (p.propina || 0), 0);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <History size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">Historial de Pedidos</h1>
            <p className="text-xs text-gray-400">{totalRegistros} registros encontrados</p>
          </div>
          <div className="flex gap-1">
            <div className="relative group">
              <button className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors" title="Exportar Ventas">
                <FileText size={18} />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                <button onClick={() => cargarReporteVentas('pdf')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm w-full">
                  <FileText size={14} /> PDF Ventas
                </button>
                <button onClick={() => cargarReporteVentas('excel')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm w-full">
                  <FileSpreadsheet size={14} /> Excel Ventas
                </button>
                <button onClick={() => cargarReporteVentas('csv')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm w-full">
                  <File size={14} /> CSV Ventas
                </button>
                <div className="border-t my-1" />
                <button onClick={() => cargarReporteProductos('pdf')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm w-full">
                  <FileText size={14} /> PDF Productos
                </button>
                <button onClick={() => cargarReporteProductos('excel')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm w-full">
                  <FileSpreadsheet size={14} /> Excel Productos
                </button>
                <button onClick={() => cargarReporteProductos('csv')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm w-full">
                  <File size={14} /> CSV Productos
                </button>
                <div className="border-t my-1" />
                <button onClick={() => cargarReporteMesoneros('pdf')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm w-full">
                  <FileText size={14} /> PDF Mesoneros
                </button>
                <button onClick={() => cargarReporteMesoneros('excel')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm w-full">
                  <FileSpreadsheet size={14} /> Excel Mesoneros
                </button>
                <button onClick={() => cargarReporteMesoneros('csv')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm w-full">
                  <File size={14} /> CSV Mesoneros
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Desde:</span>
            <input
              type="date"
              value={desde}
              max={hasta}
              onChange={e => setDesde(e.target.value)}
              className="text-sm font-semibold text-gray-800 bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Hasta:</span>
            <input
              type="date"
              value={hasta}
              min={desde}
              onChange={e => setHasta(e.target.value)}
              className="text-sm font-semibold text-gray-800 bg-transparent outline-none"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {METODOS.map(m => (
              <button
                key={m.id}
                onClick={() => setMetodo(m.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  metodo === m.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => cargarHistorial(true)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors ml-auto"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Resumen del rango */}
      {pedidos.length > 0 && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-sm flex items-center justify-between">
          <span className="font-medium">
            {pedidos.length} pedidos mostrados de {totalRegistros}
          </span>
          <span className="font-bold text-indigo-200">
            Total pág: <span className="text-white">${totalMostrado.toFixed(2)}</span>
          </span>
        </div>
      )}

      {/* Tabla */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="animate-spin text-indigo-400" size={36} />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <History size={48} className="mb-3 opacity-30" />
            <p className="font-medium">Sin registros en este período</p>
            <p className="text-sm mt-1">Prueba cambiando el rango de fechas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pedidos.map(pedido => (
              <div
                key={pedido.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => cargarDetalle(pedido.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* Número de mesa */}
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-700 font-black">{pedido.numero_mesa || '?'}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-gray-800 text-sm">Mesa {pedido.numero_mesa}</span>
                      <MetodoBadge metodo={pedido.metodo_pago} />
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {pedido.nombre_mesonero && <span className="mr-2">👤 {pedido.nombre_mesonero}</span>}
                      {pedido.total_items} items
                      {pedido.propina > 0 && <span className="ml-2 text-emerald-500">+propina</span>}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-black text-gray-800">
                      ${((pedido.total || 0) + (pedido.propina || 0)).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {pedido.fecha_cierre
                        ? new Date(pedido.fecha_cierre).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </div>
                  </div>

                  <div className="text-gray-300">
                    {expandido === pedido.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Detalle expandible */}
                {expandido === pedido.id && detalle[pedido.id] && (
                  <div className="border-t bg-gray-50 px-4 py-3">
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {detalle[pedido.id].items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                          <span className="text-gray-600">{item.nombre_producto}</span>
                          <span className="font-semibold text-gray-800">${Number(item.precio).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <DatosPago datosPago={pedido.datos_pago} metodo={pedido.metodo_pago} />
                    <div className="mt-2 pt-2 border-t flex justify-between">
                      <span className="text-xs text-gray-400">
                        {pedido.fecha_cierre
                          ? new Date(pedido.fecha_cierre).toLocaleString('es-VE')
                          : '—'}
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        Total: ${((pedido.total || 0) + (pedido.propina || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl border font-semibold text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-500">
              Página {page + 1} de {totalPaginas}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPaginas - 1, p + 1))}
              disabled={page >= totalPaginas - 1}
              className="px-4 py-2 rounded-xl border font-semibold text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
