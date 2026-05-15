import { useState, useEffect } from 'react';
import { LogIn, Delete, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const { login } = useAuth();
  const { error: showError } = useToast();

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!usuario.trim()) {
      setError('Ingresa el usuario');
      return;
    }
    if (pin.length !== 4) {
      setError('Ingresa los 4 dígitos del PIN');
      return;
    }

    setLoading(true);
    const result = await login(usuario, pin);
    setLoading(false);

    if (!result.success) {
      setError(result.message || 'Credenciales incorrectas');
      setPin('');
      showError(result.message || 'Credenciales incorrectas');
    } else if (usuario.toLowerCase() === 'demo') {
      localStorage.setItem('modo_demo', 'true');
    }
  };

  const handleDemoLogin = async () => {
    setUsuario('demo');
    setPin('0000');
    setLoading(true);
    const result = await login('demo', '0000');
    setLoading(false);
    if (result.success) {
      localStorage.setItem('modo_demo', 'true');
    }
  };

  useEffect(() => {
    if (pin.length === 4 && usuario.trim()) {
      handleSubmit();
    }
  }, [pin]);

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-sm my-auto py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl">
            <span className="text-primary-600 text-4xl font-bold">R</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sistema Restaurante</h1>
          <p className="text-primary-200">Ingresa tus credenciales</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value);
                  setError('');
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${
                  error && !usuario.trim() ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Tu usuario"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">PIN</label>
            <div className={`flex justify-center gap-4 mb-4 ${error ? 'animate-shake' : ''}`}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                    pin[i]
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : error
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <span className={`text-2xl font-bold ${pin[i] ? 'text-white' : 'text-gray-400'}`}>
                    {pin[i] ? '●' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm mb-4">{error}</p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(String(digit))}
                className="h-14 bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold text-gray-700 transition-colors btn-press"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="h-14 bg-gray-200 hover:bg-gray-300 rounded-xl text-gray-600 transition-colors btn-press"
            >
              <Delete size={20} className="mx-auto" />
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="h-14 bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold text-gray-700 transition-colors btn-press"
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="h-14 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 rounded-xl text-white transition-colors btn-press"
            >
              <LogIn size={20} className="mx-auto" />
            </button>
          </div>

          <div className="mt-4">
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl transition-colors btn-press flex items-center justify-center gap-2"
            >
              <span>🎮</span>
              Modo Capacitación / Demo
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showCredentials ? <EyeOff size={14} /> : <Eye size={14} />}
              {showCredentials ? 'Ocultar' : 'Mostrar'} credenciales de prueba
            </button>
            {showCredentials && (
              <p className="text-center text-gray-500 text-xs mt-2">
                <span className="font-mono">dueno / 0000</span> | <span className="font-mono">admin / 1234</span><br />
                <span className="font-mono">gerente / 1111</span> | <span className="font-mono">caja1 / 2222</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
