const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const databases = [
    path.resolve(__dirname, 'restaurante.db'),
    path.resolve(__dirname, 'restaurante-demo.db')
];

databases.forEach(dbPath => {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) return; // Ignorar si no existe
        
        db.serialize(() => {
            console.log(`🧹 Limpiando base de datos: ${path.basename(dbPath)}`);
            
            const updates = [
                ['whatsapp_soporte', '+584127108519'],
                ['email_soporte', 'alex.ziron7@gmail.com'],
                ['nombre_restaurante', 'Aurora RES']
            ];

            updates.forEach(([clave, valor]) => {
                db.run("INSERT OR REPLACE INTO config (clave, valor, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)", [clave, valor]);
            });
            
            console.log(`✅ ${path.basename(dbPath)} actualizada.`);
        });
        db.close();
    });
});
