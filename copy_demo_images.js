const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Alexz\\.gemini\\antigravity\\brain\\f367645c-6ba6-4461-87b5-8d65042dcbfa';
const destDir = path.join(__dirname, 'public', 'demo_images');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('✅ Carpeta demo_images creada.');
}

const files = [
    ['demo_burger_clasica_1774830028795.png', 'burger.png'],
    ['demo_pizza_1774830044710.png', 'pizza.png'],
    ['demo_soda_1774830056800.png', 'soda.png'],
    ['demo_combo_burger_1774830105259.png', 'combo_burger.png'],
    ['demo_torta_1774830118524.png', 'torta.png'],
];

files.forEach(([src, dest]) => {
    const srcPath = path.join(srcDir, src);
    const destPath = path.join(destDir, dest);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copiado: ${dest}`);
    } else {
        console.warn(`⚠️  No encontrado: ${src}`);
    }
});

console.log('✨ Imágenes demo listas en public/demo_images/');
