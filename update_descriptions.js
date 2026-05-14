const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'restaurante.db');
const dbDemoPath = path.resolve(__dirname, 'restaurante-demo.db');

const descriptions = {
    'Café americano': 'Café negro intenso preparado con granos seleccionados.',
    'Café con leche': 'Equilibrio perfecto entre café expresso y leche cremosa.',
    'Capuccino': 'Café expresso con una capa espesa de espuma de leche y un toque de cacao.',
    'Jugo de naranja': 'Jugo 100% natural recién exprimido.',
    'Jugo de frutas': 'Mezcla refrescante de frutas de temporada.',
    'Agua mineral': 'Agua purificada con gas o sin gas.',
    'Gaseosa': 'Refresco carbonatado de varios sabores.',
    'Cerveza': 'Cerveza nacional o importada, servida bien fría.',
    'Copa de vino': 'Selección de la casa (tinto, blanco o rosado).',
    'Coctail': 'Preparación especial del barman con licores de alta calidad.',
    'Ensalada César': 'Lechuga romana, croutones, queso parmesano y nuestro aderezo César casero.',
    'Ensalada mixta': 'Variedad de frescos vegetales con vinagreta de la casa.',
    'Sopa del día': 'Consultar con el mesonero la preparación especial de hoy.',
    'Nachos': 'Tortillas de maíz crujientes acompañadas de queso fundido, jalapeños y pico de gallo.',
    'Bruschetta': 'Pan tostado con tomate, albahaca fresca, ajo y aceite de oliva.',
    'Carpaccio': 'Finas láminas de carne marinadas con limón, rúcula y lascas de parmesano.',
    'Calamares fritos': 'Anillos de calamar rebozados, servidos con salsa tártara.',
    'Pasta Alfredo': 'Pasta en una cremosa salsa a base de mantequilla y queso parmesano.',
    'Pasta Boloñesa': 'Salsa tradicional de carne y tomate con hierbas aromáticas.',
    'Risotto': 'Arroz cremoso con champiñones y un toque de vino blanco.',
    'Pollo a la Parrilla': 'Pechuga de pollo jugosa sazonada con finas hierbas.',
    'Carne a la Parrilla': 'Corte de carne Premium al término de su preferencia.',
    'Pescado del día': 'Filete de pescado fresco, preparado a la plancha o al vapor.',
    'Postre del día': 'Deliciosa creación dulce de nuestra repostería.',
    'Tiramisú': 'Postre italiano clásico con capas de bizcocho café y crema mascarpone.',
    'Helado': 'Dos bolas de helado, sabores a elegir.',
    'Fruta fresca': 'Variedad de frutas picadas de estación.',
    'Brownie': 'Bizcocho de chocolate templado, servido con una bola de helado de vainilla.'
};

async function updateDB(path) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(path, (err) => {
            if (err) return reject(err);
            
            db.serialize(() => {
                const stmt = db.prepare("UPDATE productos SET descripcion = ? WHERE nombre = ?");
                for (const [nombre, desc] of Object.entries(descriptions)) {
                    stmt.run(desc, nombre);
                }
                stmt.finalize();
                console.log(`✅ Base de datos actualizada: ${path}`);
                db.close(resolve);
            });
        });
    });
}

async function run() {
    try {
        await updateDB(dbPath);
        await updateDB(dbDemoPath);
        console.log('✨ Todas las descripciones han sido actualizadas.');
    } catch (err) {
        console.error('❌ Error actualizando descripciones:', err);
    }
}

run();
