import { describe, it, expect } from 'vitest';
import request from 'supertest';
const { app } = require('../app');

describe('API Base', () => {
  it('GET /api/ping returns ok', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth', () => {
  it('POST /api/auth/login rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login rejects wrong PIN', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', pin: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login succeeds with admin PIN', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', pin: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.nombre).toBe('Administrador');
    expect(res.body.user.rol).toBe('admin');
  });

  it('POST /api/auth/login succeeds with mesonero PIN', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'mesonero1', pin: '3333' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.rol).toBe('mesonero');
  });
});

describe('Mesas', () => {
  it('GET /api/mesas returns all mesas', async () => {
    const res = await request(app).get('/api/mesas');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(10);
    expect(res.body[0].numero_mesa).toBe(1);
  });

  it('POST /api/mesas creates a new mesa', async () => {
    const res = await request(app).post('/api/mesas').send({ numero_mesa: 20, capacidad: 8 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/mesas rejects duplicate numero_mesa', async () => {
    const res = await request(app).post('/api/mesas').send({ numero_mesa: 1, capacidad: 4 });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/mesas/:id deletes libre mesa', async () => {
    const res = await request(app).delete('/api/mesas/2');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/mesas/:id returns 404 for non-existent mesa', async () => {
    const res = await request(app).delete('/api/mesas/999');
    expect(res.status).toBe(404);
  });
});

describe('Productos', () => {
  it('GET /api/productos returns active productos', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].nombre).toBeDefined();
  });

  it('POST /api/productos creates a producto', async () => {
    const res = await request(app).post('/api/productos').send({
      nombre: 'Jugo Natural', precio_usd: 4.00, id_categoria: 1
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/productos rejects missing name', async () => {
    const res = await request(app).post('/api/productos').send({ precio_usd: 5.00 });
    expect(res.status).toBe(400);
  });
});

describe('Categorias', () => {
  it('GET /api/categorias returns active categorias', async () => {
    const res = await request(app).get('/api/categorias');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);
    expect(res.body[0].nombre).toBe('Bebidas');
  });

  it('POST /api/categorias creates a categoria', async () => {
    const res = await request(app).post('/api/categorias').send({ nombre: 'TestCat', icono: '🍰' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Usuarios', () => {
  it('GET /api/usuarios returns users without PINs', async () => {
    const res = await request(app).get('/api/usuarios');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
    res.body.forEach(u => {
      expect(u.pin_acceso).toBe('****');
    });
  });

  it('POST /api/usuarios creates a user', async () => {
    const res = await request(app).post('/api/usuarios').send({
      usuario: 'testuser', pin: '5555', nombre: 'Test User', rol: 'mesonero'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/usuarios rejects invalid rol', async () => {
    const res = await request(app).post('/api/usuarios').send({
      usuario: 'bad', pin: '5555', nombre: 'Bad', rol: 'invalido'
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/usuarios rejects duplicate usuario', async () => {
    const res = await request(app).post('/api/usuarios').send({
      usuario: 'admin', pin: '5555', nombre: 'Dupe', rol: 'mesonero'
    });
    expect(res.status).toBe(400);
  });
});

describe('Config', () => {
  it('GET /api/config returns config object', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.nombre_restaurante).toBe('Mi Restaurante');
    expect(res.body.tasa_bcv).toBeDefined();
  });

  it('POST /api/config updates a config value', async () => {
    const res = await request(app).post('/api/config').send({ clave: 'nombre_restaurante', valor: 'Test' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Flujo completo: Pedido → Cerrar → Cobrar', () => {
  let pedidoId;

  it('POST /api/pedidos crea un pedido con items y mesa pasa a ocupada', async () => {
    const res = await request(app).post('/api/pedidos').send({
      id_mesa: 1,
      id_mesonero: 1,
      items: [
        { nombre: 'Café americano', precio: 2.50 },
        { nombre: 'Pasta Alfredo', precio: 15.00 }
      ]
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id_pedido).toBeDefined();
    pedidoId = res.body.id_pedido;

    const mesaRes = await request(app).get('/api/mesas');
    const mesa = mesaRes.body.find(m => m.id === 1);
    expect(mesa.estado).toBe('ocupada');
  });

  it('GET /api/mesas/:id/pedido returns order items', async () => {
    const res = await request(app).get('/api/mesas/1/pedido');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('POST /api/pedidos/:id/items adds more items', async () => {
    const res = await request(app).post(`/api/pedidos/${pedidoId}/items`).send({
      items: [{ nombre: 'Café con leche', precio: 3.00 }]
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/pedidos/:id/items/:itemId removes an item', async () => {
    const pedidoRes = await request(app).get('/api/mesas/1/pedido');
    const itemToDelete = pedidoRes.body[0];
    const res = await request(app).delete(`/api/pedidos/${pedidoId}/items/${itemToDelete.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/mesas/1/cerrar calculates total and tip', async () => {
    const res = await request(app).post('/api/mesas/1/cerrar').send({ porcentaje_propina: 10 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(18.00); // 15 + 3 (café deleted)
    expect(res.body.porcentaje_propina).toBe(10);
    expect(res.body.total_con_propina).toBe(19.80);
  });

  it('POST /api/mesas/1/cobrar completes payment', async () => {
    const res = await request(app).post('/api/mesas/1/cobrar').send({ metodo_pago: 'efectivo' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const mesaRes = await request(app).get('/api/mesas');
    const mesa = mesaRes.body.find(m => m.id === 1);
    expect(mesa.estado).toBe('limpiando');
  });

  it('GET /api/pedidos/:id/detalle returns full order', async () => {
    const res = await request(app).get(`/api/pedidos/${pedidoId}/detalle`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(pedidoId);
    expect(res.body.items.length).toBe(2);
  });
});

describe('Stats y Reportes', () => {
  it('GET /api/stats/hoy returns daily stats', async () => {
    const res = await request(app).get('/api/stats/hoy');
    expect(res.status).toBe(200);
    expect(res.body.total_pedidos).toBeDefined();
    expect(typeof res.body.ingresos_totales).toBe('number');
  });

  it('GET /api/stats/semana returns weekly data', async () => {
    const res = await request(app).get('/api/stats/semana');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/reportes/ventas returns sales report', async () => {
    const res = await request(app).get('/api/reportes/ventas');
    expect(res.status).toBe(200);
    expect(res.body.resumen).toBeDefined();
    expect(res.body.resumen.total_ventas).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/reportes/productos returns product report', async () => {
    const res = await request(app).get('/api/reportes/productos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.productos)).toBe(true);
  });

  it('GET /api/reportes/completo returns combined report', async () => {
    const res = await request(app).get('/api/reportes/completo');
    expect(res.status).toBe(200);
    expect(res.body.desde).toBeDefined();
    expect(res.body.hasta).toBeDefined();
    expect(res.body.ventas).toBeDefined();
    expect(res.body.ventas.total_ventas).toBeGreaterThanOrEqual(0);
    expect(res.body.ventas.cantidad).toBeGreaterThanOrEqual(0);
    expect(res.body.ventas.por_metodo).toBeDefined();
    expect(res.body.productos).toBeDefined();
    expect(Array.isArray(res.body.productos.items)).toBe(true);
    expect(res.body.mesoneros).toBeDefined();
    expect(Array.isArray(res.body.mesoneros.items)).toBe(true);
  });

  it('GET /api/reportes/completo filters by date range', async () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const hasta = manana.toISOString().split('T')[0];
    const res = await request(app).get(`/api/reportes/completo?desde=2099-01-01&hasta=${hasta}`);
    expect(res.status).toBe(200);
    expect(res.body.ventas.cantidad).toBe(0);
    expect(res.body.productos.items.length).toBe(0);
    expect(res.body.mesoneros.items.length).toBe(0);
  });
});

describe('Tasa BCV', () => {
  it('GET /api/tasa-bcv returns current rate', async () => {
    const res = await request(app).get('/api/tasa-bcv');
    expect(res.status).toBe(200);
    expect(res.body.tasa).toBeDefined();
  });
});
