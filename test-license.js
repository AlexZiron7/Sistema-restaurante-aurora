const { checkLicenseStatus, getLockStatus } = require('./server/licenseManager');

async function test() {
    console.log('--- Iniciando prueba de licencia ---');
    await checkLicenseStatus('script_test');
    console.log('Resultado:', JSON.stringify(getLockStatus(), null, 2));
}

test();
