require('dotenv').config();

const { server } = require('./server/app');
const { setupGlobalErrorHandlers } = require('./server/middleware/errorHandler');
const { checkForUpdates, downloadAndInstall } = require('./server/updater');

setupGlobalErrorHandlers();

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    if (process.pkg) {
        const url = `http://localhost:${PORT}`;
        setTimeout(() => {
            const { exec } = require('child_process');
            exec(`start chrome.exe --app="${url}"`, () => {
                exec(`start msedge.exe --app="${url}"`);
            });
        }, 2000);

        // Opcional: Buscar actualizaciones al arrancar
        checkForUpdates().then(update => {
            if (update.available) {
                console.log(`📢 [UPDATE] Hay una nueva versión disponible (${update.version})`);
            }
        });
    }
});

// Rutas de actualización (puedes moverlas a un archivo de rutas si prefieres)
const express = require('express'); // app ya es una instancia de express en server/app.js
const app = server; // Nota: server suele ser el servidor http, app es la instancia de express. 
// Reviso server/app.js para estar seguro...

function gracefulShutdown() {
    console.log('\n🛑 Apagando servidor...');
    server.close(() => {
        const { db, dbDemo } = require('./database');
        db.close();
        dbDemo.close();
        console.log('✅ Servidor apagado correctamente.');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('💥 Forzando cierre...');
        process.exit(1);
    }, 5000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
