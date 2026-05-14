# 🍽️ Sistema Restaurante - Aurora POS

Sistema integral de gestión para restaurantes (POS) diseñado para ser robusto, ligero y fácil de instalar en entornos locales.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Tech](https://img.shields.io/badge/stack-Node.js%20%7C%20React%20%7C%20SQLite-green.svg)](#tecnologias)

## 🚀 Características Principales
- **Dashboard en Tiempo Real:** Control total de mesas, pedidos y estado de cocina.
- **Multidispositivo:** Acceso desde tablets y móviles en la misma red local.
- **Modo Offline:** Base de datos SQLite local, no depende de internet para funcionar.
- **Sistema de Combos:** Creación y gestión de promociones complejas.
- **Tasa BCV Automática:** Integración con la tasa oficial del día (Bs/USD).
- **Instalador Profesional:** Empaquetado como `.exe` con actualizaciones automáticas.

## 🛠️ Tecnologías
- **Backend:** Node.js, Express, Socket.io, SQLite3.
- **Frontend:** React (Vite), Tailwind CSS, Framer Motion.
- **Herramientas:** Inno Setup (Instalador), Pkg (Compilación binaria).

## 📂 Documentación Completa
Hemos preparado guías detalladas para cada tipo de usuario:

### 📖 Para el Cliente / Administrador
- [**Manual de Usuario**](docs/USER_GUIDE.md) - Cómo operar el sistema día a día.
- [**Guía de Instalación**](Guia-de-Instalacion.md) - Pasos para poner en marcha el servidor.
- [**Solución de Problemas**](docs/TROUBLESHOOTING.md) - Preguntas frecuentes y errores comunes.

### 💻 Para Desarrolladores
- [**Guía de Desarrollo y Arquitectura**](docs/DEVELOPER_GUIDE.md) - Estructura del código y lógica interna.
- [**Esquema de Base de Datos**](docs/DATABASE_SCHEMA.md) - Diccionario de tablas y relaciones.
- [**Referencia de API**](docs/API_REFERENCE.md) - Documentación de endpoints y sockets.
- [**Sistema de Migraciones**](docs/MIGRATIONS.md) - Cómo actualizar el esquema en producción.

---

## ⚡ Inicio Rápido (Desarrollo)

1. **Clonar y Preparar:**
   ```bash
   git clone https://github.com/AlexZiron7/Sistema-restaurante-aurora.git
   cd Sistema-restaurante-aurora
   npm run postinstall
   ```

2. **Ejecutar:**
   ```bash
   # Iniciar todo (Backend + Frontend)
   ./Empezar-Restaurante.bat
   ```

## 📜 Licencia
Este proyecto es propiedad de **Aurora Devs**. Todos los derechos reservados.
