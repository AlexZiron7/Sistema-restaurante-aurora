import { Edit2, Trash2, Image as ImageIcon, Package } from 'lucide-react';

export default function ProductoCard({ producto, formatearPrecio, tasaBCV, onEditar, onEliminar }) {
  const precios = formatearPrecio(producto.precio_usd);
  const isCombo = producto.es_combo === 1;

  return (
    <div className="group relative bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {isCombo && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-md z-10 flex items-center gap-1">
          <Package size={10} /> Combo
        </div>
      )}

      <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden group-hover:opacity-90 transition-opacity">
        {producto.imagen ? (
          <img
            src={producto.imagen.startsWith('http') || producto.imagen.startsWith('data:') || producto.imagen.startsWith('/') ? producto.imagen : `/${producto.imagen}`}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={40} className="text-gray-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
          <button
            onClick={() => onEditar(producto)}
            className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full shadow-lg transform hover:scale-110 transition-all"
            title="Editar"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onEliminar(producto)}
            className="p-2 bg-red-500/90 backdrop-blur-sm hover:bg-red-500 text-white rounded-full shadow-lg transform hover:scale-110 transition-all"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-bold text-gray-800 text-lg mb-1 leading-tight">{producto.nombre}</h4>

        {isCombo && producto.productos_incluidos && (
          <p className="text-xs text-gray-500 mb-3 flex-1 italic">
            Incluye: {producto.productos_incluidos}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-end justify-between border-t border-gray-100">
          <div>
            <span className="block text-green-600 font-bold text-xl">
              {precios?.usd || '-'}
            </span>
            {tasaBCV > 0 && (
              <span className="block text-gray-400 text-xs font-medium">
                {precios?.bs || '-'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
