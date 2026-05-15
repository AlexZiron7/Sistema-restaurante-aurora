import { Printer } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export default function TicketPrinter({ pedidoId, mesaNumero, className = '' }) {
  const { success, error } = useToast();

  const imprimirTicket = async () => {
    try {
      const ticket = await api.getTicket(pedidoId);
      
      if (!ticket || !ticket.items) {
        error('No se pudo obtener el ticket');
        return;
      }

      const ticketText = generarTextoTicket(ticket);
      
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket - Mesa ${escapeHtml(String(mesaNumero))}</title>
          <style>
            @page { margin: 0; size: 58mm auto; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              width: 58mm; 
              margin: 0; 
              padding: 5px;
              box-sizing: border-box;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total { font-weight: bold; font-size: 14px; }
            .center { text-align: center; }
            .footer { text-align: center; margin-top: 10px; }
            @media print { body { width: 58mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <strong>AURORA RES</strong>
          </div>
          <div class="divider"></div>
          <div class="row"><span>Mesa:</span><span>#${escapeHtml(String(mesaNumero))}</span></div>
          <div class="row"><span>Fecha:</span><span>${escapeHtml(ticket.fecha)}</span></div>
          <div class="row"><span>Mesonero:</span><span>${escapeHtml(ticket.mesonero_nombre)}</span></div>
          <div class="divider"></div>
          ${ticket.items.map(item => `
            <div class="row">
              <span>${escapeHtml(item.nombre_producto)}</span>
              <span>$${parseFloat(item.precio).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="row"><span>Subtotal:</span><span>$${parseFloat(ticket.total || 0).toFixed(2)}</span></div>
          <div class="row"><span>Propina ${ticket.propina ? Math.round(ticket.propina / ticket.total * 100) + '%' : '0%'}:</span><span>$${parseFloat(ticket.propina || 0).toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="row total">
            <span>TOTAL:</span>
            <span>$${parseFloat((ticket.total || 0) + (ticket.propina || 0)).toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div class="footer">
            ¡Gracias por su visita!
          </div>
          <script>window.print(); window.close();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
      success('Ticket enviado a imprimir');
    } catch (err) {
      error('Error al imprimir ticket');
    }
  };

  const generarTextoTicket = (ticket) => {
    let texto = `
================================
         AURORA RES
================================
Mesa: #${mesaNumero}
Fecha: ${ticket.fecha}
Mesonero: ${ticket.mesonero_nombre}
================================
`;
    ticket.items.forEach(item => {
      texto += `${item.nombre_producto.padEnd(15)} $${parseFloat(item.precio).toFixed(2)}\n`;
    });
    texto += `================================
Subtotal:            $${parseFloat(ticket.total || 0).toFixed(2)}
Propina ${ticket.propina ? Math.round(ticket.propina / ticket.total * 100) + '%' : '0%'}:          $${parseFloat(ticket.propina || 0).toFixed(2)}
================================
TOTAL:               $${parseFloat((ticket.total || 0) + (ticket.propina || 0)).toFixed(2)}
================================
       ¡Gracias por su visita!
================================
`;
    return texto;
  };

  return (
    <button
      onClick={imprimirTicket}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors btn-press ${className}`}
    >
      <Printer size={18} />
      Imprimir Ticket
    </button>
  );
}
