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

// URL de control
const CONTROL_PANEL_URL = 'https://raw.githubusercontent.com/AlexZiron7/Sistema-restaurante-aurora/main/licenses.json';

let isSystemLocked = false;
let lockMessage = 'El sistema requiere activación.';

async function checkLicenseStatus() {
    try {
        console.log(`[License] Verificando estado para: ${CLIENT_ID}...`);
        const response = await axios.get(CONTROL_PANEL_URL, { timeout: 5000 });
        const remoteData = response.data;

        // --- MODELO DE LISTA BLANCA ---
        if (!remoteData || !remoteData[CLIENT_ID]) {
            isSystemLocked = true;
            lockMessage = 'Esta copia del software no está registrada. Contacte a Aurora Devs.';
            console.error('⚠️ CLIENTE NO REGISTRADO EN EL PANEL DE CONTROL');
            return;
        }

        const clientData = remoteData[CLIENT_ID];
        
        // 1. Verificar estado manual (suspended)
        if (clientData.status === 'suspended') {
            isSystemLocked = true;
            lockMessage = clientData.message || 'Sistema suspendido manualmente.';
            return;
        }

        // 2. Verificar fecha de expiración automática
        if (clientData.expiresAt) {
            const today = new Date();
            const expiryDate = new Date(clientData.expiresAt);
            
            if (today > expiryDate) {
                isSystemLocked = true;
                lockMessage = clientData.message || `Su suscripción venció el ${expiryDate.toLocaleDateString()}.`;
                return;
            }
        }

        // Si pasó todas las pruebas
        isSystemLocked = false;
        console.log('✅ Licencia válida y activa.');

    } catch (error) {
        console.error('⚠️ Error de conexión con el servidor de licencias.');
        // En caso de error de internet, permitimos el acceso por ahora
        // (Podrías implementar una caché local si quieres ser más estricto)
    }
}

function getLockStatus() {
    return { isSystemLocked, lockMessage, clientId: CLIENT_ID };
}

module.exports = { checkLicenseStatus, getLockStatus };
