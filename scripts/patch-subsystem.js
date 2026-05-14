const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const exes = fs.readdirSync(distDir).filter(f => f.endsWith('.exe'));
if (exes.length === 0) {
  console.log('⚠️  No se encontró .exe en dist/. Omitiendo patch.');
  process.exit(0);
}
const exePath = path.join(distDir, exes[0]);

const buf = fs.readFileSync(exePath);
const peOffset = buf.readUInt32LE(0x3C);
const subsystemOffset = peOffset + 92;
const currentSubsystem = buf[subsystemOffset];

if (currentSubsystem === 2) {
  console.log('✅ Subsistema ya es WINDOWS (2). Sin cambios.');
  process.exit(0);
}

if (currentSubsystem !== 3) {
  console.log(`⚠️  Subsistema inesperado: ${currentSubsystem}. Saltando patch.`);
  process.exit(0);
}

buf[subsystemOffset] = 2;
fs.writeFileSync(exePath, buf);
console.log('✅ Subsistema cambiado: CONSOLE(3) → WINDOWS(2). CMD oculto.');
