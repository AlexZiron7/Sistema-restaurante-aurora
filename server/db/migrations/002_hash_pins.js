const bcrypt = require('bcryptjs');

module.exports = {
  name: '002_hash_pins',
  up: function(db, callback) {
    const SALT_ROUNDS = 10;

    db.all("SELECT id, pin_acceso FROM usuarios WHERE pin_acceso IS NOT NULL AND pin_acceso NOT LIKE '$2%'", [], (err, rows) => {
      if (err) return callback(err);
      if (!rows || rows.length === 0) return callback(null);

      let completed = 0;
      rows.forEach((row) => {
        bcrypt.hash(row.pin_acceso, SALT_ROUNDS, (err, hash) => {
          if (err) return callback(err);
          db.run("UPDATE usuarios SET pin_acceso = ? WHERE id = ?", [hash, row.id], (err2) => {
            if (err2) return callback(err2);
            completed++;
            if (completed === rows.length) callback(null);
          });
        });
      });
    });
  }
};
