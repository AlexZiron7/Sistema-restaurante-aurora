const fs = require('fs');
const path = require('path');

async function runMigrations(db) {
    console.log('Checking for database migrations...');

    // 1. Crear tabla de control si no existe
    await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => err ? reject(err) : resolve());
    });

    // 2. Leer archivos de migraciones
    // Nota: En producción (pkg), las migraciones deben estar en una carpeta accesible
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
        console.log('No migrations directory found. Skipping.');
        return;
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.js') || f.endsWith('.sql'))
        .sort();

    // 3. Ejecutar migraciones pendientes
    for (const file of files) {
        const isExecuted = await new Promise((resolve) => {
            db.get('SELECT id FROM _migrations WHERE name = ?', [file], (err, row) => {
                resolve(!!row);
            });
        });

        if (!isExecuted) {
            console.log(`Running migration: ${file}`);
            try {
                if (file.endsWith('.js')) {
                    const migration = require(path.join(migrationsDir, file));
                    await migration.up(db);
                } else {
                    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                    await new Promise((resolve, reject) => {
                        db.exec(sql, (err) => err ? reject(err) : resolve());
                    });
                }

                await new Promise((resolve, reject) => {
                    db.run('INSERT INTO _migrations (name) VALUES (?)', [file], (err) => {
                        err ? reject(err) : resolve();
                    });
                });
                console.log(`✅ Migration ${file} completed.`);
            } catch (error) {
                console.error(`❌ Error in migration ${file}:`, error);
                throw error; // Detener todo si una migración falla
            }
        }
    }
    console.log('Database is up to date.');
}

module.exports = { runMigrations };
