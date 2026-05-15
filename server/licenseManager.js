const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Función para obtener el ID único de la PC (UUID de la placa base)
function getHardwareId() {
    try {
        if (process.platform === 'win32') {
            const output = execSync('wmic csproduct get uuid').toString();
            return output.split('\n')[1].trim().substring(0, 12).toUpperCase();
        }
        return 'DEV-PC-999';
    } catch (e) {
        return 'AUR-UNK-001';
    }
}

const appRoot = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '..');
const CLIENT_ID = getHardwareId();
const CONTROL_PANEL_URL = 'https://raw.githubusercontent.com/AlexZiron7/Sistema-restaurante-aurora/main/licenses.json';
const LICENSE_CACHE_FILE = path.join(appRoot, '.license_cache');

let isSystemLocked = false;
let lockMessage = 'El sistema requiere activación.';
let isCheckingLicense = false;
let lastCheckResult = null;

// Días de gracia permitidos sin conexión a internet
const GRACE_PERIOD_DAYS = 7;

async function checkLicenseStatus(caller = 'desconocido') {
    if (isCheckingLicense) {
        console.log(`[License] ⚠️ Ya hay una verificación en curso (llamado por: ${caller}), ignorando...`);
        return getLockStatus();
    }
    isCheckingLicense = true;
    const ts = new Date().toISOString();
    console.log(`[License] [${ts}] Iniciando verificación. Llamado por: ${caller}. Estado actual: locked=${isSystemLocked}`);
    try {
        console.log(`[License] Verificando estado para: ${CLIENT_ID}...`);
        const response = await axios.get(CONTROL_PANEL_URL, { timeout: 8000 });
        const remoteData = response.data;

        if (!remoteData || !remoteData[CLIENT_ID]) {
            isSystemLocked = true;
            lockMessage = 'Esta copia no está registrada. Contacte a soporte.';
            lastCheckResult = 'no_registrada';
            console.log(`[License] [${ts}] Resultado: NO REGISTRADA. ${CLIENT_ID} no encontrado en licencias.`);
            return;
        }

        const clientData = remoteData[CLIENT_ID];
        
        if (clientData.status === 'suspended') {
            isSystemLocked = true;
            lockMessage = clientData.message || 'Sistema suspendido manualmente.';
            lastCheckResult = 'suspendido';
            console.log(`[License] [${ts}] Resultado: SUSPENDIDO.`);
            return;
        }

        if (clientData.expiresAt) {
            const today = new Date();
            const expiryDate = new Date(clientData.expiresAt);
            if (today > expiryDate) {
                isSystemLocked = true;
                lockMessage = clientData.message || `Suscripción vencida el ${expiryDate.toLocaleDateString()}.`;
                lastCheckResult = 'vencido';
                console.log(`[License] [${ts}] Resultado: VENCIDO. Expiró: ${clientData.expiresAt}`);
                return;
            }
        }

        // --- EXITO: Guardar fecha de última verificación ---
        isSystemLocked = false;
        lockMessage = 'Sistema activado correctamente.';
        try {
            fs.writeFileSync(LICENSE_CACHE_FILE, JSON.stringify({
                lastCheck: new Date().getTime(),
                clientId: CLIENT_ID
            }));
        } catch (writeError) {
            console.warn('⚠️ No se pudo escribir caché de licencia:', writeError.message);
        }
        lastCheckResult = 'activo';
        console.log(`[License] [${ts}] Resultado: ACTIVO. Sistema desbloqueado.`);

    } catch (error) {
        console.warn(`[License] [${ts}] Error de conexión:`, error.message);
        
        if (!fs.existsSync(LICENSE_CACHE_FILE)) {
            fs.writeFileSync(LICENSE_CACHE_FILE, JSON.stringify({
                lastCheck: new Date().getTime(),
                clientId: CLIENT_ID
            }));
            console.log(`[License] [${ts}] Caché creado. Inicio período de gracia.`);
        }

        try {
            const cache = JSON.parse(fs.readFileSync(LICENSE_CACHE_FILE, 'utf8'));
            const lastCheck = new Date(cache.lastCheck);
            const now = new Date();
            const diffTime = Math.abs(now - lastCheck);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            console.log(`[License] [${ts}] Caché: lastCheck=${cache.lastCheck} (${lastCheck.toISOString()}), diffDays=${diffDays}`);
            
            if (diffDays > GRACE_PERIOD_DAYS) {
                isSystemLocked = true;
                lockMessage = `El sistema requiere conexión a internet para verificar la licencia (Límite: ${GRACE_PERIOD_DAYS} días).`;
                lastCheckResult = 'gracia_excedido';
                console.error(`[License] [${ts}] Resultado: GRACIA EXCEDIDA (${diffDays} días). BLOQUEADO.`);
            } else {
                isSystemLocked = false;
                lastCheckResult = 'offline';
                console.log(`[License] [${ts}] Resultado: OFFLINE (Día ${diffDays}/${GRACE_PERIOD_DAYS}). Desbloqueado.`);
            }
        } catch (e) {
            isSystemLocked = true;
            lockMessage = 'Error leyendo la licencia local.';
            lastCheckResult = 'error_cache';
            console.error(`[License] [${ts}] Error leyendo caché:`, e.message);
        }
    } finally {
        isCheckingLicense = false;
        console.log(`[License] [${ts}] Finalizado. locked=${isSystemLocked}, msg=${lockMessage.substring(0, 60)}`);
    }
}

function getLockStatus() {
    return { isSystemLocked, lockMessage, clientId: CLIENT_ID, lastCheckResult };
}

module.exports = { checkLicenseStatus, getLockStatus };
