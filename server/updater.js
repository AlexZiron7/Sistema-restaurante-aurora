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
    console.log('Descargando actualización...');
    
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(installerPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            console.log('Descarga completa. Ejecutando instalador...');
            // Ejecutar el instalador y cerrar la app actual
            const child = spawn(installerPath, ['/SILENT'], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();
            process.exit(0);
        });
        writer.on('error', reject);
    });
}

module.exports = { checkForUpdates, downloadAndInstall };
