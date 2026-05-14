import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, UtensilsCrossed, Receipt, ChefHat, LayoutGrid, DollarSign, History, Settings, Users } from 'lucide-react';

const SECCIONES = [
  {
    id: 'inicio',
    icon: LayoutGrid,
    color: 'bg-indigo-100 text-indigo-600',
    titulo: '¿Cómo funciona el sistema?',
    contenido: `El Sistema de Restaurante es una herramienta digital para gestionar las mesas, pedidos, cocina y caja de tu negocio en tiempo real.

**¿Cómo instalar en tablets y teléfonos?**
1. Conecta la tablet/teléfono al mismo WiFi que la computadora principal.
2. Abre el navegador (Chrome o Safari) y entra a la dirección que te muestra la consola al iniciar el servidor (ej: \`http://192.168.1.x:5173\`).
3. Te aparecerá un mensaje inferior o en el menú del navegador la opción de **"Instalar aplicación"** o **"Añadir a pantalla de inicio"**. Al hacerlo, funcionará como una App nativa.

Todos los dispositivos se sincronizan automáticamente. Los cambios que hace un mesonero se ven al instante en la cocina y en la caja.

**Roles del sistema:**
• 🧑‍💼 Dueño / Admin: Acceso total, configuración, estadísticas
• 👨‍💼 Gerente: Reportes, menú y gestión de personal
• 💰 Cajero: Cobros, historial de caja
• 🧑‍🍳 Mesonero: Mesas y pedidos`
  },
  {
    id: 'mesas',
    icon: LayoutGrid,
    color: 'bg-emerald-100 text-emerald-600',
    titulo: 'Manejo de Mesas',
    contenido: `Las tarjetas de mesa muestran el estado con un color y un botón de acción en la parte inferior.

**Estados de las mesas:**
🟢 **Libre** — La mesa está disponible. Presiona "Nuevo Pedido" para comenzar.
🔴 **Ocupada** — Hay un pedido activo. Presiona "Pedir la Cuenta" cuando el cliente quiera pagar.
🔵 **Atendida** — La cocina terminó de preparar los platos.
🟣 **Cuenta** — El mesero cerró la cuenta. La caja la está procesando.
🟡 **Limpiando** — Ya se cobró. Limpia la mesa y presiona "Marcar como Limpia".

**Para abrir un pedido:** toca la tarjeta verde o el botón "Nuevo Pedido".
**Para pedir la cuenta:** toca el botón rojo "Pedir la Cuenta" en la tarjeta.`
  },
  {
    id: 'pedidos',
    icon: UtensilsCrossed,
    color: 'bg-rose-100 text-rose-600',
    titulo: 'Crear y Agregar Pedidos',
    contenido: `Al abrir un pedido se muestra el menú por categorías.

**Pasos para tomar un pedido:**
1. Toca la mesa libre (verde) en la pantalla de Mesas
2. Se abre el menú — puedes filtrar para mostrar solo los **Combos** o las demás categorías.
3. Para ver qué incluye un Combos o plato, puedes usar el botón redondito de info (ℹ️).
4. Si el cliente pide algo especial, toca el ícono de nota 📝 en los items que agregaste.
5. Presiona "Enviar Pedido" — llegará automáticamente a la cocina

**Agregar más items a una mesa ocupada:**
• Toca la mesa (aunque esté ocupada/atendida)
• Usa el mismo menú con los items ya pedidos mostrándose a la derecha.
• Agrega más items y presiona "Agregar al Pedido"

Los items nuevos llegarán a la cocina en tiempo real.`
  },
  {
    id: 'cocina',
    icon: ChefHat,
    color: 'bg-orange-100 text-orange-600',
    titulo: 'Pantalla de Cocina',
    contenido: `La cocina muestra todas las mesas con pedidos pendientes, ordenadas por hora de llegada.

**Funciones:**
• Cada tarjeta muestra el número de mesa y los items a preparar
• Las notas especiales aparecen en amarillo 📝
• Cuando todos los platos están listos, presiona **"Listo"** — la mesa pasa a estado "Atendida"

**El botón de descarte (🗑️):** oculta temporalmente una mesa de la vista de cocina (en caso de error o pedido cancelado). Vuelve a aparecer si llega un item nuevo.

La pantalla se actualiza automáticamente cuando llegan pedidos nuevos.`
  },
  {
    id: 'caja',
    icon: Receipt,
    color: 'bg-violet-100 text-violet-600',
    titulo: 'Pantalla de Caja',
    contenido: `La caja recibe alertas cuando un mesero cierra la cuenta de una mesa.

**Proceso de cobro:**
1. Las mesas moradas (Por Cobrar) aparecen destacadas en la parte superior
2. Toca la mesa para ver el detalle del pedido
3. Selecciona el **método de pago**:
   • 💵 Efectivo (dólares físicos)
   • 📱 Pago Móvil (transferencias en bolívares)
   • 💳 Tarjeta (débito/crédito)
   • 🌐 Zelle
   • 💰 Zinli
4. Presiona **"Cobrar"** — la mesa pasa a "Limpiando"

El mesonero verá la mesa en amarillo y sabrá que debe limpiarla para liberarla.`
  },
  {
    id: 'historial',
    icon: History,
    color: 'bg-indigo-100 text-indigo-600',
    titulo: 'Historial de Pedidos',
    contenido: `El historial guarda todos los pedidos completados (pagados).

**Filtros disponibles:**
• Por rango de fechas (Desde / Hasta)
• Por método de pago

**Para ver el detalle de un pedido:** toca cualquier fila — se expande mostrando todos los items y la hora exacta del cobro.

El historial es ideal para:
• Cuadrar caja al final del turno
• Verificar un cobro específico
• Revisar el movimiento de cualquier día pasado

Solo visible para cajeros, gerentes y administradores.`
  },
  {
    id: 'dashboard',
    icon: DollarSign,
    color: 'bg-teal-100 text-teal-600',
    titulo: 'Dashboard y Estadísticas',
    contenido: `El Dashboard muestra un resumen del negocio en tiempo real.

**KPIs del día (Admin/Gerente):**
• 💰 Ingresos totales del día
• 📦 Número de pedidos cobrados
• 🍽️ Mesas atendidas
• 📊 Ticket promedio por pedido

**Gráfico semanal:** muestra la tendencia de ingresos de los últimos 7 días.

**Métodos de pago:** distribución visual de cómo pagaron los clientes hoy.

**Ranking de mesoneros:** quién generó más ventas en el día.

Este módulo es solo visible para roles de Gerente, Administrador y Dueño.`
  },
  {
    id: 'admin',
    icon: Settings,
    color: 'bg-gray-100 text-gray-600',
    titulo: 'Administración del Sistema',
    contenido: `El módulo de Admin (solo Admin y Dueño) permite:

**Usuarios:**
• Crear, editar y desactivar cuentas de meseros, cajeros y gerentes
• Cambiar PINs de acceso

**Menú:**
• Agregar y editar categorías
• Crear productos con nombre, precio, descripción e imagen.
• Activar/desactivar items temporalmente (por ejemplo si se acabó un plato)
• **NUEVO:** Crear **Combos**. Habilita la opción "Es un combo", elige qué productos del menú incluye y asígnale un precio especial de promoción.

**Configuración:**
• Tasa BCV (para mostrar precios en Bs)
• Nombre del restaurante
• Configurar WhatsApp y correo de soporte

**Consejo:** Si cambias los precios de la carta, los pedidos ya abiertos mantienen el precio original — los cambios solo afectan pedidos nuevos.`
  },
];

export default function ManualPage() {
  const [abierto, setAbierto] = useState('inicio');

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200">
            <BookOpen size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Manual de Usuario</h1>
            <p className="text-xs text-gray-400">Guía rápida del sistema de restaurante</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
        <div className="space-y-2">
          {SECCIONES.map(seccion => {
            const Icon = seccion.icon;
            const isOpen = abierto === seccion.id;
            return (
              <div key={seccion.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setAbierto(isOpen ? null : seccion.id)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl ${seccion.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <span className="font-bold text-gray-800 flex-1 text-sm">{seccion.titulo}</span>
                  {isOpen
                    ? <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                    : <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
                  }
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <div className="pt-3 text-sm text-gray-600 leading-relaxed space-y-2">
                      {seccion.contenido.split('\n').map((linea, i) => {
                        if (linea.trim() === '') return <div key={i} className="h-1" />;
                        if (linea.startsWith('**') && linea.endsWith('**')) {
                          return <p key={i} className="font-bold text-gray-800 mt-3">{linea.replace(/\*\*/g, '')}</p>;
                        }
                        if (linea.startsWith('•')) {
                          return <p key={i} className="pl-4">{linea}</p>;
                        }
                        // Inline bold
                        const parts = linea.split(/(\*\*[^*]+\*\*)/g);
                        return (
                          <p key={i}>
                            {parts.map((part, pi) =>
                              part.startsWith('**') && part.endsWith('**')
                                ? <strong key={pi} className="text-gray-800">{part.replace(/\*\*/g, '')}</strong>
                                : part
                            )}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl border border-sky-100 p-4 text-center">
          <p className="text-sm text-sky-700 font-medium">¿Tienes dudas adicionales?</p>
          <p className="text-xs text-sky-500 mt-1">Visita la página de Soporte para contactarnos directamente</p>
          <a
            href="/soporte"
            className="inline-block mt-3 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Ir a Soporte →
          </a>
        </div>
      </div>
    </div>
  );
}
