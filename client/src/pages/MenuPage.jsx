import { useState, useEffect, useRef } from 'react';
import { Plus, RefreshCw, List, Folder, FileSpreadsheet, Package } from 'lucide-react';
import { api } from '../services/api';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useToast } from '../contexts/ToastContext';
import { SkeletonGrid, SkeletonTable } from '../components/Skeleton';
import ProductoCard from '../components/menu/ProductoCard';
import CategoriaTable from '../components/menu/CategoriaTable';
import CategoriaModal from '../components/menu/CategoriaModal';
import ProductoModal from '../components/menu/ProductoModal';

export default function MenuPage() {
  const { formatearPrecio, tasaBCV } = useRestaurant();
  const { success, error } = useToast();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActual, setTabActual] = useState('productos');
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [editandoProducto, setEditandoProducto] = useState(null);
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => { fetchData(); }, []);

  const handleImportarCSV = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return error('El archivo no tiene datos suficientes');

      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
      const data = lines.slice(1).map(line => {
        const values = line.split(delimiter);
        const obj = {};
        headers.forEach((header, i) => { obj[header] = values[i]?.trim(); });
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
  const handleSaveCategoria = async (form, categoria) => {
    if (!form.nombre.trim()) return error('El nombre de categoría es requerido');
    try {
      if (categoria) {
        await api.actualizarCategoria(categoria.id, form);
        success('Categoría actualizada');
      } else {
        await api.crearCategoria(form);
        success('Categoría creada');
      }
      setShowCategoriaModal(false);
      setEditandoCategoria(null);
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
  const handleImagenChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editandoProducto) return;
    try {
      const res = await api.subirImagenProducto(editandoProducto.id, file);
      if (res.success) {
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
      success('Imagen eliminada');
      fetchData();
    } catch (err) {
      error('Error al eliminar imagen');
    }
  };

  const handleSaveProducto = async ({ form, producto, imagenFile }) => {
    if (!form.nombre.trim()) return error('El nombre es requerido');
    if (!form.precio_usd || parseFloat(form.precio_usd) <= 0) return error('El precio debe ser mayor a 0');

    try {
      const data = {
        nombre: form.nombre,
        precio_usd: parseFloat(form.precio_usd),
        id_categoria: form.id_categoria ? parseInt(form.id_categoria) : null,
        es_combo: form.es_combo,
        productos_incluidos: form.productos_incluidos,
        precio_combo: form.precio_combo ? parseFloat(form.precio_combo) : null,
        descripcion: form.descripcion
      };

      let newId = null;
      if (producto) {
        newId = producto.id;
        await api.actualizarProducto(newId, data);
        success('Producto actualizado');
      } else {
        const res = await api.crearProducto(data);
        newId = res.id;
        success('Producto creado');
      }

      if (imagenFile) {
        await api.subirImagenProducto(newId, imagenFile);
      }

      setShowProductoModal(false);
      setEditandoProducto(null);
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
    ...cat, productos: productos.filter(p => p.id_categoria === cat.id)
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
        {tabActual === 'productos' ? <SkeletonGrid items={8} /> : <SkeletonTable rows={4} cols={3} />}
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col space-y-6 animate-fade-in pb-10">
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50 pointer-events-none z-[-1]" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none z-[-1]" />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">Gestión del Menú</h2>
          <p className="text-gray-500 font-medium">Administra categorías, platillos y combos</p>
        </div>

        <div className="flex p-1 space-x-1 bg-gray-100/80 backdrop-blur-md rounded-xl border border-gray-200/60 shadow-inner">
          <button
            onClick={() => setTabActual('productos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
              tabActual === 'productos'
              ? 'bg-white shadow-md text-primary-700 transform scale-[1.02]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <List size={18} /> Platillos
          </button>
          <button
            onClick={() => setTabActual('categorias')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
              tabActual === 'categorias'
              ? 'bg-white shadow-md text-primary-700 transform scale-[1.02]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <Folder size={18} /> Categorías
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
              onClick={() => { setEditandoProducto(null); setShowProductoModal(true); }}
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
                  <div className="h-px bg-gradient-to-r from-gray-200 to-transparent flex-1 mt-1" />
                </div>

                {prods.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {prods.map((producto) => (
                      <ProductoCard
                        key={producto.id}
                        producto={producto}
                        formatearPrecio={formatearPrecio}
                        tasaBCV={tasaBCV}
                        onEditar={(p) => { setEditandoProducto(p); setShowProductoModal(true); }}
                        onEliminar={eliminarProducto}
                      />
                    ))}
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
                onClick={() => { setEditandoProducto(null); setShowProductoModal(true); }}
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
              onClick={() => { setEditandoCategoria(null); setShowCategoriaModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 font-semibold transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus size={20} />
              Nueva Categoría
            </button>
          </div>

          <CategoriaTable
            categorias={categorias}
            onEditar={(c) => { setEditandoCategoria(c); setShowCategoriaModal(true); }}
            onEliminar={eliminarCategoria}
          />
        </div>
      )}

      <CategoriaModal
        show={showCategoriaModal}
        categoria={editandoCategoria}
        onClose={() => { setShowCategoriaModal(false); setEditandoCategoria(null); }}
        onSave={handleSaveCategoria}
      />

      <ProductoModal
        show={showProductoModal}
        producto={editandoProducto}
        categorias={categorias}
        fileInputRef={fileInputRef}
        onClose={() => { setShowProductoModal(false); setEditandoProducto(null); }}
        onSave={handleSaveProducto}
        onImagenChange={handleImagenChange}
        onEliminarImagen={eliminarImagen}
      />
    </div>
  );
}
