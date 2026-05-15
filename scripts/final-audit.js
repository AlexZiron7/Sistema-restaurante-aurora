const fs = require('fs');
const path = require('path');

// 1. Corregir el Manual de una vez por todas (Puerto y Roles)
const manualPath = path.resolve(__dirname, '../client/src/pages/ManualPage.jsx');
if (fs.existsSync(manualPath)) {
    let content = fs.readFileSync(manualPath, 'utf8');
    content = content.replace(/5173/g, '3000');
    // Asegurar que los roles estén actualizados
    if (!content.includes('Cajero / Administrador')) {
        content = content.replace(/• 👨‍💼 Gerente: Reportes, menú y gestión de personal/g, '• 💰 **Cajero / Administrador**: Gestión de cobros, cierre de mesas y revisión de historial.');
    }
    fs.writeFileSync(manualPath, content);
    console.log('✅ ManualPage.jsx actualizado (Puerto 3000 y Roles).');
}

// 2. Verificar Tasa BCV
const { obtenerTasaBCV } = require('../services/tasaBcv');
obtenerTasaBCV().then(tasa => {
    if (tasa) {
        console.log(`✅ Tasa BCV funcionando: ${tasa}`);
    } else {
        console.log('❌ Tasa BCV sigue fallando. Revisando fuentes...');
    }
});
