import { UtensilsCrossed, DollarSign, CheckCircle, Sparkles, Clock, Edit2, Trash2, Users } from 'lucide-react';

const ESTADOS = {
  libre: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
    text: 'text-white',
    label: 'Libre',
    dot: 'bg-emerald-300',
    glow: 'shadow-emerald-200'
  },
  ocupada: {
    bg: 'bg-rose-500',
    border: 'border-rose-400',
    text: 'text-white',
    label: 'Ocupada',
    dot: 'bg-rose-300',
    glow: 'shadow-rose-200'
  },
  atendida: {
    bg: 'bg-sky-500',
    border: 'border-sky-400',
    text: 'text-white',
    label: 'Atendida',
    dot: 'bg-sky-300',
    glow: 'shadow-sky-200'
  },
  cuenta: {
    bg: 'bg-violet-500',
    border: 'border-violet-400',
    text: 'text-white',
    label: 'Cuenta',
    dot: 'bg-violet-300',
    glow: 'shadow-violet-200'
  },
  limpiando: {
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    text: 'text-white',
    label: 'Limpiando',
    dot: 'bg-amber-300',
    glow: 'shadow-amber-200'
  }
};

export default function MesaCard({ mesa, onClick, onEstadoChange, onCerrarMesa, onEditar, onEliminar }) {
  const estado = ESTADOS[mesa.estado] || ESTADOS.libre;

  const handleCardClick = () => {
    if ((mesa.estado === 'libre' || mesa.estado === 'atendida') && onClick) {
      onClick(mesa);
    }
  };

  const handleCuentaClick = (e) => {
    e.stopPropagation();
    if (onCerrarMesa) onCerrarMesa(mesa);
  };

  const handleLimpiaClick = (e) => {
    e.stopPropagation();
    if (onEstadoChange) onEstadoChange(mesa.id, 'libre');
  };

  const handleNuevoPedidoClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(mesa);
  };

  const handleEditarClick = (e) => {
    e.stopPropagation();
    if (onEditar) onEditar(mesa);
  };

  const handleEliminarClick = (e) => {
    e.stopPropagation();
    if (onEliminar) onEliminar(mesa);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        relative rounded-2xl overflow-hidden border-2 ${estado.border}
        shadow-lg ${estado.glow} transition-all duration-200
        flex flex-col
        ${mesa.estado === 'libre' || mesa.estado === 'atendida' ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default'}
      `}
    >
      {/* Header de la tarjeta */}
      <div className={`${estado.bg} px-4 pt-4 pb-3 relative`}>
        {/* Botones de editar/eliminar */}
        {onEditar && onEliminar && mesa.estado === 'libre' && (
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={handleEditarClick}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit2 size={12} className="text-white" />
            </button>
            <button
              onClick={handleEliminarClick}
              className="p-1.5 bg-white/20 hover:bg-red-500 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 size={12} className="text-white" />
            </button>
          </div>
        )}

        {(mesa.estado === 'ocupada' || mesa.estado === 'cuenta') && (
          <div className="absolute top-2.5 right-2.5">
            <span className={`flex h-3 w-3`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${estado.dot} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${estado.dot}`} />
            </span>
          </div>
        )}

        {/* Número de mesa grande */}
        <div className="text-center">
          <div className="text-4xl font-black text-white leading-none mb-1">
            {mesa.numero_mesa}
          </div>
          <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Mesa
          </div>
          {mesa.capacidad && (
            <div className="flex items-center justify-center gap-1 mt-1 text-white/60">
              <Users size={12} />
              <span className="text-xs font-medium">{mesa.capacidad}</span>
            </div>
          )}
        </div>
      </div>

      {/* Estado badge */}
      <div className={`${estado.bg} px-4 pb-2`}>
        <div className="flex items-center justify-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${estado.dot}`} />
          <span className="text-xs font-bold text-white/90 uppercase tracking-widest">
            {estado.label}
          </span>
        </div>
      </div>

      {/* Panel de acción — diferente por estado */}
      {mesa.estado === 'libre' && (
        <button
          onClick={handleNuevoPedidoClick}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white hover:bg-emerald-50 transition-colors group"
        >
          <UtensilsCrossed size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold text-emerald-700">Nuevo Pedido</span>
        </button>
      )}

      {(mesa.estado === 'ocupada' || mesa.estado === 'atendida') && (
        <button
          onClick={handleCuentaClick}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white hover:bg-rose-50 transition-colors group"
        >
          <DollarSign size={16} className="text-rose-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold text-rose-700">Pedir la Cuenta</span>
        </button>
      )}

      {mesa.estado === 'cuenta' && (
        <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white">
          <Clock size={14} className="text-violet-400 animate-pulse" />
          <span className="text-xs font-semibold text-violet-500">Procesando en Caja...</span>
        </div>
      )}

      {mesa.estado === 'limpiando' && (
        <button
          onClick={handleLimpiaClick}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white hover:bg-amber-50 transition-colors group"
        >
          <Sparkles size={16} className="text-amber-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold text-amber-700">Marcar como Limpia</span>
        </button>
      )}
    </div>
  );
}
