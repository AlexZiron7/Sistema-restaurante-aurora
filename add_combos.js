const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'restaurante.db');
const dbDemoPath = path.resolve(__dirname, 'restaurante-demo.db');

const combos = [
    {
        nombre: 'Combo Desayuno Americano',
        precio_usd: 8.50,
        id_categoria: 3,
        es_combo: 1,
        productos_incluidos: '1 Café Americano, 1 Jugo de Naranja, 1 Porción de Fruta Fresca.',
        precio_combo: 13.00,
        descripcion: 'Empieza tu día con energía con este desayuno completo.'
    },
    {
        nombre: 'Combo Pareja Pasta',
        precio_usd: 25.00,
        id_categoria: 3,
        es_combo: 1,
        productos_incluidos: '2 Pastas (Boloñesa o Alfredo), 2 Copas de Vino, 1 Tiramisú para compartir.',
        precio_combo: 35.00,
        descripcion: 'Perfecto para compartir una velada especial con nuestra mejor selección de pastas.'
    },
    {
        nombre: 'Combo Almuerzo Ejecutivo',
        precio_usd: 18.00,
        id_categoria: 3,
        es_combo: 1,
        productos_incluidos: '1 Sopa del día, 1 Pollo a la Parrilla, 1 Gaseosa, 1 Postre del día.',
        precio_combo: 24.50,
        descripcion: 'La opción rápida y completa para tu almuerzo diario.'
    },
    {
        nombre: 'Combo Infantil',
        precio_usd: 12.00,
        id_categoria: 3,
        es_combo: 1,
        productos_incluidos: '1 Pasta Alfredo (porción pequeña), 1 Jugo de Fruta, 1 Helado.',
        precio_combo: 16.00,
        descripcion: 'Especialmente diseñado para los más pequeños de la casa.'
    }
];

async function insertCombos(path) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(path, (err) => {
            if (err) return reject(err);
            
            db.serialize(() => {
                const stmt = db.prepare(`INSERT INTO productos (nombre, precio_usd, id_categoria, es_combo, productos_incluidos, precio_combo, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)`);
                combos.forEach(c => {
                    stmt.run(c.nombre, c.precio_usd, c.id_categoria, c.es_combo, c.productos_incluidos, c.precio_combo, c.descripcion);
                });
                stmt.finalize();
                console.log(`✅ Combos agregados a: ${path}`);
                db.close(resolve);
            });
        });
    });
}

async function run() {
    try {
        await insertCombos(dbPath);
        await insertCombos(dbDemoPath);
        console.log('✨ Menú actualizado con combos promocionales.');
    } catch (err) {
        console.error('❌ Error agregando combos:', err);
    }
}

run();
