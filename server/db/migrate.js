const path = require('path');
const fs = require('fs');

function getAppliedMigrations(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM _migrations ORDER BY name", [], (err, rows) => {
      if (err) {
        if (err.message.includes('no such table')) {
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        resolve(rows.map(r => r.name));
      }
    });
  });
}

function applyMigration(db, migration) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      migration.up(db, (err) => {
        if (err) return reject(err);
        db.run("INSERT OR IGNORE INTO _migrations (name) VALUES (?)", [migration.name], (err2) => {
          if (err2) return reject(err2);
          resolve();
        });
      });
    });
  });
}

async function runMigrations(db) {
  // Ensure migrations table exists
  db.run(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js'))
    .sort();

  const applied = await getAppliedMigrations(db);

  for (const file of files) {
    const migration = require(path.join(migrationsDir, file));
    if (applied.includes(migration.name)) continue;

    console.log(`📦 Migrando: ${migration.name}...`);
    await applyMigration(db, migration);
    console.log(`✅ Migración aplicada: ${migration.name}`);
  }
}

module.exports = { runMigrations };
