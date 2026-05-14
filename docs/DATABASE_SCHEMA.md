# 🗄️ Esquema de Base de Datos

El sistema utiliza **SQLite 3**. El archivo de base de datos se encuentra en la raíz como `restaurante.db`.

## 📊 Tablas Principales

### 1. `usuarios`
Almacena al personal del restaurante.
- `id`: PK Autoincrement.
- `usuario`: Nombre de acceso (único).
- `pin_acceso`: Código de 4-6 dígitos.
- `rol`: `dueno`, `admin`, `gerente`, `cajero`, `mesonero`.

### 2. `mesas`
- `numero_mesa`: Único.
- `estado`: `libre`, `ocupada`, `cuenta_solicitada`.

### 3. `productos`
- `nombre`: Nombre del plato/bebida.
- `precio_usd`: Precio base en dólares.
- `id_categoria`: FK -> `categorias`.
- `es_combo`: Boolean (1 si es combo).
- `productos_incluidos`: Texto (JSON) con IDs de productos si es combo.

### 4. `pedidos`
- `id_mesa`: FK -> `mesas`.
- `id_mesonero`: FK -> `usuarios`.
- `estado`: `abierto`, `cerrado`, `anulado`.
- `metodo_pago`: `efectivo`, `punto`, `pago_movil`, `zelle`.
- `total`: Monto final cobrado.

### 5. `items_pedido`
- `id_pedido`: FK -> `pedidos`.
- `nombre_producto`: Nombre al momento de pedir (para historial histórico).
- `estado`: `en_cocina`, `preparando`, `listo`, `entregado`.

### 6. `config`
Almacena variables globales del sistema (Tasa BCV, nombre del negocio, etc.).

---
## 🔗 Relaciones
- Un `pedido` pertenece a una `mesa` y un `usuario`.
- Un `pedido` tiene muchos `items_pedido`.
- Un `producto` pertenece a una `categoria`.
