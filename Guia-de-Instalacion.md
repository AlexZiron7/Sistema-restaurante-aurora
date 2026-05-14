# 🚀 Guía de Instalación: Sistema de Gestión de Restaurante

Esta guía contiene los pasos necesarios para instalar, configurar y poner en marcha el sistema de restaurante desde cero en tu computadora local.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

1. **Node.js (Versión 18 o superior)**
   * Descárgalo en: [nodejs.org](https://nodejs.org/)
   * Verifica la instalación abriendo una terminal y escribiendo: `node -v`
2. **Navegador Web Moderno**
   * Se recomienda **Google Chrome** para el "Modo App", aunque también funciona en Microsoft Edge.

---

## 📦 Instalación con el Ejecutable (Recomendado para Producción)

Si ya tienes el archivo `Setup-SistemaRestaurante-v1.x.x.exe`:
1.  Haz doble clic en el instalador.
2.  Sigue los pasos y asegúrate de marcar **"Agregar excepción de Firewall"**.
3.  Al finalizar, tendrás un acceso directo en tu escritorio.

---

## 🛠️ Instalación para Desarrolladores (Código Fuente)

### 1. Opción A: Instalación Automática (Recomendado)

Hemos incluido un archivo que descarga e instala todo lo necesario por ti:
👉 **`Instalar-Dependencias.bat`**

Este archivo:
1.  Instala automáticamente las dependencias del Servidor (Backend).
2.  Instala automáticamente las dependencias de la Interfaz (Frontend).

---

### 2. Opción B: Instalación Manual

Si prefieres hacerlo tú mismo desde una terminal (CMD o PowerShell):

1. **En la carpeta raíz del proyecto:**

   ```bash
   npm install
   ```

2. **En la carpeta `client`:**

   ```bash
   cd client
   npm install
   ```

---

## 🚀 Cómo Iniciar el Sistema

### Opción A: Inicio Automático (Recomendado para Windows)
Hemos incluido un archivo que hace todo por ti. Simplemente haz doble clic en:
👉 **`Empezar-Restaurante.bat`**

Este archivo:
1.  Inicia el servidor backend.
2.  Inicia el servidor frontend (Vite).
3.  Abre el navegador automáticamente en "Modo Aplicación".

### Opción B: Inicio Manual
Si prefieres iniciarlo manualmente desde la terminal:

1.  **Terminal 1 (Backend):**
    ```bash
    node server.js
    ```
2.  **Terminal 2 (Frontend):**
    ```bash
    cd client
    npm run dev
    ```

---

## 🔐 Credenciales por Defecto

Al iniciar por primera vez, el sistema crea automáticamente los siguientes usuarios:

| Usuario | PIN de Acceso | Rol / Función |
| :--- | :--- | :--- |
| `dueno` | `0000` | Dueño (Acceso Total) |
| `admin` | `1234` | Administrador |
| `gerente` | `1111` | Gerente |
| `caja1` | `2222` | Cajero |
| `mesonero1` | `3333` | Mesonero |

> [!TIP]
> Puedes cambiar estos PINs y nombres desde el panel de administración una vez entres con el usuario `dueno` o `admin`.

---

## 📱 Conexión desde Tablets y Móviles

Para que tus mesoneros usen el sistema desde sus propios dispositivos:

1.  Asegúrate de que la computadora principal y las tablets estén en la **misma red Wi-Fi**.
2.  En la computadora principal, busca tu **IP Local** (escribe `ipconfig` en el CMD).
3.  En la tablet, abre el navegador e ingresa:
    `http://TU-IP-LOCAL:5173`
    *(Ejemplo: http://192.168.1.50:5173)*

---

## 📁 Estructura del Proyecto
*   `/` (Raíz): Servidor, base de datos SQLite (`restaurante.db`) y scripts de utilidad.
*   `/client`: Código fuente de la interfaz (React + Vite).
*   `/public`: Archivos estáticos y logos.
*   `/server`: Controladores y lógica adicional del servidor.

---

> [!IMPORTANT]
> **Soporte:** Para cualquier duda técnica, contacta a Aurora Devs a través de los canales configurados en el panel de soporte del sistema.
