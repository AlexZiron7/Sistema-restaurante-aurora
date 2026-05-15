import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
const { app } = require('../app');

let adminToken;
let mesoneroToken;

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('API Base', () => {
  it('GET /api/ping returns ok', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/productos returns 401 without token', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
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

  it('POST /api/auth/login succeeds and returns token', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', pin: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.token.length).toBeGreaterThan(0);
    expect(res.body.user.nombre).toBe('Administrador');
    expect(res.body.user.rol).toBe('admin');
    adminToken = res.body.token;
  });

  it('POST /api/auth/login succeeds with mesonero', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'mesonero1', pin: '3333' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    mesoneroToken = res.body.token;
  });

  it('POST /api/auth/login rejects invalid input format', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: [], pin: '1234' });
    expect(res.status).toBe(400);
  });
});

describe('Mesas', () => {
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', pin: '1234' });
    adminToken = res.body.token;
  });

  it('POST /api/auth/logout invalidates token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set(auth(adminToken));
    expect(res.status).toBe(200);

    const res2 = await request(app)
      .get('/api/mesas')
      .set(auth(adminToken));
    expect(res2.status).toBe(401);

    const refresh = await request(app).post('/api/auth/login').send({ usuario: 'admin', pin: '1234' });
    adminToken = refresh.body.token;
  });

  it('GET /api/mesas returns all mesas', async () => {
    const res = await request(app).get('/api/mesas').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].numero_mesa).toBe(1);
  });

  it('POST /api/mesas creates a new mesa', async () => {
    const res = await request(app).post('/api/mesas').set(auth(adminToken)).send({ numero_mesa: 20, capacidad: 8 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/mesas rejects duplicate numero_mesa', async () => {
    const res = await request(app).post('/api/mesas').set(auth(adminToken)).send({ numero_mesa: 1, capacidad: 4 });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/mesas/:id deletes libre mesa', async () => {
    const res = await request(app).delete('/api/mesas/2').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/mesas/:id returns 404 for non-existent mesa', async () => {
    const res = await request(app).delete('/api/mesas/999').set(auth(adminToken));
    expect(res.status).toBe(404);
  });
});

describe('Productos', () => {
  it('GET /api/productos returns active productos', async () => {
    const res = await request(app).get('/api/productos').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].nombre).toBeDefined();
  });

  it('POST /api/productos creates a producto', async () => {
    const res = await request(app).post('/api/productos').set(auth(adminToken)).send({
      nombre: 'Jugo Natural', precio_usd: 4.00, id_categoria: 1
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/productos rejects missing name', async () => {
    const res = await request(app).post('/api/productos').set(auth(adminToken)).send({ precio_usd: 5.00 });
    expect(res.status).toBe(400);
  });
});

describe('Categorias', () => {
  it('GET /api/categorias returns active categorias', async () => {
    const res = await request(app).get('/api/categorias').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  it('POST /api/categorias creates a categoria', async () => {
    const res = await request(app).post('/api/categorias').set(auth(adminToken)).send({ nombre: 'TestCat', icono: '🍰' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Usuarios', () => {
  it('GET /api/usuarios returns users without PINs', async () => {
    const res = await request(app).get('/api/usuarios').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
    res.body.forEach(u => {
      expect(u.pin_acceso).toBe('****');
    });
  });

  it('POST /api/usuarios creates a user', async () => {
    const res = await request(app).post('/api/usuarios').set(auth(adminToken)).send({
      usuario: 'testuser', pin: '5555', nombre: 'Test User', rol: 'mesonero'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/usuarios rejects invalid rol', async () => {
    const res = await request(app).post('/api/usuarios').set(auth(adminToken)).send({
      usuario: 'bad', pin: '5555', nombre: 'Bad', rol: 'invalido'
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/usuarios rejects duplicate usuario', async () => {
    const res = await request(app).post('/api/usuarios').set(auth(adminToken)).send({
      usuario: 'admin', pin: '5555', nombre: 'Dupe', rol: 'mesonero'
    });
    expect(res.status).toBe(400);
  });
});

describe('Config', () => {
  it('GET /api/config returns config object', async () => {
    const res = await request(app).get('/api/config').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.nombre_restaurante).toBe('Aurora RES');
    expect(res.body.tasa_bcv).toBeDefined();
  });

  it('POST /api/config updates a config value', async () => {
    const res = await request(app).post('/api/config').set(auth(adminToken)).send({ clave: 'nombre_restaurante', valor: 'Test' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Flujo completo: Pedido → Cerrar → Cobrar', () => {
  let pedidoId;

  it('POST /api/pedidos crea un pedido con items y mesa pasa a ocupada', async () => {
    const res = await request(app).post('/api/pedidos').set(auth(adminToken)).send({
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

    const mesaRes = await request(app).get('/api/mesas').set(auth(adminToken));
    const mesa = mesaRes.body.find(m => m.id === 1);
    expect(mesa.estado).toBe('ocupada');
  });

  it('GET /api/mesas/:id/pedido returns order items', async () => {
    const res = await request(app).get('/api/mesas/1/pedido').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('POST /api/pedidos/:id/items adds more items', async () => {
    const res = await request(app).post(`/api/pedidos/${pedidoId}/items`).set(auth(adminToken)).send({
      items: [{ nombre: 'Café con leche', precio: 3.00 }]
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/pedidos/:id/items/:itemId removes an item', async () => {
    const pedidoRes = await request(app).get('/api/mesas/1/pedido').set(auth(adminToken));
    const itemToDelete = pedidoRes.body[0];
    const res = await request(app).delete(`/api/pedidos/${pedidoId}/items/${itemToDelete.id}`).set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/mesas/1/cerrar calculates total and tip', async () => {
    const res = await request(app).post('/api/mesas/1/cerrar').set(auth(adminToken)).send({ porcentaje_propina: 10 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/mesas/1/cobrar completes payment', async () => {
    const res = await request(app).post('/api/mesas/1/cobrar').set(auth(adminToken)).send({ metodo_pago: 'efectivo' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const mesaRes = await request(app).get('/api/mesas').set(auth(adminToken));
    const mesa = mesaRes.body.find(m => m.id === 1);
    expect(mesa.estado).toBe('limpiando');
  });

  it('GET /api/pedidos/:id/detalle returns full order', async () => {
    const res = await request(app).get(`/api/pedidos/${pedidoId}/detalle`).set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(pedidoId);
    expect(res.body.items.length).toBe(2);
  });
});

describe('Stats y Reportes', () => {
  it('GET /api/stats/hoy returns daily stats', async () => {
    const res = await request(app).get('/api/stats/hoy').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.total_pedidos).toBeDefined();
    expect(typeof res.body.ingresos_totales).toBe('number');
  });

  it('GET /api/stats/semana returns weekly data', async () => {
    const res = await request(app).get('/api/stats/semana').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/reportes/ventas returns sales report', async () => {
    const res = await request(app).get('/api/reportes/ventas').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.resumen).toBeDefined();
    expect(res.body.resumen.total_ventas).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/reportes/completo returns combined report', async () => {
    const res = await request(app).get('/api/reportes/completo').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.ventas).toBeDefined();
    expect(res.body.productos).toBeDefined();
    expect(res.body.mesoneros).toBeDefined();
  });
});

describe('Tasa BCV', () => {
  it('GET /api/tasa-bcv returns current rate', async () => {
    const res = await request(app).get('/api/tasa-bcv').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.tasa).toBeDefined();
  });
});

describe('Cocina', () => {
  it('GET /api/cocina/pedidos-pendientes returns array', async () => {
    const res = await request(app).get('/api/cocina/pedidos-pendientes').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Backups', () => {
  it('GET /api/backups returns array', async () => {
    const res = await request(app).get('/api/backups').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/backups/restore with path traversal name returns 400', async () => {
    const res = await request(app).post('/api/backups/restore/..test.db').set(auth(adminToken));
    expect(res.status).toBe(400);
  });

  it('DELETE /api/backups with path traversal name returns 400', async () => {
    const res = await request(app).delete('/api/backups/..malicious').set(auth(adminToken));
    expect(res.status).toBe(400);
  });
});

describe('Seguridad - Rate Limiting', () => {
  it('Rate limiter allows normal login attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', pin: 'wrong' });
      expect(res.status).toBe(401);
    }
  });
});

describe('Seguridad - Rutas protegidas', () => {
  it('GET /api/usuarios returns 401 without token', async () => {
    const res = await request(app).get('/api/usuarios');
    expect(res.status).toBe(401);
  });

  it('POST /api/productos returns 401 without token', async () => {
    const res = await request(app).post('/api/productos').send({ nombre: 'test', precio_usd: 5 });
    expect(res.status).toBe(401);
  });

  it('POST /api/backups returns 401 without token', async () => {
    const res = await request(app).post('/api/backups');
    expect(res.status).toBe(401);
  });
});

describe('Seguridad - Path Traversal Backups', () => {
  it('Restore with path traversal name returns 400', async () => {
    const res = await request(app).post('/api/backups/restore/..test.db').set(auth(adminToken));
    expect(res.status).toBe(400);
  });

  it('Delete with path traversal name returns 400', async () => {
    const res = await request(app).delete('/api/backups/..malicious').set(auth(adminToken));
    expect(res.status).toBe(400);
  });
});
