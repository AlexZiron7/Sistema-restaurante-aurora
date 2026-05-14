import { useState, useEffect } from 'react';
import { HeadphonesIcon, MessageCircle, Mail, Phone, ExternalLink, Clock, CheckCircle } from 'lucide-react';

export default function SoportePage() {
  const [config, setConfig] = useState({ whatsapp_soporte: '+584121234567', email_soporte: 'soporte@aurora-devs.com' });
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(data => {
      if (data.whatsapp_soporte) setConfig(prev => ({ ...prev, whatsapp_soporte: data.whatsapp_soporte }));
      if (data.email_soporte) setConfig(prev => ({ ...prev, email_soporte: data.email_soporte }));
    }).catch(() => {});
  }, []);

  const whatsappUrl = `https://wa.me/${config.whatsapp_soporte.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    mensaje || '¡Hola! Necesito ayuda con el Sistema de Restaurante.'
  )}`;

  const emailUrl = `mailto:${config.email_soporte}?subject=${encodeURIComponent('Soporte - Sistema Restaurante')}&body=${encodeURIComponent(
    mensaje || 'Hola, necesito ayuda con el sistema.'
  )}`;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
            <HeadphonesIcon size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Soporte Técnico</h1>
            <p className="text-xs text-gray-400">Estamos aquí para ayudarte</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">

        {/* Banner de horario */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-4 text-white mb-5 shadow-lg shadow-teal-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold">Horario de Atención</div>
              <div className="text-white/80 text-sm">Lunes a Viernes · 9:00 AM – 6:00 PM</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="text-sm font-semibold">En línea</span>
            </div>
          </div>
        </div>

        {/* Mensaje personalizado */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <label className="text-sm font-bold text-gray-700 block mb-2">
            ¿En qué podemos ayudarte? <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            placeholder="Describe brevemente tu consulta o problema..."
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
          />
          <p className="text-xs text-gray-400 mt-1">
            Este mensaje se enviará automáticamente al abrir WhatsApp o el correo.
          </p>
        </div>

        {/* Canales de contacto */}
        <div className="space-y-3 mb-5">
          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-green-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-200 group-hover:scale-105 transition-transform">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800">WhatsApp</div>
              <div className="text-sm text-gray-500">{config.whatsapp_soporte}</div>
              <div className="text-xs text-green-600 font-semibold mt-0.5">Respuesta en minutos ⚡</div>
            </div>
            <ExternalLink size={18} className="text-gray-300 group-hover:text-green-400 transition-colors" />
          </a>

          {/* Email */}
          <a
            href={emailUrl}
            className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <Mail size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800">Correo Electrónico</div>
              <div className="text-sm text-gray-500">{config.email_soporte}</div>
              <div className="text-xs text-blue-600 font-semibold mt-0.5">Respuesta en 24 horas 📧</div>
            </div>
            <ExternalLink size={18} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
          </a>
        </div>

        {/* FAQ rápido */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">Preguntas Frecuentes</h3>
          <div className="space-y-2.5">
            {[
              { p: '¿Por qué no se actualiza la pantalla?', r: 'Verifica que el servidor esté encendido y que tengas conexión a la misma red WiFi.' },
              { p: '¿Cómo agrego un nuevo mesonero?', r: 'Ve a Admin → Usuarios → Crear Usuario. Asigna el rol "Mesonero" y un PIN de 4 dígitos.' },
              { p: '¿Cómo cambio el precio de un producto?', r: 'Ve a Admin → Menú → toca el producto → edita el precio. Solo afecta pedidos nuevos.' },
              { p: '¿Puedo recuperar un pedido eliminado?', r: 'Los pedidos se guardan siempre en el historial. Si fue pagado, aparece en Historial.' },
              { p: '¿El sistema funciona sin internet?', r: 'Funciona en red local (WiFi del restaurante). No requiere internet, excepto para la tasa BCV.' },
            ].map((faq, i) => (
              <div key={i} className="flex gap-2.5">
                <CheckCircle size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-gray-700">{faq.p}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{faq.r}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-xs text-gray-400">
          <p>Sistema de Restaurante · Desarrollado por <span className="font-semibold text-gray-500">Aurora Devs</span></p>
          <p className="mt-0.5">v2.0 · 2025</p>
        </div>
      </div>
    </div>
  );
}
