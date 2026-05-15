const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const pkg = require('../package.json');

const UPDATE_URL = 'https://raw.githubusercontent.com/AlexZiron7/Sistema-restaurante-aurora/main/update.json';

async function checkForUpdates() {
    try {
        console.log('Buscando actualizaciones...');
        const response = await axios.get(UPDATE_URL);
        const remoteVersion = response.data.version;
        const currentVersion = pkg.version;

        if (isNewer(remoteVersion, currentVersion)) {
            console.log(`🚀 Nueva versión disponible: ${remoteVersion}`);
            return {
                available: true,
                version: remoteVersion,
                url: response.data.url,
                notes: response.data.notes
            };
        }
        console.log('El sistema está actualizado.');
        return { available: false };
    } catch (error) {
        console.error('Error al buscar actualizaciones:', error.message);
        return { available: false };
    }
}

function isNewer(remote, local) {
    const r = remote.split('.').map(Number);
    const l = local.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if (r[i] > l[i]) return true;
        if (r[i] < l[i]) return false;
    }
    return false;
}

// Esta función descarga el instalador y lo ejecuta
async function downloadAndInstall(url) {
    const installerPath = path.join(process.env.TEMP, 'Restaurante-Update.exe');
    console.log(`[Updater] Iniciando descarga desde: ${url}`);
    
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 30000 // 30 segundos de timeout para iniciar
        });

        const writer = fs.createWriteStream(installerPath);
        
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });

            writer.on('close', () => {
                if (!error) {
                    console.log('[Updater] Descarga completa. Ejecutando instalador...');
                    const child = spawn(installerPath, ['/SILENT'], {
                        detached: true,
                        stdio: 'ignore'
                    });
                    child.unref();
                    setTimeout(() => process.exit(0), 1000); // Dar tiempo para que el SO inicie el proceso
                    resolve();
                }
            });
        });
    } catch (err) {
        console.error('[Updater] Error crítico en descarga:', err.message);
        throw err;
    }
}

module.exports = { checkForUpdates, downloadAndInstall };
