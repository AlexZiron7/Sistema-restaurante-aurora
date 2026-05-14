import { useState, useEffect } from 'react';
import { Receipt, DollarSign, Percent, X, Check } from 'lucide-react';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useToast } from '../contexts/ToastContext';

export default function CerrarMesaModal({ isOpen, onClose, mesa }) {
  const { getPedidoMesa, cerrarMesa } = useRestaurant();
  const { success, error } = useToast();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propina, setPropina] = useState(0);
  const [customPropina, setCustomPropina] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (mesa && isOpen) {
      setLoading(true);
      getPedidoMesa(mesa.id).then(data => {
        setItems(data);
        setLoading(false);
      });
      setPropina(0);
      setCustomPropina('');
    }
  }, [mesa, isOpen]);

  const subtotal = items.reduce((acc, item) => acc + Number(item.precio), 0);
  const montoPropina = customPropina !== '' 
    ? subtotal * (Number(customPropina) / 100) 
    : subtotal * (propina / 100);
  const total = subtotal + montoPropina;

  const handlePropina = (pct) => {
    setPropina(pct);
    setCustomPropina('');
  };

  const handleCustomPropina = (value) => {
    setCustomPropina(value);
    setPropina(0);
  };

  const handleCerrarMesa = async () => {
    setEnviando(true);
    const porcentaje = customPropina !== '' ? Number(customPropina) : propina;
    const result = await cerrarMesa(mesa.id, porcentaje);
    setEnviando(false);

    if (result.success) {
      success(`Mesa ${mesa.numero_mesa} cerrada. Total: $${result.total_con_propina.toFixed(2)}`);
      onClose();
    } else {
      error('Error al cerrar la mesa');
    }
  };

  if (!isOpen || !mesa) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Receipt size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Cerrar Mesa {mesa.numero_mesa}</h2>
                <p className="text-white/80 text-sm">¿Dejaron propina?</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Items del pedido:</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-100">
                      <span className="text-gray-600">{item.nombre_producto}</span>
                      <span className="font-medium">${Number(item.precio).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona la propina:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[0, 10, 15, 20].map(pct => (
                    <button
                      key={pct}
                      onClick={() => handlePropina(pct)}
                      className={`py-3 rounded-xl font-bold transition-all btn-press ${
                        (propina === pct && customPropina === '') 
                          ? 'bg-primary-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pct === 0 ? '0%' : `${pct}%`}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Otra:</span>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="%"
                      value={customPropina}
                      onChange={(e) => handleCustomPropina(e.target.value)}
                      className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                    <span className="text-gray-500">%</span>
                    {customPropina && (
                      <span className="text-primary-600 font-medium">
                        = ${montoPropina.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border border-green-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-600 text-sm">Total a cobrar:</span>
                    <div className="text-sm text-green-600">
                      + ${montoPropina.toFixed(2)} de propina ({(customPropina || propina) || 0}%)
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    ${total.toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCerrarMesa}
                disabled={enviando}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all btn-press flex items-center justify-center gap-2 shadow-lg"
              >
                {enviando ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Check size={20} />
                    Confirmar y Cerrar Mesa
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
