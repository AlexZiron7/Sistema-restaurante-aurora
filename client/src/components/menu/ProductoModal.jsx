import { useState, useEffect, useRef } from 'react';
import { Save, X, DollarSign, Image as ImageIcon, Edit2 } from 'lucide-react';

export default function ProductoModal({
  show, producto, categorias, fileInputRef, initialPreview,
  onClose, onSave, onImagenChange, onEliminarImagen, onFileSelect
}) {
  const [form, setForm] = useState({
    nombre: '', precio_usd: '', id_categoria: '',
    es_combo: false, productos_incluidos: '', precio_combo: '', descripcion: ''
  });
  const [imagenPreview, setImagenPreview] = useState(null);
  const localFileRef = useRef(null);

  const usedFileRef = fileInputRef || localFileRef;

  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre,
        precio_usd: producto.precio_usd.toString(),
        id_categoria: producto.id_categoria?.toString() || '',
        es_combo: producto.es_combo === 1,
        productos_incluidos: producto.productos_incluidos || '',
        precio_combo: producto.precio_combo?.toString() || '',
        descripcion: producto.descripcion || ''
      });
      setImagenPreview(producto.imagen
        ? (producto.imagen.startsWith('http') || producto.imagen.startsWith('data:') || producto.imagen.startsWith('/') ? producto.imagen : `/${producto.imagen}`)
        : null);
    } else {
      setForm({
        nombre: '', precio_usd: '', id_categoria: '',
        es_combo: false, productos_incluidos: '', precio_combo: '', descripcion: ''
      });
      setImagenPreview(null);
    }
  }, [producto, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ form, producto, imagenFile: usedFileRef.current?.files?.[0] });
  };

  const handleLocalImagenChange = (e) => {
    onImagenChange?.(e);
    if (!producto && e.target.files?.[0]) {
      setImagenPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-2xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
          <h3 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
            {producto ? 'Editar Información' : 'Nuevo Menú'}
            {form.es_combo && <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-lg uppercase tracking-wider font-bold">Combo</span>}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Fotografía</label>
              <div
                className="relative group w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary-500 bg-gray-50 overflow-hidden flex flex-col items-center justify-center transition-colors cursor-pointer"
                onClick={() => usedFileRef.current?.click()}
              >
                {imagenPreview ? (
                  <>
                    <img src={imagenPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      <Edit2 size={24} className="mb-2" />
                      <span className="text-sm font-medium">Cambiar</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                      <ImageIcon size={32} className="text-gray-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Haz clic para subir foto</span>
                  </>
                )}
                <input
                  type="file"
                  ref={usedFileRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleLocalImagenChange}
                />
              </div>
              {imagenPreview && producto && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onEliminarImagen(); }} className="w-full mt-2 py-2 text-sm text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors">
                  Quitar Imagen
                </button>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <span className="block text-sm font-bold text-gray-700 mb-3">Tipo de Producto</span>
              <label className="relative inline-flex items-center cursor-pointer w-full">
                <input type="checkbox" className="sr-only peer" checked={form.es_combo} onChange={(e) => setForm({ ...form, es_combo: e.target.checked })} />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                <span className="ml-3 text-sm font-medium text-gray-800 peer-checked:text-orange-600 transition-colors">Es un Combo/Promo</span>
              </label>
            </div>
          </div>

          <div className="flex-1 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-inner font-medium"
                placeholder="ej: Hamburguesa Doble"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Categoría</label>
                <div className="relative">
                  <select
                    value={form.id_categoria}
                    onChange={(e) => setForm({ ...form, id_categoria: e.target.value })}
                    className="w-full appearance-none px-4 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-inner font-medium text-gray-700"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icono} {cat.nombre}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>
              <div className="sm:w-32">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Precio USD</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precio_usd}
                    onChange={(e) => setForm({ ...form, precio_usd: e.target.value })}
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-inner font-bold text-green-700 placeholder-gray-400"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {!form.es_combo && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Descripción (Opcional)</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-inner font-medium text-sm h-20 resize-none"
                  placeholder="ej: Delinea los detalles o ingredientes adicionales del plato..."
                />
              </div>
            )}

            {form.es_combo && (
              <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-4 animate-scale-in origin-top">
                <div>
                  <label className="block text-sm font-bold text-orange-900 mb-1.5">¿Qué incluye el combo?</label>
                  <textarea
                    value={form.productos_incluidos}
                    onChange={(e) => setForm({ ...form, productos_incluidos: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-inner resize-none h-24 text-sm"
                    placeholder="ej: 1 Hamburguesa Clásica, 1 Papas Fritas, 1 Refresco de 1L"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-orange-900 mb-1.5">Precio Regular (Sin descuento - Opcional)</label>
                  <div className="relative w-1/2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-orange-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.precio_combo}
                      onChange={(e) => setForm({ ...form, precio_combo: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                      placeholder="Valor real sin promo"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6 mt-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Guardar Menú
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
