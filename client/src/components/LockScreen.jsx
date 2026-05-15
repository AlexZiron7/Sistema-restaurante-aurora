import React from 'react';
import { motion } from 'framer-motion';

const LockScreen = ({ message }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900 text-white p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-800 rounded-3xl p-10 text-center shadow-2xl border border-slate-700"
      >
        <div className="mb-6 flex justify-center">
          <div className="bg-red-500/20 p-5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7h3a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Sistema Suspendido</h1>
        
        <p className="text-slate-400 mb-8 leading-relaxed">
          {message || 'Se ha detectado una irregularidad con su licencia o hay pagos pendientes.'}
        </p>
        
        <div className="bg-slate-700/50 p-4 rounded-xl mb-8">
          <p className="text-sm text-slate-300">
            Comuníquese con el administrador para reactivar su servicio.
          </p>
          <p className="font-bold text-blue-400 mt-2">Soporte: Aurora Devs</p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-colors"
        >
          Reintentar Conexión
        </button>
      </motion.div>
    </div>
  );
};

export default LockScreen;
