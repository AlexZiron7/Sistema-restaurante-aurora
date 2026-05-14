const sqlite3 = require('sqlite3').verbose();

const dbDemo = new sqlite3.Database('./restaurante-demo.db');

const productosDemo = [
  { nombre: 'Agua mineral', precio_usd: 2, descripcion: 'Agua purificada con gas o sin gas.', id_categoria: 1, es_combo: 0 },
  { nombre: 'Brownie', precio_usd: 7, descripcion: 'Bizcocho de chocolate templado.', id_categoria: 4, es_combo: 0 },
  { nombre: 'Bruschetta', precio_usd: 8, descripcion: 'Pan tostado con tomate y albahaca.', id_categoria: 2, es_combo: 0 },
  { nombre: 'Calamares fritos', precio_usd: 14, descripcion: 'Anillos de calamar rebozados.', id_categoria: 2, es_combo: 0 },
  { nombre: 'Capuccino', precio_usd: 4, descripcion: 'Café expresso con espuma de leche.', id_categoria: 1, es_combo: 0 },
  { nombre: 'Carne a la Parrilla', precio_usd: 25, descripcion: 'Corte de carne Premium.', id_categoria: 3, es_combo: 0 },
  { nombre: 'Carpaccio', precio_usd: 16, descripcion: 'Finas láminas de carne marinadas.', id_categoria: 2, es_combo: 0 },
  { nombre: 'Cerveza', precio_usd: 5, descripcion: 'Cerveza nacional o importada.', id_categoria: 1, es_combo: 0 },
  { nombre: 'Copa de vino', precio_usd: 8, descripcion: 'Selección de la casa.', id_categoria: 1, es_combo: 0 },
  { nombre: 'Ensalada César', precio_usd: 12, descripcion: 'Lechuga romana con aderezo César.', id_categoria: 2, es_combo: 0 },
  { nombre: 'Ensalada mixta', precio_usd: 10, descripcion: 'Variedad de vegetales frescos.', id_categoria: 2, es_combo: 0 },
  { nombre: 'Fruta fresca', precio_usd: 6, descripcion: 'Variedad de frutas picadas.', id_categoria: 4, es_combo: 0 },
  { nombre: 'Gaseosa', precio_usd: 2.5, descripcion: 'Refresco carbonatado.', id_categoria: 1, es_combo: 0 },
  { nombre: 'Helado', precio_usd: 5, descripcion: 'Dos bolas de helado.', id_categoria: 4, es_combo: 0 },
  { nombre: 'Jugo de frutas', precio_usd: 4, descripcion: 'Mezcla de frutas de temporada.', id_categoria: 1, es_combo: 0 },
  { nombre: 'Jugo de naranja', precio_usd: 4.5, descripcion: 'Jugo 100% natural.', id_categoria: 1, es_combo: 0 },
  { nombre: 'Nachos', precio_usd: 10, descripcion: 'Tortillas con queso fundido.', id_categoria: 2, es_combo: 0 },
  { nombre: 'Pasta Alfredo', precio_usd: 15, descripcion: 'Pasta en salsa cremosa.', id_categoria: 3, es_combo: 0 },
  { nombre: 'Pasta Boloñesa', precio_usd: 16, descripcion: 'Salsa tradicional de carne.', id_categoria: 3, es_combo: 0 },
  { nombre: 'Pescado del día', precio_usd: 22, descripcion: 'Filete de pescado fresco.', id_categoria: 3, es_combo: 0 },
  { nombre: 'Pollo a la Parrilla', precio_usd: 20, descripcion: 'Pechuga de pollo jugosa.', id_categoria: 3, es_combo: 0 },
  { nombre: 'Postre del día', precio_usd: 7, descripcion: 'Creación dulce del día.', id_categoria: 4, es_combo: 0 },
  { nombre: 'Risotto', precio_usd: 18, descripcion: 'Arroz cremoso con champiñones.', id_categoria: 3, es_combo: 0 },
  { nombre: 'Sopa del día', precio_usd: 8, descripcion: 'Preparación especial del día.', id_categoria: 2, es_combo: 0 },
  { nombre: 'Tiramisú', precio_usd: 8, descripcion: 'Postre italiano clásico.', id_categoria: 4, es_combo: 0 },
];

const imagenesDemo = [
  { nombre: 'Agua mineral', imagen: '/demo/agua-mineral.jpg' },
  { nombre: 'Brownie', imagen: '/demo/brwonie.jpg' },
  { nombre: 'Bruschetta', imagen: '/demo/bruschettas.jpg' },
  { nombre: 'Café americano', imagen: '/demo/cafe-americano.jpg' },
  { nombre: 'Café con leche', imagen: '/demo/cafe-con-leche.jpg' },
  { nombre: 'Calamares fritos', imagen: '/demo/calamares-fritos.jpg' },
  { nombre: 'Capuccino', imagen: '/demo/capuccino.jpg' },
  { nombre: 'Carne a la Parrilla', imagen: '/demo/carne-a-la-parrilla.jpg' },
  { nombre: 'Cerveza', imagen: '/demo/cerveza.jpg' },
  { nombre: 'Coctail', imagen: '/demo/coctail.jpg' },
  { nombre: 'Combo Almuerzo Ejecutivo', imagen: '/demo/almuerzo-ejecutivo.jpg' },
  { nombre: 'Combo Desayuno Americano', imagen: '/demo/desayuno-americano.jpg' },
  { nombre: 'Combo Infantil', imagen: '/demo/combo-infantil.jpg' },
  { nombre: 'Combo Pareja Pasta', imagen: '/demo/combo-pareja-pasta.jpg' },
  { nombre: 'Copa de vino', imagen: '/demo/copa-de-vino.jpg' },
  { nombre: 'Ensalada César', imagen: '/demo/ensalada-cesar.jpg' },
  { nombre: 'Ensalada mixta', imagen: '/demo/ensalada-mixta.jpg' },
  { nombre: 'Fruta fresca', imagen: '/demo/fruta-fresca.jpg' },
  { nombre: 'Gaseosa', imagen: '/demo/gaseosa.jpg' },
  { nombre: 'Helado', imagen: '/demo/helado.jpg' },
  { nombre: 'Jugo de frutas', imagen: '/demo/jugo-natural.jpg' },
  { nombre: 'Jugo de naranja', imagen: '/demo/jugo-natural.jpg' },
  { nombre: 'Nachos', imagen: '/demo/nachos.jpg' },
  { nombre: 'Pasta Alfredo', imagen: '/demo/pasta-alfredo.jpg' },
  { nombre: 'Pasta Boloñesa', imagen: '/demo/pasta-boloñesa.jpg' },
  { nombre: 'Pescado del día', imagen: '/demo/pescado-del-dia.jpg' },
  { nombre: 'Pollo a la Parrilla', imagen: '/demo/pollo-a-la-parrilla.jpg' },
  { nombre: 'Postre del día', imagen: '/demo/postre-dle-dia.jpg' },
  { nombre: 'Risotto', imagen: '/demo/risotto.jpg' },
  { nombre: 'Sopa del día', imagen: '/demo/sopa-del-dia.jpg' },
  { nombre: 'Tiramisú', imagen: '/demo/tiramisu.jpg' },
];

console.log('🔄 Agregando productos faltantes a restaurante-demo.db...\n');

let insertados = 0;

productosDemo.forEach(({ nombre, precio_usd, descripcion, id_categoria, es_combo }) => {
  dbDemo.run(
    "INSERT INTO productos (nombre, precio_usd, descripcion, id_categoria, es_combo, activo) VALUES (?, ?, ?, ?, ?, 1)",
    [nombre, precio_usd, descripcion, id_categoria, es_combo],
    function(err) {
      if (err) {
        console.log(`⚠️  Ya existe o error: ${nombre} - ${err.message}`);
      } else {
        console.log(`✅ Insertado: ${nombre}`);
        insertados++;
      }
    }
  );
});

setTimeout(() => {
  console.log(`\n🔄 Actualizando imágenes demo...\n`);
  
  let actualizados = 0;
  
  imagenesDemo.forEach(({ nombre, imagen }) => {
    dbDemo.run(
      "UPDATE productos SET imagen = ? WHERE nombre = ?",
      [imagen, nombre],
      function(err) {
        if (err) {
          console.log(`❌ Error: ${nombre} - ${err.message}`);
        } else {
          if (this.changes > 0) {
            console.log(`✅ Imagen: ${nombre} → ${imagen}`);
            actualizados++;
          } else {
            console.log(`⚠️  No encontrado: ${nombre}`);
          }
        }
      }
    );
  });
  
  setTimeout(() => {
    console.log(`\n📊 Resumen:`);
    console.log(`   - Productos insertados: ${insertados}`);
    console.log(`   - Imágenes actualizadas: ${actualizados}`);
    console.log(`\n✨ Proceso completado.`);
    dbDemo.close();
  }, 500);
  
}, 500);
