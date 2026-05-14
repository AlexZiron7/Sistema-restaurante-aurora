@echo off
title Sistema Restaurante - Servidor
color 0A

echo ========================================================
echo        INICIANDO EL SISTEMA DE RESTAURANTE
echo ========================================================
echo.
echo Por favor, no cierres esta ventana mientras el sistema
echo este en uso. Para apagarlo, simplemente cierra la ventana.
echo.

:: 1. Iniciar servidor backend en segundo plano
echo [1/3] Iniciando el servidor principal...
start /B "Backend" node server.js

:: Esperar un momento a que levante el backend
timeout /t 3 /nobreak > NUL

:: 2. Iniciar el frontend (Vite)
echo [2/3] Iniciando la interfaz visual...
cd client
start /B "Frontend" npm run dev -- --host

:: Esperar a que vite levante
timeout /t 4 /nobreak > NUL

:: 3. Abrir el navegador en App Mode (simulando aplicacion nativa)
echo [3/3] Abriendo el sistema...
:: Intentar abrir con Chrome en modo app, si falla, intentar con Edge
start chrome.exe --app="http://localhost:5173" || start msedge.exe --app="http://localhost:5173" || start http://localhost:5173

echo.
echo ========================================================
echo TODO LISTO. EL SISTEMA ESTA FUNCIONANDO CORRECTAMENTE.
echo Puedes conectar tus tablets buscando la IP local de esta PC
echo en el puerto 5173.
echo ========================================================
echo.

:: Mantener la consola abierta
pause
