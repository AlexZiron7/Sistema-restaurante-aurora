require('dotenv').config();

const { server } = require('./server/app');
const { setupGlobalErrorHandlers } = require('./server/middleware/errorHandler');
const { checkForUpdates, downloadAndInstall } = require('./server/updater');
const { runMigrations } = require('./server/db/migrationManager');
const { checkLicenseStatus } = require('./server/licenseManager');
const db = require('./database');

setupGlobalErrorHandlers();

const PORT = process.env.PORT || 4001;
server.listen(PORT, async () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    if (process.pkg) {
        const url = `http://localhost:${PORT}`;
        setTimeout(() => {
            const { exec } = require('child_process');
            exec(`start chrome.exe --app="${url}"`, () => {
                exec(`start msedge.exe --app="${url}"`);
            });
        }, 2000);

        // 1. Ejecutar migraciones primero
        await runMigrations(db);

        // 2. Verificar Licencia (Kill Switch)
        await checkLicenseStatus();

        // 3. Buscar actualizaciones
        checkForUpdates().then(update => {
            if (update.available) {
                console.log(`📢 [UPDATE] Hay una nueva versión disponible (${update.version})`);
            }
        });

        // Re-verificar licencia cada 24 horas
        setInterval(checkLicenseStatus, 24 * 60 * 60 * 1000);
    }
});



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
