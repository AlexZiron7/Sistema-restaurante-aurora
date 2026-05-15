const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'restaurante.db');
const dbDemoPath = path.resolve(__dirname, '..', 'restaurante-demo.db');

function updateDB(path) {
    const db = new sqlite3.Database(path);
    db.serialize(() => {
        console.log(`Updating ${path}...`);
        db.run("UPDATE config SET valor = '+584127108519' WHERE clave = 'whatsapp_soporte'");
        db.run("UPDATE config SET valor = 'alex.ziron7@gmail.com' WHERE clave = 'email_soporte'");
        db.run("UPDATE config SET valor = 'Aurora RES' WHERE clave = 'nombre_restaurante'");
        // Reset tasa_bcv to force a new fetch on next start
        db.run("UPDATE config SET valor = '0' WHERE clave = 'tasa_bcv'");
    });
    db.close();
}

if (require('fs').existsSync(dbPath)) updateDB(dbPath);
if (require('fs').existsSync(dbDemoPath)) updateDB(dbDemoPath);
console.log('✅ Base de datos actualizada con la nueva información de Aurora Devs.');
