const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'restaurante.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('--- AUDITORÍA DE BASE DE DATOS ---');
    
    // 1. Asegurar que la tabla existe
    db.run("CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY AUTOINCREMENT, clave TEXT UNIQUE, valor TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)");

    // 2. Insertar o Actualizar los valores correctos
    const updates = [
        ['whatsapp_soporte', '+584127108519'],
        ['email_soporte', 'alex.ziron7@gmail.com'],
        ['nombre_restaurante', 'Aurora RES']
    ];

    updates.forEach(([clave, valor]) => {
        db.run("INSERT OR REPLACE INTO config (clave, valor, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)", [clave, valor], (err) => {
            if (err) console.error(`❌ Error actualizando ${clave}:`, err.message);
            else console.log(`✅ ${clave} -> ${valor}`);
        });
    });

    // 3. Verificación final
    db.all("SELECT * FROM config", [], (err, rows) => {
        if (err) {
            console.error('❌ Error al leer config:', err.message);
        } else {
            console.log('\n📊 Estado actual de la tabla config:');
            console.table(rows);
        }
        db.close();
    });
});
