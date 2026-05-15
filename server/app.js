const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb, setModoDemo } = require('../database');

const bcrypt = require('bcryptjs');
const { obtenerTasaBCV } = require('../services/tasaBcv');
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware, requireRol, crearToken, destruirToken } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimiter');
const { getLockStatus, checkLicenseStatus } = require('./licenseManager');

const appRoot = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '..');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(appRoot, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes'));
    }
});

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:4001', 'http://localhost:5173', 'http://localhost'];

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    }
}));
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- SISTEMA DE LICENCIA (KILL SWITCH) ---
app.use((req, res, next) => {
    const { isSystemLocked, lockMessage } = getLockStatus();
    
    // Si el sistema está bloqueado, solo permitimos peticiones de estado, 
    // todo lo demás (pedidos, auth, etc.) se bloquea.
    // Permitir archivos estáticos básicos (imágenes, iconos, css) para que la pantalla de bloqueo se vea bien
    const isStaticResource = /\.(png|jpg|jpeg|gif|ico|css|svg)$/i.test(req.path);

    if (isSystemLocked && !req.path.startsWith('/api/license-status') && !isStaticResource) {
        return res.status(403).json({
            locked: true,
            message: lockMessage
        });
    }
    next();
});

// Ruta para que el frontend sepa si debe mostrar la pantalla de bloqueo
app.get('/api/license-status', (req, res) => {
    res.json(getLockStatus());
});

// Ruta para que el frontend reintente la verificación de licencia
app.post('/api/license-status/recheck', async (req, res) => {
    console.log('[License] Reintento manual solicitado desde el frontend.');
    await checkLicenseStatus('reintento_frontend');
    const status = getLockStatus();
    console.log('[License] Respuesta al reintento:', JSON.stringify(status));
    res.json(status);
});
// ------------------------------------------

app.use(express.json({ limit: '10mb' }));

app.use('/api', authMiddleware);
app.use('/api/auth/login', rateLimiter);

io.on('connection', (socket) => {
    console.log('📱 Dispositivo conectado:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('📴 Dispositivo desconectado:', socket.id);
    });
});

async function initTasaBCV() {
    try {
        const tasa = await obtenerTasaBCV();
        if (tasa) {
            const db = getDb();
            if (db) {
                db.run("UPDATE config SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE clave = 'tasa_bcv'", [tasa.toString()]);
            }
        }
        return tasa;
    } catch (error) {
        console.error('⚠️ Error al inicializar Tasa BCV:', error.message);
        return null;
    }
}

if (!process.env.VITEST_DB) initTasaBCV();

const deps = { getDb, setModoDemo, upload, bcrypt, obtenerTasaBCV, path, fs, appRoot, crearToken, destruirToken };

require('./routes/auth.routes')(app, io, deps);
require('./routes/mesas.routes')(app, io, deps);
require('./routes/pedidos.routes')(app, io, deps);
require('./routes/productos.routes')(app, io, deps);
require('./routes/categorias.routes')(app, io, deps);
require('./routes/usuarios.routes')(app, io, deps);
require('./routes/config.routes')(app, io, deps);
require('./routes/cocina.routes')(app, io, deps);
require('./routes/stats.routes')(app, io, deps);
require('./routes/reportes.routes')(app, io, deps);
require('./routes/backup.routes')(app, io, deps);
require('./routes/update.routes')(app, io, deps);

// Servir build de cliente en producción (auto-detecta si existe)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(clientDist, 'index.html'));
    });
    console.log('🌐 Sirviendo cliente compilado desde client/dist/');
}

// Middleware global de errores (debe ir al final, después de todas las rutas)
app.use(errorHandler);

module.exports = { app, server, io, appRoot };
