# 🛠️ Guía de Desarrollo y Arquitectura

Esta guía detalla la estructura técnica del sistema para su mantenimiento y escalabilidad.

## 🏗️ Arquitectura del Sistema
El sistema utiliza una arquitectura de **Monolito de Servicios**:
- **Backend (server.js):** API REST y WebSockets (Socket.io).
- **Frontend (client/):** SPA construida con React + Vite.
- **Base de Datos:** SQLite (un solo archivo `.db` por entorno).

## 📂 Estructura del Proyecto
- `/client`: Aplicación React.
- `/server/db`: Lógica de base de datos y migraciones.
- `/server/routes`: Definición de endpoints API.
- `/public/uploads`: Imágenes de productos cargadas por el usuario.
- `/scripts`: Scripts de utilidad para compilación.

## 📦 Proceso de Compilación (Build)
Para generar el producto final para el cliente, se siguen estos pasos:

1.  **Compilar Frontend:** `cd client && npm run build`. Esto genera archivos estáticos en `client/dist`.
2.  **Empaquetar Binario:** `npx pkg .`. Esto toma el servidor y el frontend compilado y genera un único `.exe` en `dist/`.
3.  **Generar Instalador:** Usa Inno Setup con el archivo `dist-setup.iss` para crear el ejecutable de instalación final.

## 🔄 Sistema de Comunicación (Sockets)
Usamos Socket.io para la sincronización en tiempo real:
- Cuando se crea un pedido, se emite un evento a los dispositivos de cocina.
- Cuando la cocina termina un plato, se emite un evento a los mesoneros.

## 🛡️ Seguridad
- Los PINs de acceso se manejan como texto plano en versiones iniciales, pero el sistema está preparado para hashing con `bcryptjs`.
- El acceso a las rutas `/api` está abierto por defecto para facilitar la conexión de tablets en red local privada.

---
> [!IMPORTANT]
> **Variable de Entorno:** Si necesitas cambiar el puerto o la ruta de la base de datos, crea un archivo `.env` en la raíz basado en `.env.example`.
