import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingBag, Check, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { SkeletonGrid } from '../components/Skeleton';

export default function PedidoModal({ isOpen, onClose, mesa }) {
  const { pedidoActual, agregarItemAlPedido, removerItemDelPedido, crearPedido, agregarItemsAPedido, limpiarPedido, getPedidoMesa, formatearPrecio } = useRestaurant();
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsExistentes, setItemsExistentes] = useState([]);
  const [pedidoIdExistente, setPedidoIdExistente] = useState(null);
  const [categoria, setCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [productoViendoInfo, setProductoViendoInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen, mesa]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        api.getProductos(),
        api.getCategorias()
      ]);
      setProductos(prodsData);
      setCategorias(catsData);
      
      if (mesa && (mesa.estado === 'ocupada' || mesa.estado === 'atendida')) {
        const items = await getPedidoMesa(mesa.id);
        setItemsExistentes(items);
        if (items.length > 0) {
          setPedidoIdExistente(items[0].pedido_id);
        } else {
          setPedidoIdExistente(null);
        }
      } else {
        setItemsExistentes([]);
        setPedidoIdExistente(null);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
    setLoading(false);
  };

  const filteredProductos = productos.filter(p => {
    const matchesBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    if (categoria === 'combos') return matchesBusqueda && p.es_combo === 1;
    if (categoria === 'todos') return matchesBusqueda;
    return matchesBusqueda && p.id_categoria === parseInt(categoria);
  });

  const handleAgregar = (producto) => {
    agregarItemAlPedido(producto);
  };

  const handleEnviarPedido = async () => {
    const nuevosItems = pedidoActual || [];
    
    if (nuevosItems.length === 0) {
      error('Agrega al menos un producto');
      return;
    }

    let result;
    if (pedidoIdExistente) {
      const itemsParaAPI = nuevosItems.map(item => ({
        nombre: item.nombre,
        precio: item.precio,
        notas: item.notas || ''
      }));
      result = await agregarItemsAPedido(pedidoIdExistente, itemsParaAPI);
      if (result.success) {
        success('Items agregados a la orden');
        limpiarPedido();
        onClose();
      } else {
        error('Error al agregar items');
      }
    } else {
      result = await crearPedido(mesa.id, user.id, nuevosItems);
      if (result.success) {
        success('Pedido enviado a cocina');
        limpiarPedido();
        onClose();
      } else {
        error('Error al crear el pedido');
      }
    }
  };

  const getPrecioDisplay = (producto) => {
    const precios = formatearPrecio(producto.precio_usd);
    if (precios.usd && precios.bs) {
      return (
        <div>
          <div className="text-primary-600 font-bold">${producto.precio_usd.toFixed(2)}</div>
          <div className="text-gray-400 text-xs">{precios.bs}</div>
        </div>
      );
    } else if (precios.usd) {
      return <div className="text-primary-600 font-bold">{precios.usd}</div>;
    } else if (precios.bs) {
      return <div className="text-primary-600 font-bold">{precios.bs}</div>;
    }
    return null;
  };

  if (!mesa) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pedido - Mesa ${mesa.numero_mesa}`} size="xl">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setCategoria('todos')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                categoria === 'todos'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setCategoria('combos')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border border-orange-200 ${
                categoria === 'combos'
                  ? 'bg-orange-500 text-white border-orange-600'
                  : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              }`}
            >
              🔥 Combos
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoria(cat.id.toString())}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  categoria === cat.id.toString()
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {loading ? (
            <SkeletonGrid items={6} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 pb-4">
              {filteredProductos.map((producto) => {
                const isCombo = producto.es_combo === 1;
                const hasInfo = Boolean(producto.descripcion || (isCombo && producto.productos_incluidos));
                
                return (
                <div
                  key={producto.id}
                  className="relative group bg-white border border-gray-200 hover:border-primary-300 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer active:scale-[0.98]"
                  onClick={() => handleAgregar(producto)}
                >
                  {isCombo && (
                    <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide shadow-sm z-10 transition-transform group-hover:scale-110">
                      Combo
                    </div>
                  )}
                  
                  {hasInfo && (
                    <div className="absolute top-1 left-1 z-20">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductoViendoInfo(producto);
                        }}
                        className="p-1 px-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-500 hover:text-blue-600 hover:shadow hover:bg-white transition-all border border-gray-100/50 flex items-center gap-1"
                        title="Ver detalles"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        <span className="text-[10px] font-bold">Info</span>
                      </button>
                    </div>
                  )}

                  <div className="h-24 bg-gray-50 flex items-center justify-center relative border-b border-gray-100 overflow-hidden">
                    {producto.imagen ? (
                      <img src={producto.imagen.startsWith('http') || producto.imagen.startsWith('data:') || producto.imagen.startsWith('/') ? producto.imagen : `/${producto.imagen}`} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 flex flex-col flex-1">
                    <div className="font-semibold text-gray-800 text-xs sm:text-sm leading-tight mb-2 line-clamp-2">{producto.nombre}</div>
                    <div className="mt-auto">
                      {getPrecioDisplay(producto)}
                    </div>
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>

        <div className="lg:w-80 bg-gray-50 rounded-xl p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag size={18} />
              Pedido
            </h3>
            <span className="text-sm text-gray-500">
              {(itemsExistentes.length + (pedidoActual?.length || 0))} items
            </span>
          </div>

          {itemsExistentes.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">En mesa</span>
                <span className="text-xs font-bold text-gray-600">
                  ${itemsExistentes.reduce((acc, i) => acc + Number(i.precio), 0).toFixed(2)}
                </span>
              </div>
              <div className="space-y-1 max-h-[120px] overflow-y-auto mb-2 bg-gray-100 rounded-lg p-2">
                {itemsExistentes.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs py-1 px-2 bg-white rounded">
                    <span className="text-gray-600">{item.nombre_producto}</span>
                    <span className="font-medium text-gray-800">${Number(item.precio).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pedidoActual && pedidoActual.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-green-600 uppercase">Nuevos items</span>
                <span className="text-xs font-bold text-green-600">
                  +${pedidoActual.reduce((acc, i) => acc + Number(i.precio), 0).toFixed(2)}
                </span>
              </div>
              <div className="space-y-1 max-h-[120px] overflow-y-auto mb-2">
                {pedidoActual.map((item) => {
                  const precios = formatearPrecio(item.precio);
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-green-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{item.nombre}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-600">
                          {precios?.usd || `$${item.precio.toFixed(2)}`}
                        </span>
                        <button
                          onClick={() => removerItemDelPedido(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded btn-press"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(!pedidoActual || pedidoActual.length === 0) && itemsExistentes.length === 0 && (
            <p className="text-gray-400 text-center py-4">Sin productos agregados</p>
          )}

          <div className="border-t pt-4 mt-auto">
            <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-xl p-3 border border-primary-100 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600">Total acumulado:</span>
                <span className="text-2xl font-black text-primary-600">
                  ${(itemsExistentes.reduce((acc, i) => acc + Number(i.precio), 0) + (pedidoActual?.reduce((acc, i) => acc + Number(i.precio), 0) || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleEnviarPedido}
              disabled={!pedidoActual || pedidoActual.length === 0}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors btn-press flex items-center justify-center gap-2"
            >
              <Check size={20} />
              {mesa.estado === 'libre' || mesa.estado === 'atendida' ? 'Enviar Pedido' : 'Agregar al Pedido'}
            </button>
          </div>
        </div>

        {/* Info Popover Overlay */}
        {productoViendoInfo && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm rounded-xl" onClick={() => setProductoViendoInfo(null)}>
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in"
              onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h4 className="font-bold text-gray-800 text-lg">{productoViendoInfo.nombre}</h4>
                <button onClick={() => setProductoViendoInfo(null)} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {productoViendoInfo.imagen && (
                <div className="h-48 w-full bg-gray-100">
                  <img src={productoViendoInfo.imagen} alt={productoViendoInfo.nombre} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-5">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {productoViendoInfo.es_combo === 1 ? 'Contenido del Combo' : 'Descripción / Detalles'}
                </h5>
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {productoViendoInfo.es_combo === 1 
                    ? productoViendoInfo.productos_incluidos 
                    : productoViendoInfo.descripcion}
                </p>
              </div>

              <div className="p-4 bg-gray-50 flex border-t border-gray-100">
                <button 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3 font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95" 
                  onClick={() => { 
                    handleAgregar(productoViendoInfo); 
                    setProductoViendoInfo(null);
                    success('Agregado al pedido');
                  }}
                >
                  <Plus size={18} /> Agregar este platillo
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
