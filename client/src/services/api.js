const API_URL = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Error del servidor (${res.status})`);
  }
  return res.json();
}

export const api = {
  async login(usuario, pin) {
    return request('/auth/login', {
      method: 'POST', body: JSON.stringify({ usuario, pin })
    });
  },

  async getMesas() { return request('/mesas'); },

  async crearMesa(numero_mesa, capacidad) {
    return request('/mesas', {
      method: 'POST', body: JSON.stringify({ numero_mesa, capacidad })
    });
  },

  async actualizarMesa(id, numero_mesa, capacidad) {
    return request(`/mesas/${id}`, {
      method: 'PUT', body: JSON.stringify({ numero_mesa, capacidad })
    });
  },

  async eliminarMesa(id) {
    return request(`/mesas/${id}`, { method: 'DELETE' });
  },

  async updateEstadoMesa(id, estado) {
    return request(`/mesas/${id}/estado`, {
      method: 'POST', body: JSON.stringify({ estado })
    });
  },

  async getPedidoMesa(id) { return request(`/mesas/${id}/pedido`); },

  async crearPedido(id_mesa, id_mesonero, items) {
    return request('/pedidos', {
      method: 'POST', body: JSON.stringify({ id_mesa, id_mesonero, items })
    });
  },

  async agregarItemsPedido(id_pedido, items) {
    return request(`/pedidos/${id_pedido}/items`, {
      method: 'POST', body: JSON.stringify({ items })
    });
  },

  async quitarItemPedido(id_pedido, itemId) {
    return request(`/pedidos/${id_pedido}/items/${itemId}`, { method: 'DELETE' });
  },

  async cerrarMesa(id, porcentaje_propina) {
    return request(`/mesas/${id}/cerrar`, {
      method: 'POST', body: JSON.stringify({ porcentaje_propina })
    });
  },

  async getTicket(pedidoId) { return request(`/pedidos/${pedidoId}/ticket`); },
  async getTasaBCV() { return request('/tasa-bcv'); },

  async actualizarTasaBCV() {
    return request('/tasa-bcv/actualizar', { method: 'POST' });
  },

  async getConfig() { return request('/config'); },

  async updateConfig(clave, valor) {
    return request('/config', {
      method: 'POST', body: JSON.stringify({ clave, valor })
    });
  },

  async getUsuarios() { return request('/usuarios'); },
  async getUsuario(id) { return request(`/usuarios/${id}`); },

  async crearUsuario(data) {
    return request('/usuarios', {
      method: 'POST', body: JSON.stringify(data)
    });
  },

  async actualizarUsuario(id, data) {
    return request(`/usuarios/${id}`, {
      method: 'PUT', body: JSON.stringify(data)
    });
  },

  async eliminarUsuario(id) {
    return request(`/usuarios/${id}`, { method: 'DELETE' });
  },

  async getCategorias() { return request('/categorias'); },
  async getAdminCategorias() { return request('/admin/categorias'); },

  async crearCategoria(data) {
    return request('/categorias', {
      method: 'POST', body: JSON.stringify(data)
    });
  },

  async actualizarCategoria(id, data) {
    return request(`/categorias/${id}`, {
      method: 'PUT', body: JSON.stringify(data)
    });
  },

  async eliminarCategoria(id) {
    return request(`/categorias/${id}`, { method: 'DELETE' });
  },

  async subirImagenProducto(id, file) {
    const formData = new FormData();
    formData.append('imagen', file);
    const res = await fetch(`${API_URL}/productos/${id}/imagen`, { method: 'POST', body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Error al subir imagen');
    }
    return res.json();
  },

  async eliminarImagenProducto(id) {
    return request(`/productos/${id}/imagen`, { method: 'DELETE' });
  },

  async getProductos() { return request('/productos'); },

  async crearProducto(data) {
    return request('/productos', {
      method: 'POST', body: JSON.stringify(data)
    });
  },

  async actualizarProducto(id, data) {
    return request(`/productos/${id}`, {
      method: 'PUT', body: JSON.stringify(data)
    });
  },

  async eliminarProducto(id) {
    return request(`/productos/${id}`, { method: 'DELETE' });
  },

  async importarProductos(productos) {
    return request('/productos/importar', {
      method: 'POST', body: JSON.stringify({ productos })
    });
  },

  async getStatsHoy() { return request('/stats/hoy'); },
  async getStatsSemana() { return request('/stats/semana'); },
  async getStatsMesoneros() { return request('/stats/mesoneros'); },
  async getStatsProductos(desde, hasta) {
    const params = new URLSearchParams({ desde, hasta });
    return request(`/stats/productos?${params}`);
  },

  async getMesoneros() { return request('/mesoneros'); },

  async getHistorialMesonero(id, { desde, hasta } = {}) {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    return request(`/mesoneros/${id}/historial?${params}`);
  },

  async getHistorial({ desde, hasta, metodo = 'todos', limit = 20, offset = 0 } = {}) {
    const hoy = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({ desde: desde || hoy, hasta: hasta || hoy, metodo, limit, offset });
    return request(`/pedidos/historial?${params}`);
  },

  async getPedidoDetalle(id) { return request(`/pedidos/${id}/detalle`); },

  async getReporteVentas(desde, hasta) {
    const params = new URLSearchParams({ desde, hasta });
    return request(`/reportes/ventas?${params}`);
  },

  async getReporteProductos(desde, hasta) {
    const params = new URLSearchParams({ desde, hasta });
    return request(`/reportes/productos?${params}`);
  },

  async getReporteMesoneros(desde, hasta) {
    const params = new URLSearchParams({ desde, hasta });
    return request(`/reportes/mesoneros?${params}`);
  },

  async getMiHistorial(idUsuario, desde, hasta) {
    const params = new URLSearchParams({ id_usuario: idUsuario });
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    return request(`/mesoneros/mi-historial?${params}`);
  },

  async getCocinaPedidosPendientes() {
    return request('/cocina/pedidos-pendientes');
  },

  async marcarPedidoListo(idMesa) {
    return request(`/cocina/mesas/${idMesa}/listo`, { method: 'POST' });
  },

  async cobrarMesa(id, metodo_pago, datos_pago) {
    return request(`/mesas/${id}/cobrar`, {
      method: 'POST', body: JSON.stringify({ metodo_pago, datos_pago })
    });
  },

  async getBackups() { return request('/backups'); },
  async crearBackup() { return request('/backups', { method: 'POST' }); },
  async restaurarBackup(filename) { return request(`/backups/restore/${filename}`, { method: 'POST' }); },
  async eliminarBackup(filename) { return request(`/backups/${filename}`, { method: 'DELETE' }); },

  async getUpdatesCheck() { return request('/updates/check'); },
  async instalarUpdate(url) {
    return request('/updates/install', {
      method: 'POST', body: JSON.stringify({ url })
    });
  },
};

export const ROLES = {
  dueno: { label: 'Dueño', nivel: 1, color: 'purple' },
  admin: { label: 'Administrador', nivel: 2, color: 'red' },
  gerente: { label: 'Gerente', nivel: 3, color: 'blue' },
  cajero: { label: 'Cajero', nivel: 4, color: 'green' },
  cocina: { label: 'Cocina', nivel: 5, color: 'orange' },
  mesonero: { label: 'Mesonero', nivel: 6, color: 'gray' }
};

export const puedeGestionarUsuarios = (rol) => ['dueno', 'admin'].includes(rol);
export const puedeGestionarMenu = (rol) => ['dueno', 'admin', 'gerente'].includes(rol);
export const puedeVerConfig = (rol) => ['dueno', 'admin'].includes(rol);
export const puedeCobrar = (rol) => ['dueno', 'admin', 'gerente', 'cajero'].includes(rol);
export const puedeVerStats = (rol) => ['dueno', 'admin', 'gerente'].includes(rol);
export const puedeCrearPedidos = (rol) => ['dueno', 'admin', 'gerente', 'cajero', 'mesonero'].includes(rol);

export const formatearPrecio = (usd, tasa, mostrarUSD = true, mostrarBS = true) => {
  if (!tasa || tasa === 0) {
    return mostrarUSD ? `$${usd.toFixed(2)}` : '';
  }
  const bs = usd * tasa;
  const bsFormateado = bs.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  let resultado = '';
  if (mostrarUSD) resultado += `$${usd.toFixed(2)}`;
  if (mostrarUSD && mostrarBS) resultado += '\n';
  if (mostrarBS) resultado += `Bs. ${bsFormateado}`;
  return resultado;
};
