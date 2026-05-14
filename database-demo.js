const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'restaurante-demo.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.log('📦 Creando base de datos demo...');
    } else {
        console.log('✅ Base de datos demo conectada.');
    }
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE NOT NULL,
        pin_acceso TEXT NOT NULL,
        nombre TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'mesonero',
        estado_activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS mesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_mesa INTEGER NOT NULL UNIQUE,
        estado TEXT DEFAULT 'libre',
        capacidad INTEGER DEFAULT 4
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_mesa INTEGER NOT NULL,
        id_mesonero INTEGER NOT NULL,
        estado TEXT DEFAULT 'abierto',
        total REAL DEFAULT 0,
        propina REAL DEFAULT 0,
        porcentaje_propina REAL DEFAULT 0,
        metodo_pago TEXT DEFAULT NULL,
        datos_pago TEXT DEFAULT NULL,
        numero_mesa INTEGER DEFAULT NULL,
        nombre_mesonero TEXT DEFAULT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_cierre DATETIME DEFAULT NULL,
        FOREIGN KEY(id_mesa) REFERENCES mesas(id),
        FOREIGN KEY(id_mesonero) REFERENCES usuarios(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS items_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_pedido INTEGER NOT NULL,
        nombre_producto TEXT NOT NULL,
        notas_especiales TEXT,
        precio REAL NOT NULL,
        estado TEXT DEFAULT 'en_cocina',
        FOREIGN KEY(id_pedido) REFERENCES pedidos(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clave TEXT UNIQUE NOT NULL,
        valor TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        icono TEXT DEFAULT '🍽️',
        activo INTEGER DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT DEFAULT '',
        precio_usd REAL NOT NULL,
        id_categoria INTEGER,
        activo INTEGER DEFAULT 1,
        es_combo INTEGER DEFAULT 0,
        productos_incluidos TEXT DEFAULT NULL,
        precio_combo REAL DEFAULT NULL,
        imagen TEXT DEFAULT NULL,
        FOREIGN KEY(id_categoria) REFERENCES categorias(id)
    )`);

    // Verificar si ya hay datos
    db.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
        if (row && row.count === 0) {
            // Insertar usuarios demo
            db.run(`INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES ('dueno', '0000', 'Dueño Demo', 'dueno')`);
            db.run(`INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES ('admin', '1234', 'Admin Demo', 'admin')`);
            db.run(`INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES ('gerente', '1111', 'Gerente Demo', 'gerente')`);
            db.run(`INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES ('caja1', '2222', 'Caja Demo', 'cajero')`);
            db.run(`INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES ('mesonero1', '3333', 'Carlos Mesonero', 'mesonero')`);
            db.run(`INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES ('mesonero2', '4444', 'Ana Mesonera', 'mesonero')`);
            db.run(`INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES ('mesonero3', '5555', 'Pedro Mesonero', 'mesonero')`);
            db.run(`INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES ('demo', '0000', 'Usuario Demo', 'admin')`);
            
            // Insertar mesas con diferentes estados
            db.run(`INSERT INTO mesas (numero_mesa, estado, capacidad) VALUES (1, 'libre', 4)`);
            db.run(`INSERT INTO mesas (numero_mesa, estado, capacidad) VALUES (2, 'ocupada', 6)`);
            db.run(`INSERT INTO mesas (numero_mesa, estado, capacidad) VALUES (3, 'atendida', 4)`);
            db.run(`INSERT INTO mesas (numero_mesa, estado, capacidad) VALUES (4, 'libre', 8)`);
            db.run(`INSERT INTO mesas (numero_mesa, estado, capacidad) VALUES (5, 'cuenta', 2)`);
            db.run(`INSERT INTO mesas (numero_mesa, estado, capacidad) VALUES (6, 'libre', 4)`);
            db.run(`INSERT INTO mesas (numero_mesa, estado, capacidad) VALUES (7, 'limpiando', 6)`);
            db.run(`INSERT INTO mesas (numero_mesa, estado, capacidad) VALUES (8, 'libre', 10)`);
            db.run(`INSERT INTO mesas (numero_mesa, estado, capacidad) VALUES (9, 'ocupada', 4)`);
            db.run(`INSERT INTO mesas (numero_mesa, estado, capacidad) VALUES (10, 'libre', 4)`);
            
            // Insertar categorías
            db.run(`INSERT INTO categorias (nombre, icono) VALUES ('Bebidas', '🥤')`);
            db.run(`INSERT INTO categorias (nombre, icono) VALUES ('Entradas', '🥗')`);
            db.run(`INSERT INTO categorias (nombre, icono) VALUES ('Principales', '🍽️')`);
            db.run(`INSERT INTO categorias (nombre, icono) VALUES ('Postres', '🍰')`);
            db.run(`INSERT INTO categorias (nombre, icono) VALUES ('Combos', '🎁')`);
            
            // Insertar productos
            const productos = [
                ['Café americano', 2.50, 1], ['Café con leche', 3.00, 1], ['Jugo de naranja', 4.50, 1],
                ['Gaseosa', 2.50, 1], ['Cerveza', 5.00, 1],
                ['Ensalada César', 12.00, 2], ['Nachos', 10.00, 2], ['Sopa del día', 8.00, 2],
                ['Pasta Alfredo', 15.00, 3], ['Hamburguesa', 14.00, 3], ['Parrilla mixta', 25.00, 3],
                ['Tiramisú', 8.00, 4], ['Helado', 5.00, 4], ['Brownie', 7.00, 4],
                ['Combo Parrilla', 22.00, 5], ['Combo Pasta', 18.00, 5], ['Combo Familiar', 45.00, 5]
            ];
            
            const stmt = db.prepare(`INSERT INTO productos (nombre, precio_usd, id_categoria) VALUES (?, ?, ?)`);
            productos.forEach(([nombre, precio, cat]) => stmt.run(nombre, precio, cat));
            stmt.finalize();
            
            // Insertar pedidos de ejemplo
            // Pedido 1 - mesa 2 (ocupada)
            db.run(`INSERT INTO pedidos (id_mesa, id_mesonero, estado, total, nombre_mesonero, numero_mesa) VALUES (2, 5, 'abierto', 28.50, 'Carlos Mesonero', 2)`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (1, 'Hamburguesa', 14.00, 'en_cocina')`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (1, 'Jugo de naranja', 4.50, 'en_cocina')`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (1, 'Papas fritas', 5.00, 'en_cocina')`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (1, 'Cerveza', 5.00, 'en_cocina')`);
            
            // Pedido 2 - mesa 3 (atendida)
            db.run(`INSERT INTO pedidos (id_mesa, id_mesonero, estado, total, nombre_mesonero, numero_mesa) VALUES (3, 6, 'abierto', 18.00, 'Ana Mesonera', 3)`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (2, 'Pasta Alfredo', 15.00, 'listo')`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (2, 'Tiramisú', 8.00, 'listo')`);
            
            // Pedido 3 - mesa 5 (cuenta)
            db.run(`INSERT INTO pedidos (id_mesa, id_mesonero, estado, total, nombre_mesonero, numero_mesa) VALUES (5, 7, 'abierto', 45.00, 'Pedro Mesonero', 5)`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (3, 'Parrilla mixta', 25.00, 'listo')`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (3, 'Copa de vino', 8.00, 'listo')`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (3, 'Brownie', 7.00, 'listo')`);
            
            // Pedido 4 - mesa 9 (ocupada)
            db.run(`INSERT INTO pedidos (id_mesa, id_mesonero, estado, total, nombre_mesonero, numero_mesa) VALUES (9, 5, 'abierto', 15.00, 'Carlos Mesonero', 9)`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (4, 'Ensalada César', 12.00, 'en_cocina')`);
            db.run(`INSERT INTO items_pedido (id_pedido, nombre_producto, precio, estado) VALUES (4, 'Café con leche', 3.00, 'en_cocina')`);
            
            // Insertar config
            db.run(`INSERT INTO config (clave, valor) VALUES ('tasa_bcv', '471.50')`);
            db.run(`INSERT INTO config (clave, valor) VALUES ('mostrar_precios_bs', 'true')`);
            db.run(`INSERT INTO config (clave, valor) VALUES ('mostrar_precios_usd', 'true')`);
            db.run(`INSERT INTO config (clave, valor) VALUES ('nombre_restaurante', 'Restaurante Demo')`);
            
            console.log('✅ Datos demo insertados.');
        }
    });
});

module.exports = db;
