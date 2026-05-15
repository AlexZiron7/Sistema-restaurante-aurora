import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

export default function CategoriaModal({ show, categoria, onClose, onSave }) {
  const [form, setForm] = useState({ nombre: '', icono: '🍽️' });

  useEffect(() => {
    if (categoria) {
      setForm({ nombre: categoria.nombre, icono: categoria.icono });
    } else {
      setForm({ nombre: '', icono: '🍽️' });
    }
  }, [categoria, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form, categoria);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto pt-20">
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-sm animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
          <h3 className="text-2xl font-black text-gray-800 tracking-tight">
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex gap-4">
            <div className="w-16">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Icono</label>
              <input
                type="text"
                value={form.icono}
                onChange={(e) => setForm({ ...form, icono: e.target.value })}
                className="w-full text-center text-2xl px-2 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
                maxLength="2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre de categoría</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
                placeholder="ej: Platos Fuertes"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <Save size={18} />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
