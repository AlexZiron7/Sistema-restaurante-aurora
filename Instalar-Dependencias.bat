@echo off
title Instalador de Dependencias - Sistema Restaurante
color 0B

echo ========================================================
echo   INSTALANDO DEPENDENCIAS DEL SISTEMA DE RESTAURANTE
echo ========================================================
echo.

:: 1. Instalando dependencias del Servidor (Backend)
echo [1/2] Instalando dependencias del Servidor (Backend)...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un problema instalando las dependencias del Servidor.
    pause
    exit /b %errorlevel%
)

echo.
echo ✅ Servidor listo.
echo.

:: 2. Instalando dependencias del Cliente (Frontend)
echo [2/2] Instalando dependencias de la Interfaz (Frontend)...
cd client
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un problema instalando las dependencias del Cliente.
    pause
    exit /b %errorlevel%
)

echo.
echo ✅ Interfaz lista.
echo.

cd ..

echo ========================================================
echo   INSTALACION COMPLETADA EXITOSAMENTE
echo ========================================================
echo.
echo Ya puedes iniciar el sistema usando: Empezar-Restaurante.bat
echo.
pause
