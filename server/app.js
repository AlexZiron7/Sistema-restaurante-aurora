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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

io.on('connection', (socket) => {
    console.log('📱 Dispositivo conectado:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('📴 Dispositivo desconectado:', socket.id);
    });
});

async function initTasaBCV() {
    const tasa = await obtenerTasaBCV();
    if (tasa) {
        getDb().run("UPDATE config SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE clave = 'tasa_bcv'", [tasa.toString()]);
    }
    return tasa;
}

if (!process.env.VITEST_DB) initTasaBCV();

const deps = { getDb, setModoDemo, upload, bcrypt, obtenerTasaBCV, path, fs };

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
