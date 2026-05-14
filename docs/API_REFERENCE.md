# 🚀 Referencia de API (REST & Sockets)

El servidor corre por defecto en el puerto `4001`. Todos los endpoints de la API comienzan con `/api`.

## 🔐 Autenticación
- **POST `/api/auth/login`**: Inicia sesión con usuario y PIN.
- **GET `/api/auth/me`**: Retorna el perfil del usuario actual.

## 🪑 Mesas
- **GET `/api/mesas`**: Lista todas las mesas y sus estados.
- **PATCH `/api/mesas/:id`**: Actualiza el estado de una mesa.

## 📋 Pedidos
- **GET `/api/pedidos`**: Lista pedidos abiertos.
- **POST `/api/pedidos`**: Crea un nuevo pedido.
- **POST `/api/pedidos/:id/items`**: Añade platos a un pedido existente.
- **PATCH `/api/pedidos/:id/cerrar`**: Cierra la cuenta y procesa el pago.

## 🍔 Productos y Categorías
- **GET `/api/productos`**: Lista el menú completo.
- **GET `/api/categorias`**: Lista las categorías disponibles.

## ⚙️ Configuración y Sistema
- **GET `/api/config`**: Obtiene la configuración global (Tasa BCV, etc.).
- **GET `/api/updates/check`**: Consulta si hay una nueva versión en el servidor remoto.
- **POST `/api/updates/install`**: Inicia la descarga e instalación de una actualización.

## 🔌 WebSockets (Socket.io)
Eventos principales:
- `nuevo_pedido`: Emitido cuando se crea un pedido para la cocina.
- `plato_listo`: Emitido por cocina cuando un item está preparado.
- `mesa_actualizada`: Emitido cuando el estado de una mesa cambia (ej. de ocupada a cuenta solicitada).

---
> [!TIP]
> Para probar la API, puedes usar herramientas como **Postman** o **Insomnia** apuntando a `http://localhost:4001/api`.
