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

const CLIENT_ID = getHardwareId();
const CONTROL_PANEL_URL = 'https://raw.githubusercontent.com/AlexZiron7/Sistema-restaurante-aurora/main/licenses.json';
const LICENSE_CACHE_FILE = path.join(__dirname, '..', '.license_cache');

let isSystemLocked = false;
let lockMessage = 'El sistema requiere activación.';

// Días de gracia permitidos sin conexión a internet
const GRACE_PERIOD_DAYS = 7;

async function checkLicenseStatus() {
    try {
        console.log(`[License] Verificando estado para: ${CLIENT_ID}...`);
        const response = await axios.get(CONTROL_PANEL_URL, { timeout: 8000 });
        const remoteData = response.data;

        if (!remoteData || !remoteData[CLIENT_ID]) {
            isSystemLocked = true;
            lockMessage = 'Esta copia no está registrada. Contacte a soporte.';
            return;
        }

        const clientData = remoteData[CLIENT_ID];
        
        // 1. Verificar estado manual
        if (clientData.status === 'suspended') {
            isSystemLocked = true;
            lockMessage = clientData.message || 'Sistema suspendido manualmente.';
            return;
        }

        // 2. Verificar fecha de expiración
        if (clientData.expiresAt) {
            const today = new Date();
            const expiryDate = new Date(clientData.expiresAt);
            if (today > expiryDate) {
                isSystemLocked = true;
                lockMessage = clientData.message || `Suscripción vencida el ${expiryDate.toLocaleDateString()}.`;
                return;
            }
        }

        // --- EXITO: Guardar fecha de última verificación ---
        isSystemLocked = false;
        fs.writeFileSync(LICENSE_CACHE_FILE, JSON.stringify({
            lastCheck: new Date().getTime(),
            clientId: CLIENT_ID
        }));
        console.log('✅ Licencia válida y activa.');

    } catch (error) {
        console.warn('⚠️ No se pudo conectar con el servidor de licencias. Verificando caché local...');
        
        if (fs.existsSync(LICENSE_CACHE_FILE)) {
            try {
                const cache = JSON.parse(fs.readFileSync(LICENSE_CACHE_FILE, 'utf8'));
                const lastCheck = new Date(cache.lastCheck);
                const now = new Date();
                
                // Calcular días transcurridos
                const diffTime = Math.abs(now - lastCheck);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays > GRACE_PERIOD_DAYS) {
                    isSystemLocked = true;
                    lockMessage = `El sistema requiere conexión a internet para verificar la licencia (Límite: ${GRACE_PERIOD_DAYS} días).`;
                    console.error('❌ PERIODO DE GRACIA EXCEDIDO');
                } else {
                    isSystemLocked = false;
                    console.log(`✅ Modo Offline (Día ${diffDays}/${GRACE_PERIOD_DAYS}).`);
                }
            } catch (e) {
                isSystemLocked = true;
            }
        } else {
            // No hay caché (primera vez o borrada) y no hay internet
            isSystemLocked = true;
            lockMessage = 'Se requiere conexión a internet para la activación inicial.';
        }
    }
}

function getLockStatus() {
    return { isSystemLocked, lockMessage, clientId: CLIENT_ID };
}

module.exports = { checkLicenseStatus, getLockStatus };
