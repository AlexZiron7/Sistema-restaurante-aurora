# 🛠️ Solución de Problemas (Troubleshooting)

## 📱 Las tablets no se conectan al servidor
1.  **Red Wi-Fi:** Asegúrate de que la PC Servidor y las tablets estén en la misma red.
2.  **IP Incorrecta:** La IP de la PC puede cambiar. Verifica la IP actual escribiendo `ipconfig` en la terminal de la PC.
3.  **Firewall:** Si el instalador no agregó la excepción, desactiva temporalmente el Firewall de Windows para probar.
4.  **Puerto:** Asegúrate de estar usando el puerto `5173` (ejemplo: `http://192.168.1.50:5173`).

## 🖥️ El servidor no arranca
1.  **Node.js:** Verifica que Node.js esté instalado (`node -v`).
2.  **Puerto ocupado:** Si otro programa usa el puerto 4001 o 5173, el sistema fallará. Cierra programas como Skype o servidores web antiguos.
3.  **Base de datos bloqueada:** Si tienes el archivo `restaurante.db` abierto en un editor externo, el servidor no podrá escribir en él.

## 🔄 La actualización automática falla
1.  **Internet:** El servidor requiere internet para consultar la nueva versión (aunque el sistema local funcione offline).
2.  **Permisos:** Asegúrate de ejecutar el programa como Administrador para que pueda descargar e instalar la nueva versión en la carpeta de Sistema.

## 💰 La tasa del dólar no se actualiza
1.  **Conexión:** El sistema requiere acceso a internet para consultar la página del BCV.
2.  **Bloqueo de Página:** A veces la página del BCV está caída. En ese caso, debes cambiar la tasa manualmente en **Configuración**.

---
Para soporte técnico avanzado, contacta a **Aurora Devs**.
