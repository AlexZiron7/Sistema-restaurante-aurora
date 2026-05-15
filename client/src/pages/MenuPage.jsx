import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, DollarSign, Image as ImageIcon, Package, Folder, List, Check, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useToast } from '../contexts/ToastContext';
import { SkeletonGrid, SkeletonTable } from '../components/Skeleton';

export default function MenuPage() {
  const { formatearPrecio, tasaBCV } = useRestaurant();
  const { success, error } = useToast();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActual, setTabActual] = useState('productos'); // 'productos' o 'categorias'
  
  // Modals state
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  
  // Editing state
  const [editandoProducto, setEditandoProducto] = useState(null);
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  
  // Forms state
  const [formProducto, setFormProducto] = useState({ 
    nombre: '', 
    precio_usd: '', 
    id_categoria: '',
    es_combo: false,
    productos_incluidos: '',
    precio_combo: '',
    descripcion: ''
  });
  const [formCategoria, setFormCategoria] = useState({ nombre: '', icono: '🍽️' });
  
  // Upload ref
  const fileInputRef = useRef(null);
  const [imagenPreview, setImagenPreview] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        api.getProductos(),
        api.getCategorias()
      ]);
      setProductos(prodsData);
      setCategorias(catsData);
    } catch (err) {
      error('Error al cargar datos');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImportarCSV = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return error('El archivo no tiene datos suficientes');

      // Detectar delimitador
      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';
      
      const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
      const data = lines.slice(1).map(line => {
        const values = line.split(delimiter);
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i]?.trim();
        });
        return {
          nombre: obj.nombre || obj.product || obj.articulo,
          descripcion: obj.descripcion || obj.detalles || '',
          precio_usd: parseFloat(obj.precio_usd || obj.precio || 0),
          categoria: obj.categoria || obj.tipo || 'General'
        };
      }).filter(p => p.nombre);

      if (data.length === 0) return error('El archivo está vacío');

      try {
        setLoading(true);
        await api.importarProductos(data);
        success(`${data.length} productos importados correctamente`);
        fetchData();
      } catch (err) {
        error('Error al importar productos: ' + err.message);
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // --- CATEGORÍAS ---
  const abrirModalCategoria = (categoria = null) => {
    if (categoria) {
      setEditandoCategoria(categoria);
      setFormCategoria({ nombre: categoria.nombre, icono: categoria.icono });
    } else {
      setEditandoCategoria(null);
      setFormCategoria({ nombre: '', icono: '🍽️' });
    }
    setShowCategoriaModal(true);
  };

  const cerrarModalCategoria = () => {
    setShowCategoriaModal(false);
    setEditandoCategoria(null);
  };

  const handleSubmitCategoria = async (e) => {
    e.preventDefault();
    if (!formCategoria.nombre.trim()) return error('El nombre de categoría es requerido');

    try {
      if (editandoCategoria) {
        await api.actualizarCategoria(editandoCategoria.id, formCategoria);
        success('Categoría actualizada');
      } else {
        await api.crearCategoria(formCategoria);
        success('Categoría creada');
      }
      cerrarModalCategoria();
      fetchData();
    } catch (err) {
      error(err.message || 'Error al guardar categoría');
    }
  };

  const eliminarCategoria = async (categoria) => {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;
    try {
      await api.eliminarCategoria(categoria.id);
      success('Categoría eliminada');
      fetchData();
    } catch (err) {
      error(err.message || 'Error al eliminar');
    }
  };

  // --- PRODUCTOS ---
  const abrirModalProducto = (producto = null) => {
    if (producto) {
      setEditandoProducto(producto);
      setFormProducto({
        nombre: producto.nombre,
        precio_usd: producto.precio_usd.toString(),
        id_categoria: producto.id_categoria?.toString() || '',
        es_combo: producto.es_combo === 1,
        productos_incluidos: producto.productos_incluidos || '',
        precio_combo: producto.precio_combo?.toString() || '',
        descripcion: producto.descripcion || ''
      });
      setImagenPreview(producto.imagen ? (producto.imagen.startsWith('http') || producto.imagen.startsWith('data:') || producto.imagen.startsWith('/') ? producto.imagen : `/${producto.imagen}`) : null);
    } else {
      setEditandoProducto(null);
      setFormProducto({ 
        nombre: '', precio_usd: '', id_categoria: '', 
        es_combo: false, productos_incluidos: '', precio_combo: '', descripcion: '' 
      });
      setImagenPreview(null);
    }
    setShowProductoModal(true);
  };

  const cerrarModalProducto = () => {
    setShowProductoModal(false);
    setEditandoProducto(null);
    setImagenPreview(null);
  };

  const handleImagenChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editandoProducto) return;
    
    try {
      const res = await api.subirImagenProducto(editandoProducto.id, file);
      if (res.success) {
        setImagenPreview(res.imagen);
        success('Imagen actualizada');
        fetchData();
      }
    } catch (err) {
      error('Error al subir imagen');
    }
  };

  const eliminarImagen = async () => {
    if (!editandoProducto) return;
    try {
      await api.eliminarImagenProducto(editandoProducto.id);
      setImagenPreview(null);
      success('Imagen eliminada');
      fetchData();
    } catch (err) {
      error('Error al eliminar imagen');
    }
  };

  const handleSubmitProducto = async (e) => {
    e.preventDefault();
    
    if (!formProducto.nombre.trim()) return error('El nombre es requerido');
    if (!formProducto.precio_usd || parseFloat(formProducto.precio_usd) <= 0) return error('El precio debe ser mayor a 0');

    try {
      const data = {
        nombre: formProducto.nombre,
        precio_usd: parseFloat(formProducto.precio_usd),
        id_categoria: formProducto.id_categoria ? parseInt(formProducto.id_categoria) : null,
        es_combo: formProducto.es_combo,
        productos_incluidos: formProducto.productos_incluidos,
        precio_combo: formProducto.precio_combo ? parseFloat(formProducto.precio_combo) : null,
        descripcion: formProducto.descripcion
      };

      let newId = null;
      if (editandoProducto) {
        newId = editandoProducto.id;
        await api.actualizarProducto(newId, data);
        success('Producto actualizado');
      } else {
        const res = await api.crearProducto(data);
        newId = res.id;
        success('Producto creado');
      }

      // Si se subió imagen nueva (solo para creación nueva, ya que edición se sube directo)
      if (!editandoProducto && fileInputRef.current?.files[0]) {
        await api.subirImagenProducto(newId, fileInputRef.current.files[0]);
      }

      cerrarModalProducto();
      fetchData();
    } catch (err) {
      error(err.message || 'Error al guardar');
    }
  };

  const eliminarProducto = async (producto) => {
    if (!confirm(`¿Eliminar "${producto.nombre}"?`)) return;
    try {
      await api.eliminarProducto(producto.id);
      success('Producto eliminado');
      fetchData();
    } catch (err) {
      error('Error al eliminar');
    }
  };

  const productosPorCategoria = categorias.map(cat => ({
    ...cat,
    productos: productos.filter(p => p.id_categoria === cat.id)
  }));
  
  const productosSinCategoria = productos.filter(p => !p.id_categoria);
  if (productosSinCategoria.length > 0) {
    productosPorCategoria.push({ id: null, nombre: 'Sin Categoría', icono: '📦', productos: productosSinCategoria });
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex gap-3 mb-6">
          <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
        </div>
        {tabActual === 'productos' ? (
          <SkeletonGrid items={8} />
        ) : (
          <SkeletonTable rows={4} cols={3} />
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col space-y-6 animate-fade-in pb-10">
      {/* Decorative background shapes */}
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50 pointer-events-none z-[-1]" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none z-[-1]" />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">Gestión del Menú</h2>
          <p className="text-gray-500 font-medium">Administra categorías, platillos y combos</p>
        </div>
        
        {/* Custom Tabs */}
        <div className="flex p-1 space-x-1 bg-gray-100/80 backdrop-blur-md rounded-xl border border-gray-200/60 shadow-inner">
          <button
            onClick={() => setTabActual('productos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
              tabActual === 'productos' 
              ? 'bg-white shadow-md text-primary-700 transform scale-[1.02]' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <List size={18} />
            Platillos
          </button>
          <button
            onClick={() => setTabActual('categorias')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
              tabActual === 'categorias' 
              ? 'bg-white shadow-md text-primary-700 transform scale-[1.02]' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <Folder size={18} />
            Categorías
          </button>
        </div>
      </div>

      {tabActual === 'productos' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-end">
            <a
              href="/api/productos/plantilla"
              download
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all shadow-sm"
            >
              <FileSpreadsheet size={18} className="text-green-600" />
              Plantilla CSV
            </a>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) handleImportarCSV(file);
                };
                input.click();
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all shadow-sm"
            >
              <RefreshCw size={18} className="text-indigo-600" />
              Carga Masiva
            </button>
            <button
              onClick={() => abrirModalProducto()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/30 font-semibold transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus size={20} />
              Nuevo Producto / Combo
            </button>
          </div>

          <div className="space-y-8">
            {productosPorCategoria.map(({ id, nombre, icono, productos: prods }) => (
              <div key={id || 'sin-cat'} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl drop-shadow-sm">{icono}</span>
                  <h3 className="text-xl font-bold text-gray-800 tracking-tight">{nombre}</h3>
                  <div className="h-px bg-gradient-to-r from-gray-200 to-transparent flex-1 mt-1"></div>
                </div>
                
                {prods.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {prods.map((producto) => {
                      const precios = formatearPrecio(producto.precio_usd);
                      const isCombo = producto.es_combo === 1;
                      
                      return (
                        <div key={producto.id} className="group relative bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                          {isCombo && (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-md z-10 flex items-center gap-1">
                              <Package size={10} /> Combo
                            </div>
                          )}
                          
                          <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden group-hover:opacity-90 transition-opacity">
                            {producto.imagen ? (
                              <img src={producto.imagen.startsWith('http') || producto.imagen.startsWith('data:') || producto.imagen.startsWith('/') ? producto.imagen : `/${producto.imagen}`} alt={producto.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={40} className="text-gray-300" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                                <button
                                  onClick={() => abrirModalProducto(producto)}
                                  className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full shadow-lg transform hover:scale-110 transition-all"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => eliminarProducto(producto)}
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
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white/50 backdrop-blur-sm border border-dashed border-gray-300 rounded-2xl text-gray-400">
                    No hay productos en esta categoría
                  </div>
                )}
              </div>
            ))}
          </div>

          {productos.length === 0 && (
            <div className="bg-white/60 backdrop-blur-md border border-white/50 py-16 px-4 rounded-3xl shadow-sm text-center text-gray-500 flex flex-col items-center">
              <Package size={64} className="text-gray-200 mb-4" />
              <p className="text-lg font-medium text-gray-600">No hay productos registrados en el menú</p>
              <button
                onClick={() => abrirModalProducto()}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-xl font-semibold transition-colors"
              >
                <Plus size={20} /> Crear tu primer producto
              </button>
            </div>
          )}
        </div>
      )}

      {tabActual === 'categorias' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-end">
            <button
              onClick={() => abrirModalCategoria()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 font-semibold transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus size={20} />
              Nueva Categoría
            </button>
          </div>

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
                          onClick={() => abrirModalCategoria(cat)}
                          className="p-2.5 bg-white shadow-sm border border-gray-100 hover:border-blue-200 hover:text-blue-600 rounded-xl transition-all hover:scale-110"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => eliminarCategoria(cat)}
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
        </div>
      )}

      {/* MODAL CATEGORIA */}
      {showCategoriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto pt-20">
          <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">
                {editandoCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={cerrarModalCategoria} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategoria} className="p-6 space-y-5">
              <div className="flex gap-4">
                <div className="w-16">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Icono</label>
                  <input
                    type="text"
                    value={formCategoria.icono}
                    onChange={(e) => setFormCategoria({ ...formCategoria, icono: e.target.value })}
                    className="w-full text-center text-2xl px-2 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
                    maxLength="2"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre de categoría</label>
                  <input
                    type="text"
                    value={formCategoria.nombre}
                    onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
                    placeholder="ej: Platos Fuertes"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModalCategoria}
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
      )}

      {/* MODAL PRODUCTO / COMBO */}
      {showProductoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-2xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                {editandoProducto ? 'Editar Información' : 'Nuevo Menú'}
                {formProducto.es_combo && <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-lg uppercase tracking-wider font-bold">Combo</span>}
              </h3>
              <button onClick={cerrarModalProducto} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitProducto} className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* Lado Izquierdo - Imagen y Tipo */}
              <div className="w-full md:w-1/3 flex flex-col gap-6">
                
                {/* Upload Section */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fotografía</label>
                  <div className="relative group w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary-500 bg-gray-50 overflow-hidden flex flex-col items-center justify-center transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={editandoProducto ? handleImagenChange : (e) => {
                        // Modo creación: solo preview local
                        if (e.target.files?.[0]) {
                          setImagenPreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                    />
                  </div>
                  {imagenPreview && editandoProducto && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); eliminarImagen(); }} className="w-full mt-2 py-2 text-sm text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors">
                      Quitar Imagen
                    </button>
                  )}
                </div>

                {/* Tipo Switch */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <span className="block text-sm font-bold text-gray-700 mb-3">Tipo de Producto</span>
                  <label className="relative inline-flex items-center cursor-pointer w-full">
                    <input type="checkbox" className="sr-only peer" checked={formProducto.es_combo} onChange={(e) => setFormProducto({...formProducto, es_combo: e.target.checked})} />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    <span className="ml-3 text-sm font-medium text-gray-800 peer-checked:text-orange-600 transition-colors">Es un Combo/Promo</span>
                  </label>
                </div>

              </div>

              {/* Lado Derecho - Detalles */}
              <div className="flex-1 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={formProducto.nombre}
                    onChange={(e) => setFormProducto({ ...formProducto, nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-inner font-medium"
                    placeholder="ej: Hamburguesa Doble"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Categoría</label>
                    <div className="relative">
                      <select
                        value={formProducto.id_categoria}
                        onChange={(e) => setFormProducto({ ...formProducto, id_categoria: e.target.value })}
                        className="w-full appearance-none px-4 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-inner font-medium text-gray-700"
                      >
                        <option value="">Sin categoría</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.icono} {cat.nombre}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
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
                        value={formProducto.precio_usd}
                        onChange={(e) => setFormProducto({ ...formProducto, precio_usd: e.target.value })}
                        className="w-full pl-9 pr-4 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-inner font-bold text-green-700 placeholder-gray-400"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {!formProducto.es_combo && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Descripción (Opcional)</label>
                    <textarea
                      value={formProducto.descripcion}
                      onChange={(e) => setFormProducto({ ...formProducto, descripcion: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 bg-opacity-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-inner font-medium text-sm h-20 resize-none"
                      placeholder="ej: Delinea los detalles o ingredientes adicionales del plato..."
                    />
                  </div>
                )}

                {/* Combos extra fields */}
                {formProducto.es_combo && (
                  <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-4 animate-scale-in origin-top">
                    <div>
                      <label className="block text-sm font-bold text-orange-900 mb-1.5">¿Qué incluye el combo?</label>
                      <textarea
                        value={formProducto.productos_incluidos}
                        onChange={(e) => setFormProducto({ ...formProducto, productos_incluidos: e.target.value })}
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
                          value={formProducto.precio_combo}
                          onChange={(e) => setFormProducto({ ...formProducto, precio_combo: e.target.value })}
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
                    onClick={cerrarModalProducto}
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
      )}
    </div>
  );
}
