require('dotenv').config();

const { server } = require('./server/app');
const { setupGlobalErrorHandlers } = require('./server/middleware/errorHandler');
const { checkForUpdates } = require('./server/updater');
const { checkLicenseStatus } = require('./server/licenseManager');
const db = require('./database');

setupGlobalErrorHandlers();

const PORT = process.env.PORT || 4001;

// --- LÓGICA DE INSTANCIA ÚNICA ---
async function checkSingleInstance() {
    return new Promise((resolve) => {
        const http = require('http');
        const req = http.get(`http://localhost:${PORT}/api/config`, (res) => {
            // Si responde, es que ya hay una instancia corriendo
            console.log('⚠️ Ya hay una instancia corriendo. Abriendo navegador...');
            const url = `http://localhost:${PORT}`;
            const { exec } = require('child_process');
            exec(`start chrome.exe --app="${url}"`, (err) => {
                if (err) {
                    exec(`start msedge.exe --app="${url}"`, (err2) => {
                        if (err2) exec(`start ${url}`);
                    });
                }
                setTimeout(() => process.exit(0), 1000); // Cerrar esta instancia
            });
        });
        req.on('error', () => resolve()); // El puerto está libre, podemos continuar
        req.setTimeout(800, () => { req.destroy(); resolve(); });
    });
}

async function startServer() {
    if (process.pkg) await checkSingleInstance();

    server.listen(PORT, async () => {
        console.log(`🚀 Servidor Aurora RES corriendo en http://localhost:${PORT}`);
        const url = `http://localhost:${PORT}`;

        // Solo abrir navegador automático en modo empaquetado
        if (process.pkg) {
            setTimeout(() => {
                const { exec } = require('child_process');
                exec(`start chrome.exe --app="${url}"`, (err) => {
                    if (err) {
                        exec(`start msedge.exe --app="${url}"`, (err2) => {
                            if (err2) exec(`start ${url}`);
                        });
                    }
                });
            }, 2000);
        }

        // 2. Verificar Licencia (Kill Switch)
        await checkLicenseStatus('inicio');

        // 3. Buscar actualizaciones
        checkForUpdates().then(update => {
            if (update && update.available) {
                console.log(`📢 [UPDATE] Hay una nueva versión disponible (${update.version})`);
            }
        });

        // Re-verificar licencia cada 24 horas
        setInterval(() => checkLicenseStatus('intervalo_24h'), 24 * 60 * 60 * 1000);
    });
}

startServer();

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
