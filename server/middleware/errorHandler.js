function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, err.message);

  if (res.headersSent) return;

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

function setupGlobalErrorHandlers() {
  process.on('uncaughtException', (err) => {
    console.error(`[${new Date().toISOString()}] ❌ UNCAUGHT EXCEPTION:`, err.message);
  });

  process.on('unhandledRejection', (reason) => {
    console.error(`[${new Date().toISOString()}] ❌ UNHANDLED REJECTION:`, reason?.message || reason);
  });
}

module.exports = { errorHandler, setupGlobalErrorHandlers };
