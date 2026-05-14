const { checkForUpdates, downloadAndInstall } = require('../updater');

module.exports = (app, io, deps) => {
    
    // Consultar si hay actualizaciones
    app.get('/api/updates/check', async (req, res) => {
        try {
            const update = await checkForUpdates();
            res.json(update);
        } catch (error) {
            res.status(500).json({ error: 'Error al buscar actualizaciones' });
        }
    });

    // Iniciar la descarga e instalación
    app.post('/api/updates/install', async (req, res) => {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL de descarga requerida' });

        res.json({ message: 'Descarga iniciada. El sistema se cerrará pronto.' });

        try {
            await downloadAndInstall(url);
        } catch (error) {
            console.error('Error en la instalación:', error);
            // Nota: Aquí el cliente podría no recibir respuesta si el proceso muere,
            // pero downloadAndInstall ya maneja el cierre del proceso.
        }
    });
};
