import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, LayoutGrid, ShoppingBag, RefreshCw, Smartphone, CreditCard, Banknote, Globe, Award, ArrowUpRight, FileDown } from 'lucide-react';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useAuth } from '../contexts/AuthContext';


const METODO_COLORS = {
  efectivo: 'bg-emerald-500',
  pago_movil: 'bg-sky-500',
  tarjeta: 'bg-violet-500',
  zelle: 'bg-purple-500',
  zinli: 'bg-orange-500',
};

const METODO_LABELS = {
  efectivo: 'Efectivo',
  pago_movil: 'Pago Móvil',
  tarjeta: 'Tarjeta',
  zelle: 'Zelle',
  zinli: 'Zinli',
};

function StatCard({ icon: Icon, title, value, sub, color, gradient }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
      <div className={`h-1 ${gradient || 'bg-gradient-to-r from-gray-400 to-gray-500'}`} />
      <div className="p-4">
        <div className={`w-10 h-10 ${color || 'bg-gray-100'} rounded-xl flex items-center justify-center mb-3`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="text-2xl font-black text-gray-800 mb-0.5">{value}</div>
        <div className="text-sm text-gray-500 font-medium">{title}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function MiniBarChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="flex items-end justify-center h-24 text-gray-300 text-sm">Sin datos esta semana</div>
  );
  const max = Math.max(...data.map(d => d.ingresos), 1);
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return (
    <div className="flex items-end gap-1.5 h-24 pt-2">
      {data.map((d, i) => {
        const h = Math.max(4, (d.ingresos / max) * 80);
        const fecha = new Date(d.fecha + 'T12:00:00');
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative">
              <div
                className="w-full bg-indigo-500 rounded-t-sm transition-all group-hover:bg-indigo-400"
                style={{ height: `${h}px`, minWidth: '20px' }}
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                ${d.ingresos.toFixed(0)}
              </div>
            </div>
            <span className="text-[9px] text-gray-400 font-medium">{dias[fecha.getDay()]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { mesas, loading: mesasLoading, fetchMesas } = useRestaurant();
  const { user } = useAuth();
  const [statsHoy, setStatsHoy] = useState(null);
  const [statsSemana, setStatsSemana] = useState([]);
  const [statsMetodos, setStatsMetodos] = useState([]);
  const [mesoneros, setMesoneros] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const esAdmin = ['dueno', 'admin', 'gerente'].includes(user?.rol);

  const handleExportPDF = async () => {
    if (!statsHoy) return;
    const { jsPDF } = await import('jspdf');
    const hoy = new Date().toISOString().split('T')[0];
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte del Día', 14, 22);
    doc.setFontSize(10);
    doc.text(`Fecha: ${hoy}`, 14, 30);
    doc.setFontSize(12);
    let y = 40;
    doc.text(`Ingresos Totales: $${(statsHoy.ingresos_totales || 0).toFixed(2)}`, 14, y); y += 8;
    doc.text(`Propinas: $${(statsHoy.total_propinas || 0).toFixed(2)}`, 14, y); y += 8;
    doc.text(`Pedidos: ${statsHoy.total_pedidos || 0}`, 14, y); y += 8;
    doc.text(`Mesas Atendidas: ${statsHoy.mesas_atendidas || 0}`, 14, y); y += 8;
    if (statsHoy.metodos_pago?.length > 0) {
      y += 4;
      doc.setFontSize(14);
      doc.text('Métodos de Pago', 14, y); y += 8;
      doc.setFontSize(10);
      statsHoy.metodos_pago.forEach(m => {
        doc.text(`${m.metodo_pago}: $${m.monto.toFixed(2)} (${m.cantidad} op.)`, 14, y);
        y += 7;
      });
    }
    doc.save(`Reporte_Diario_${hoy}.pdf`);
  };

  const handleExportCSV = () => {
    if (!statsHoy) return;
    const hoy = new Date().toISOString().split('T')[0];
    let csv = `Reporte del Día,${hoy}\n\n`;
    csv += `Ingresos Totales,$${statsHoy.ingresos_totales.toFixed(2)}\n`;
    csv += `Propinas,$${statsHoy.total_propinas.toFixed(2)}\n`;
    csv += `Pedidos,${statsHoy.total_pedidos}\n`;
    csv += `Mesas Atendidas,${statsHoy.mesas_atendidas}\n\n`;
    if (statsHoy.metodos_pago?.length > 0) {
      csv += 'Método,Cantidad,Monto\n';
      statsHoy.metodos_pago.forEach(m => {
        csv += `${m.metodo_pago},${m.cantidad},${m.monto.toFixed(2)}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Diario_${hoy}.csv`;
    link.click();
  };

  const handleExportCompleto = async () => {
    const hoy = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(`/api/reportes/completo?desde=${hoy}&hasta=${hoy}`);
      const data = await res.json();
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let y = 22;
      const nl = (h = 7) => { y += h; if (y > 275) { doc.addPage(); y = 22; } };

      doc.setFontSize(18);
      doc.text('Reporte Completo del Día', 14, y); nl(10);
      doc.setFontSize(10);
      doc.text(`Fecha: ${hoy}`, 14, y); nl(10);

      doc.setFontSize(14);
      doc.text('Ventas', 14, y); nl(10);
      doc.setFontSize(10);
      doc.text(`Total Ventas: $${data.ventas.total_ventas.toFixed(2)}`, 14, y); nl();
      doc.text(`Propinas: $${data.ventas.total_propinas.toFixed(2)}`, 14, y); nl();
      doc.text(`Total General: $${data.ventas.total_general.toFixed(2)}`, 14, y); nl();
      doc.text(`Pedidos: ${data.ventas.cantidad}`, 14, y); nl(10);

      if (Object.keys(data.ventas.por_metodo).length > 0) {
        doc.setFontSize(12);
        doc.text('Métodos de Pago:', 14, y); nl(8);
        doc.setFontSize(10);
        Object.entries(data.ventas.por_metodo).forEach(([metodo, monto]) => {
          doc.text(`  ${metodo}: $${monto.toFixed(2)}`, 14, y); nl();
        });
        nl(5);
      }

      doc.setFontSize(14);
      doc.text('Productos Vendidos', 14, y); nl(10);
      doc.setFontSize(10);
      if (data.productos.items.length === 0) {
        doc.text('  Sin productos vendidos', 14, y); nl();
      } else {
        data.productos.items.forEach(p => {
          doc.text(`  ${p.nombre_producto}: ${p.cantidad} x $${(p.total / p.cantidad).toFixed(2)} = $${p.total.toFixed(2)}`, 14, y); nl();
        });
        nl(5);
      }

      doc.setFontSize(14);
      doc.text('Mesoneros', 14, y); nl(10);
      doc.setFontSize(10);
      if (data.mesoneros.items.length === 0) {
        doc.text('  Sin datos de mesoneros', 14, y); nl();
      } else {
        data.mesoneros.items.forEach(m => {
          doc.text(`  ${m.nombre_mesonero}: ${m.pedidos} pedidos, $${m.ventas.toFixed(2)} ventas, $${m.propinas.toFixed(2)} propinas`, 14, y); nl();
        });
      }

      doc.save(`Reporte_Completo_${hoy}.pdf`);
    } catch (e) {
      console.error('Error al exportar reporte completo', e);
    }
  };

  const cargarStats = async () => {
    setLoadingStats(true);
    try {
      const [hoy, semana, mes] = await Promise.all([
        fetch('/api/stats/hoy').then(r => r.json()),
        fetch('/api/stats/semana').then(r => r.json()),
        fetch('/api/stats/mesoneros').then(r => r.json()),
      ]);
      setStatsHoy(hoy);
      setStatsSemana(semana);
      setMesoneros(mes);
      setStatsMetodos(hoy.metodos_pago || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingStats(false);
  };

  useEffect(() => {
    fetchMesas();
    if (esAdmin) cargarStats();
    else setLoadingStats(false);
  }, []);

  const conteos = {
    libre: mesas.filter(m => m.estado === 'libre').length,
    ocupada: mesas.filter(m => m.estado === 'ocupada').length,
    atendida: mesas.filter(m => m.estado === 'atendida').length,
    cuenta: mesas.filter(m => m.estado === 'cuenta').length,
    limpiando: mesas.filter(m => m.estado === 'limpiando').length,
  };

  const totalMesas = mesas.length;

  if (mesasLoading || loadingStats) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <RefreshCw className="animate-spin text-indigo-500 mx-auto mb-3" size={36} />
          <p className="text-gray-400 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {esAdmin && statsHoy && (
              <>
                <button
                  onClick={handleExportPDF}
                  className="p-2 hover:bg-white rounded-xl border border-gray-200 transition-colors text-gray-500"
                  title="Exportar PDF"
                >
                  <FileDown size={18} />
                </button>
                <button
                  onClick={handleExportCSV}
                  className="p-2 hover:bg-white rounded-xl border border-gray-200 transition-colors text-gray-500 text-xs font-medium hidden sm:block"
                  title="Exportar CSV"
                >
                  CSV
                </button>
                <button
                  onClick={handleExportCompleto}
                  className="px-3 py-2 hover:bg-white rounded-xl border border-gray-200 transition-colors text-gray-500 text-xs font-medium"
                  title="Exportar Reporte Completo"
                >
                  Completo
                </button>
              </>
            )}
            <button
              onClick={() => { fetchMesas(); if (esAdmin) cargarStats(); }}
              className="p-2 hover:bg-white rounded-xl border border-gray-200 transition-colors text-gray-500"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* KPIs del día — Solo para admin/gerente */}
        {esAdmin && statsHoy && (
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ventas del Día</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={DollarSign}
                title="Ingresos Hoy"
                value={`$${(statsHoy.ingresos_totales || 0).toFixed(2)}`}
                sub={`Propinas: $${(statsHoy.total_propinas || 0).toFixed(2)}`}
                color="bg-emerald-500"
                gradient="bg-gradient-to-r from-emerald-400 to-teal-500"
              />
              <StatCard
                icon={ShoppingBag}
                title="Pedidos Cobrados"
                value={statsHoy.total_pedidos || 0}
                sub="completados hoy"
                color="bg-indigo-500"
                gradient="bg-gradient-to-r from-indigo-400 to-purple-500"
              />
              <StatCard
                icon={LayoutGrid}
                title="Mesas Atendidas"
                value={statsHoy.mesas_atendidas || 0}
                sub={`de ${totalMesas} mesas`}
                color="bg-sky-500"
                gradient="bg-gradient-to-r from-sky-400 to-blue-500"
              />
              <StatCard
                icon={Users}
                title="Ticket Promedio"
                value={statsHoy.total_pedidos > 0 ? `$${(statsHoy.ingresos_totales / statsHoy.total_pedidos).toFixed(2)}` : '$0'}
                sub="por pedido"
                color="bg-amber-500"
                gradient="bg-gradient-to-r from-amber-400 to-orange-500"
              />
            </div>
          </div>
        )}

        {/* Estado de mesas — Visible para todos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <LayoutGrid size={18} className="text-indigo-500" />
              Estado Actual de Mesas
            </h3>
            <div className="space-y-2.5">
              {[
                { key: 'libre', label: 'Libres', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                { key: 'ocupada', label: 'Ocupadas', color: 'bg-rose-500', textColor: 'text-rose-700' },
                { key: 'atendida', label: 'Atendidas', color: 'bg-sky-500', textColor: 'text-sky-700' },
                { key: 'cuenta', label: 'Por Cobrar', color: 'bg-violet-500', textColor: 'text-violet-700' },
                { key: 'limpiando', label: 'Limpiando', color: 'bg-amber-500', textColor: 'text-amber-700' },
              ].map(({ key, label, color, textColor }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`} />
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`${color} h-2 rounded-full transition-all`}
                      style={{ width: `${totalMesas > 0 ? (conteos[key] / totalMesas) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-4 text-right ${textColor}`}>{conteos[key]}</span>
                  <span className="text-xs text-gray-400 w-16">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico de semana — Solo admin */}
          {esAdmin && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-500" />
                Últimos 7 Días
              </h3>
              <MiniBarChart data={statsSemana} />
            </div>
          )}
        </div>

        {/* Métodos de pago + Ranking mesoneros — Solo admin */}
        {esAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Métodos de pago hoy */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-bold text-gray-700 mb-4">Métodos de Pago — Hoy</h3>
              {statsMetodos.length === 0 ? (
                <div className="text-center py-6 text-gray-300 text-sm">Sin ventas hoy</div>
              ) : (
                <div className="space-y-3">
                  {statsMetodos.map((m, i) => {
                    const max = Math.max(...statsMetodos.map(x => x.monto));
                    const pct = max > 0 ? (m.monto / max) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${METODO_COLORS[m.metodo_pago] || 'bg-gray-400'}`} />
                        <span className="text-sm text-gray-600 w-24 font-medium">{METODO_LABELS[m.metodo_pago] || m.metodo_pago}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className={`${METODO_COLORS[m.metodo_pago] || 'bg-gray-400'} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-16 text-right">${m.monto.toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ranking mesoneros */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                Ranking Mesoneros — Hoy
              </h3>
              {mesoneros.length === 0 ? (
                <div className="text-center py-6 text-gray-300 text-sm">Sin datos hoy</div>
              ) : (
                <div className="space-y-2">
                  {mesoneros.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-gray-100 text-gray-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm truncate">{m.nombre_mesonero || '—'}</div>
                        <div className="text-xs text-gray-400">{m.pedidos} pedidos</div>
                      </div>
                      <div className="font-black text-gray-800 text-sm">${m.ventas.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-700 mb-3">Accesos Rápidos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/mesas', label: 'Mesas', icon: LayoutGrid, gradient: 'from-emerald-500 to-teal-600' },
              { href: '/cocina', label: 'Cocina', icon: ShoppingBag, gradient: 'from-orange-500 to-red-500' },
              { href: '/caja', label: 'Caja', icon: DollarSign, gradient: 'from-sky-500 to-blue-600' },
              { href: '/historial', label: 'Historial', icon: TrendingUp, gradient: 'from-indigo-500 to-purple-600' },
            ].map(({ href, label, icon: Icon, gradient }) => (
              <a
                key={href}
                href={href}
                className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-white text-center hover:opacity-90 transition-all active:scale-95 shadow-sm`}
              >
                <Icon size={22} className="mx-auto mb-1.5" />
                <span className="font-bold text-sm">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
