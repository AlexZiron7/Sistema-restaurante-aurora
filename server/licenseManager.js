const axios = require('axios');
const fs = require('fs');
const path = require('path');

// URL donde tú controlarás el estado de todos tus clientes
// Formato esperado: { "RESTAURANTE_001": { "status": "active" }, "RESTAURANTE_002": { "status": "suspended" } }
const CONTROL_PANEL_URL = 'https://raw.githubusercontent.com/AlexZiron7/Sistema-restaurante-aurora/main/licenses.json';

// ID único para este cliente (esto se puede configurar por instalación)
const CLIENT_ID = 'CLIENTE_DEMO_001'; 

let isSystemLocked = false;
let lockMessage = 'El sistema ha sido suspendido por falta de pago. Por favor, contacte a soporte técnico.';

async function checkLicenseStatus() {
    try {
        console.log(`[License] Verificando estado para: ${CLIENT_ID}...`);
        const response = await axios.get(CONTROL_PANEL_URL, { timeout: 5000 });
        const remoteData = response.data;

        if (remoteData && remoteData[CLIENT_ID]) {
            const clientStatus = remoteData[CLIENT_ID];
            
            if (clientStatus.status === 'suspended') {
                isSystemLocked = true;
                lockMessage = clientStatus.message || lockMessage;
                console.error('⚠️ SISTEMA BLOQUEADO POR IMPAGO');
            } else {
                isSystemLocked = false;
                console.log('✅ Licencia activa.');
            }
        }
    } catch (error) {
        console.error('⚠️ No se pudo verificar la licencia (Offline). El sistema continuará funcionando temporalmente.');
        // Opcional: Podrías bloquearlo también si no tiene internet por X días
    }
}

function getLockStatus() {
    return { isSystemLocked, lockMessage };
}

module.exports = { checkLicenseStatus, getLockStatus };
