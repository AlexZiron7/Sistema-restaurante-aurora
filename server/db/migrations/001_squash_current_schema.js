module.exports = {
  name: '001_squash_current_schema',
  up: function(db, callback) {
    const statements = [
      `ALTER TABLE pedidos ADD COLUMN porcentaje_propina REAL DEFAULT 0`,
      `ALTER TABLE pedidos ADD COLUMN metodo_pago TEXT DEFAULT NULL`,
      `ALTER TABLE pedidos ADD COLUMN numero_mesa INTEGER DEFAULT NULL`,
      `ALTER TABLE pedidos ADD COLUMN nombre_mesonero TEXT DEFAULT NULL`,
      `ALTER TABLE pedidos ADD COLUMN fecha_cierre DATETIME DEFAULT NULL`,
      `ALTER TABLE mesas ADD COLUMN capacidad INTEGER DEFAULT 4`,
      `ALTER TABLE categorias ADD COLUMN icono TEXT DEFAULT '🍽️'`,
      `ALTER TABLE productos ADD COLUMN descripcion TEXT DEFAULT ''`,
      `ALTER TABLE pedidos ADD COLUMN datos_pago TEXT DEFAULT NULL`,
      `ALTER TABLE productos ADD COLUMN es_combo INTEGER DEFAULT 0`,
      `ALTER TABLE productos ADD COLUMN productos_incluidos TEXT DEFAULT NULL`,
      `ALTER TABLE productos ADD COLUMN precio_combo REAL DEFAULT NULL`,
      `ALTER TABLE productos ADD COLUMN imagen TEXT DEFAULT NULL`,
    ];

    let idx = 0;
    function next() {
      if (idx >= statements.length) return callback(null);
      const stmt = statements[idx++];
      db.run(stmt, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          return callback(err);
        }
        next();
      });
    }
    next();
  }
};
