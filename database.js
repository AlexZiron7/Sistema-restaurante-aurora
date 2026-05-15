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

function initDB(dbInstance) {
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

    // --- Índices para mejorar rendimiento ---
    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_cierre ON pedidos(fecha_cierre)");
    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado)");
    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_pedidos_id_mesa ON pedidos(id_mesa)");
    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_items_pedido_id_pedido ON items_pedido(id_pedido)");
    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_items_pedido_estado ON items_pedido(estado)");
    dbInstance.run("CREATE INDEX IF NOT EXISTS idx_productos_id_categoria ON productos(id_categoria)");

    // --- Datos iniciales ---
    dbInstance.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
        if (row && row.count === 0) {
            const hash = (pin) => bcrypt.hashSync(pin, 10);
            dbInstance.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES (?, ?, ?, ?)", ['dueno', hash('0000'), 'Dueño del Restaurante', 'dueno']);
            dbInstance.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES (?, ?, ?, ?)", ['admin', hash('1234'), 'Administrador', 'admin']);
            dbInstance.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES (?, ?, ?, ?)", ['gerente', hash('1111'), 'Gerente', 'gerente']);
            dbInstance.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES (?, ?, ?, ?)", ['caja1', hash('2222'), 'Caja Principal', 'cajero']);
            dbInstance.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol) VALUES (?, ?, ?, ?)", ['mesonero1', hash('3333'), 'Mesonero 1', 'mesonero']);
            dbInstance.run("INSERT INTO usuarios (usuario, pin_acceso, nombre, rol, estado_activo) VALUES (?, ?, ?, ?, ?)", ['demo', hash('0000'), 'Usuario Demo', 'admin', 1]);
            
            for (let i = 1; i <= 10; i++) {
                dbInstance.run(`INSERT INTO mesas (numero_mesa) VALUES (${i})`);
            }
            if (!isTestMode) console.log('✅ Datos iniciales creados exitosamente.');
        }
    });

    dbInstance.get("SELECT COUNT(*) as count FROM categorias", (err, row) => {
        if (row && row.count === 0) {
            dbInstance.run(`INSERT INTO categorias (nombre, icono) VALUES ('Bebidas', '🥤')`);
            dbInstance.run(`INSERT INTO categorias (nombre, icono) VALUES ('Entradas', '🥗')`);
            dbInstance.run(`INSERT INTO categorias (nombre, icono) VALUES ('Principales', '🍽️')`);
            dbInstance.run(`INSERT INTO categorias (nombre, icono) VALUES ('Postres', '🍰')`);
            if (!isTestMode) console.log('✅ Categorías creadas.');
        }
    });

    dbInstance.get("SELECT COUNT(*) as count FROM productos", (err, row) => {
        if (row && row.count === 0) {
            const productos = [
                ['Café americano', 2.50, 1, 'Café negro intenso preparado con granos seleccionados.'],
                ['Café con leche', 3.00, 1, 'Equilibrio perfecto entre café expresso y leche cremosa.'],
                ['Capuccino', 4.00, 1, 'Café expresso con una capa espesa de espuma de leche y un toque de cacao.'],
                ['Jugo de naranja', 4.50, 1, 'Jugo 100% natural recién exprimido.'],
                ['Jugo de frutas', 4.00, 1, 'Mezcla refrescante de frutas de temporada.'],
                ['Agua mineral', 2.00, 1, 'Agua purificada con gas o sin gas.'],
                ['Gaseosa', 2.50, 1, 'Refresco carbonatado de varios sabores.'],
                ['Cerveza', 5.00, 1, 'Cerveza nacional o importada, servida bien fría.'],
                ['Copa de vino', 8.00, 1, 'Selección de la casa (tinto, blanco o rosado).'],
                ['Coctail', 10.00, 1, 'Preparación especial del barman con licores de alta calidad.'],
                ['Ensalada César', 12.00, 2, 'Lechuga romana, croutones, queso parmesano y nuestro aderezo César casero.'],
                ['Ensalada mixta', 10.00, 2, 'Variedad de frescos vegetales con vinagreta de la casa.'],
                ['Sopa del día', 8.00, 2, 'Consultar con el mesonero la preparación especial de hoy.'],
                ['Nachos', 10.00, 2, 'Tortillas de maíz crujientes acompañadas de queso fundido, jalapeños y pico de gallo.'],
                ['Bruschetta', 8.00, 2, 'Pan tostado con tomate, albahaca fresca, ajo y aceite de oliva.'],
                ['Carpaccio', 16.00, 2, 'Finas láminas de carne marinadas con limón, rúcula y lascas de parmesano.'],
                ['Calamares fritos', 14.00, 2, 'Anillos de calamar rebozados, servidos con salsa tártara.'],
                ['Pasta Alfredo', 15.00, 3, 'Pasta en una cremosa salsa a base de mantequilla y queso parmesano.'],
                ['Pasta Boloñesa', 16.00, 3, 'Salsa tradicional de carne y tomate con hierbas aromáticas.'],
                ['Risotto', 18.00, 3, 'Arroz cremoso con champiñones y un toque de vino blanco.'],
                ['Pollo a la Parrilla', 20.00, 3, 'Pechuga de pollo jugosa sazonada con finas hierbas.'],
                ['Carne a la Parrilla', 25.00, 3, 'Corte de carne Premium al término de su preferencia.'],
                ['Pescado del día', 22.00, 3, 'Filete de pescado fresco, preparado a la plancha o al vapor.'],
                ['Postre del día', 7.00, 4, 'Deliciosa creación dulce de nuestra repostería.'],
                ['Tiramisú', 8.00, 4, 'Postre italiano clásico con capas de bizcocho café y crema mascarpone.'],
                ['Helado', 5.00, 4, 'Dos bolas de helado, sabores a elegir.'],
                ['Fruta fresca', 6.00, 4, 'Variedad de frutas picadas de estación.'],
                ['Brownie', 7.00, 4, 'Bizcocho de chocolate templado, servido con una bola de helado de vainilla.'],
            ];
            
            const stmt = dbInstance.prepare(`INSERT INTO productos (nombre, precio_usd, id_categoria, descripcion) VALUES (?, ?, ?, ?)`);
            productos.forEach(([nombre, precio, cat, desc]) => {
                stmt.run(nombre, precio, cat, desc);
            });
            stmt.finalize();

            // --- Combos iniciales ---
            const combos = [
                ['Combo Desayuno Americano', 8.50, 3, 1, '1 Café Americano, 1 Jugo de Naranja, 1 Porción de Fruta Fresca.', 13.00, 'Empieza tu día con energía con este desayuno completo.'],
                ['Combo Pareja Pasta', 25.00, 3, 1, '2 Pastas (Boloñesa o Alfredo), 2 Copas de Vino, 1 Tiramisú para compartir.', 35.00, 'Perfecto para compartir una velada especial.'],
                ['Combo Almuerzo Ejecutivo', 18.00, 3, 1, '1 Sopa del día, 1 Pollo a la Parrilla, 1 Gaseosa, 1 Postre del día.', 24.50, 'La opción rápida y completa para tu almuerzo diario.'],
                ['Combo Infantil', 12.00, 3, 1, '1 Pasta Alfredo (porción pequeña), 1 Jugo de Fruta, 1 Helado.', 16.00, 'Especialmente diseñado para los más pequeños.']
            ];
            
            const stmtCombo = dbInstance.prepare(`INSERT INTO productos (nombre, precio_usd, id_categoria, es_combo, productos_incluidos, precio_combo, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            combos.forEach(c => {
                stmtCombo.run(...c);
            });
            stmtCombo.finalize();

            if (!isTestMode) console.log('✅ Productos y Combos creados.');
        }
    });

        dbInstance.get("SELECT COUNT(*) as count FROM config", (err, row) => {
            if (row && row.count === 0) {
                dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('tasa_bcv', '0')`);
                dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('mostrar_precios_bs', 'true')`);
                dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('mostrar_precios_usd', 'true')`);
                dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('nombre_restaurante', 'Mi Restaurante')`);
                dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('whatsapp_soporte', '+584121234567')`);
                dbInstance.run(`INSERT INTO config (clave, valor) VALUES ('email_soporte', 'soporte@aurora-devs.com')`);
                if (!isTestMode) console.log('✅ Configuración inicial creada.');
            }
        });
    });
}

initDB(db);
initDB(dbDemo);

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
