# 🔄 Sistema de Migraciones

Para actualizar la base de datos en las PCs de tus clientes sin borrar sus datos, usamos el sistema de migraciones automáticas.

## 📁 Ubicación
Los archivos de migración se encuentran en `server/db/migrations/`.

## 🆕 Cómo crear una nueva migración
1.  Crea un archivo `.js` con prefijo numérico, ejemplo: `003-añadir-stock.js`.
2.  Define la lógica `up` (subida).

### Ejemplo de estructura:
```javascript
module.exports = {
    name: '003-añadir-stock', // Debe ser único
    up: (db, callback) => {
        // Ejecuta SQL para modificar la base de datos
        db.run("ALTER TABLE productos ADD COLUMN stock INTEGER DEFAULT 0", callback);
    }
};
```

## 🛠️ Ejecución
- Las migraciones se ejecutan **automáticamente** cada vez que el servidor inicia.
- El sistema guarda un registro en la tabla `_migrations` de la base de datos del cliente para saber qué archivos ya se aplicaron.

## ⚠️ Reglas de Oro
1.  **Nunca** borres o edites una migración que ya fue enviada a un cliente. Crea una nueva.
2.  Prueba siempre las migraciones localmente antes de generar el nuevo instalador.
3.  Usa nombres descriptivos para los archivos.
