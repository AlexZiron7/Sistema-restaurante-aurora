import { Edit2, Trash2, Folder } from 'lucide-react';

export default function CategoriaTable({ categorias, onEditar, onEliminar }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50/80 backdrop-blur-md border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20 text-center">Icono</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {categorias.map((cat) => (
            <tr key={cat.id} className="hover:bg-primary-50/50 transition-colors group">
              <td className="px-6 py-4 text-center text-3xl">{cat.icono}</td>
              <td className="px-6 py-4 font-bold text-gray-800 text-lg">{cat.nombre}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditar(cat)}
                    className="p-2.5 bg-white shadow-sm border border-gray-100 hover:border-blue-200 hover:text-blue-600 rounded-xl transition-all hover:scale-110"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onEliminar(cat)}
                    className="p-2.5 bg-white shadow-sm border border-gray-100 hover:border-red-200 hover:text-red-500 rounded-xl transition-all hover:scale-110"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {categorias.length === 0 && (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center">
          <Folder size={48} className="mb-4 text-gray-200" />
          <p>No hay categorías creadas aún.</p>
        </div>
      )}
    </div>
  );
}
