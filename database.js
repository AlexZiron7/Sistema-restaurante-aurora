const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { runMigrations } = require('./server/db/migrate');

const isTestMode = process.env.VITEST_DB === 'memory';
const appRoot = process.pkg ? path.dirname(process.execPath) : __dirname;

// Base de datos principal
const dbPath = isTestMode ? ':memory:' : (process.env.DATABASE_PATH || path.resolve(appRoot, 'restaurante.db'));
const db = new sqlite3.Database(dbPath, (err) => {
    if (!isTestMode) {
        if (err) {
            console.error('Error al conectar con SQLite:', err.message);
        } else {
            console.log('✅ Base de datos SQLite conectada correctamente.');
        }
    }
});

// Base de datos demo
const dbDemoPath = isTestMode ? ':memory:' : (process.env.DATABASE_DEMO_PATH || path.resolve(appRoot, 'restaurante-demo.db'));
const dbDemo = new sqlite3.Database(dbDemoPath, (err) => {
    if (!isTestMode) {
        if (err) {
            console.log('📦 Creando base de datos demo...');
        } else {
            console.log('✅ Base de datos demo conectada.');
        }
    }
});

let dbActual = db;

function initDB(dbInstance, isDemo = false) {
    dbInstance.serialize(() => {
        dbInstance.run("PRAGMA foreign_keys = ON");
        dbInstance.run("PRAGMA journal_mode=WAL");

    dbInstance.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE NOT NULL,
        pin_acceso TEXT NOT NULL,
        nombre TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'mesonero',
        estado_activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    dbInstance.run(`CREATE TABLE IF NOT EXISTS mesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_mesa INTEGER NOT NULL UNIQUE,
        estado TEXT DEFAULT 'libre',
        capacidad INTEGER DEFAULT 4
    )`);

    dbInstance.run(`CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clave TEXT UNIQUE NOT NULL,
        valor TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    dbInstance.run(`CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        icono TEXT DEFAULT '🍽️',
        activo INTEGER DEFAULT 1
    )`);

    dbInstance.run(`CREATE TABLE IF NOT EXISTS pedidos (
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

    dbInstance.run(`CREATE TABLE IF NOT EXISTS items_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_pedido INTEGER NOT NULL,
        nombre_producto TEXT NOT NULL,
        notas_especiales TEXT,
        precio REAL NOT NULL,
        estado TEXT DEFAULT 'en_cocina',
        FOREIGN KEY(id_pedido) REFERENCES pedidos(id)
    )`);

    dbInstance.run(`CREATE TABLE IF NOT EXISTS productos (
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

    // --- Índices ---
    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_cierre ON pedidos(fecha_cierre)");
    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado)");
    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_items_pedido_id_pedido ON items_pedido(id_pedido)");
    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_productos_id_categoria ON productos(id_categoria)");

    // --- Usuarios Iniciales ---
    dbInstance.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
        if (row && row.count === 0) {
            const hash = (pin) => bcrypt.hashSync(pin, 10);
            
            if (isDemo) {
                // En DEMO creamos varios usuarios para pruebas
                dbInstance.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES (?, ?, ?, ?)", ['dueno', hash('0000'), 'Dueño Demo', 'dueno']);
                dbInstance.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES (?, ?, ?, ?)", ['admin', hash('1234'), 'Administrador Demo', 'admin']);
                dbInstance.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES (?, ?, ?, ?)", ['mesonero1', hash('3333'), 'Mesonero 1', 'mesonero']);
            } else {
                // En PRODUCCIÓN solo el dueño con pin inicial que debe cambiarse
                dbInstance.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES (?, ?, ?, ?)", ['dueno', hash('0000'), 'Dueño del Restaurante', 'dueno']);
            }
            
            for (let i = 1; i <= 10; i++) {
                dbInstance.run(`INSERT INTO mesas (numero_mesa) VALUES (${i})`);
            }
        }
    });

    // --- Datos de Negocio (Solo en DEMO) ---
    if (isDemo) {
        dbInstance.get("SELECT COUNT(*) as count FROM categorias", (err, row) => {
            if (row && row.count === 0) {
                dbInstance.run(`INSERT INTO categorias (nombre, icono) VALUES ('Bebidas', '🥤')`);
                dbInstance.run(`INSERT INTO categorias (nombre, icono) VALUES ('Entradas', '🥗')`);
                dbInstance.run(`INSERT INTO categorias (nombre, icono) VALUES ('Principales', '🍽️')`);
                dbInstance.run(`INSERT INTO categorias (nombre, icono) VALUES ('Postres', '🍰')`);
            }
        });

        dbInstance.get("SELECT COUNT(*) as count FROM productos", (err, row) => {
            if (row && row.count === 0) {
                const productos = [
                    ['Café americano', 2.50, 1, 'Café negro intenso preparado con granos seleccionados.'],
                    ['Café con leche', 3.00, 1, 'Equilibrio perfecto entre café expresso y leche cremosa.'],
                    ['Hamburguesa', 8.50, 3, 'Carne de res, queso, lechuga y tomate en pan artesanal.'],
                    ['Pizza Margarita', 12.00, 3, 'Salsa de tomate, mozzarella y albahaca fresca.'],
                    ['Tiramisú', 8.00, 4, 'Postre italiano clásico con mascarpone y café.'],
                ];
                const stmt = dbInstance.prepare(`INSERT INTO productos (nombre, precio_usd, id_categoria, descripcion) VALUES (?, ?, ?, ?)`);
                productos.forEach(p => stmt.run(...p));
                stmt.finalize();
            }
        });
    }

    // --- Configuración Global ---
    dbInstance.get("SELECT COUNT(*) as count FROM config", (err, row) => {
        if (row && row.count === 0) {
            dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('tasa_bcv', '0')`);
            dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('mostrar_precios_bs', 'true')`);
            dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('mostrar_precios_usd', 'true')`);
            dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('nombre_restaurante', 'Aurora RES')`);
            dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('whatsapp_soporte', '+584121234567')`);
            dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('email_soporte', 'soporte@aurora-devs.com')`);
        }
    });
    });
}

initDB(db, false); // Principal (vacía)
initDB(dbDemo, true); // Demo (con datos)

// Aplicar migraciones pendientes (silencioso en test mode)
runMigrations(db).catch(err => { if (!isTestMode) console.error('❌ Error en migraciones:', err.message); });
runMigrations(dbDemo).catch(err => { if (!isTestMode) console.error('❌ Error en migraciones (demo):', err.message); });

function setModoDemo(activo) {
    dbActual = activo ? dbDemo : db;
    console.log(activo ? '🔄 Modo demo activado' : '🔄 Modo demo desactivado');
}

function getDb() {
    return dbActual;
}

module.exports = { db, dbDemo, setModoDemo, getDb };
