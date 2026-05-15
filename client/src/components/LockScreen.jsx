import React from 'react';
import { motion } from 'framer-motion';

const LockScreen = ({ message, clientId }) => {
  const WHATSAPP_NUMBER = "584123456789"; // Pon tu número aquí
  const whatsappMessage = encodeURIComponent(`Hola Aurora Devs, solicito activación para mi sistema.\n\nMi ID de Hardware es: ${clientId}`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 text-white p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 rounded-[2rem] p-8 text-center shadow-2xl border border-slate-800"
      >
        <div className="mb-8 flex justify-center">
          <div className="bg-blue-500/10 p-6 rounded-full relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-black mb-2 tracking-tight">Activación Requerida</h1>
        <p className="text-slate-400 mb-8 text-lg px-4">
          {message || 'El sistema no está activado para este equipo.'}
        </p>
        
        <div className="bg-slate-800/50 p-6 rounded-2xl mb-8 border border-slate-700/50">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tu ID de Hardware único</p>
          <p className="text-2xl font-mono font-bold text-blue-400 select-all">{clientId || 'DETECTANDO...'}</p>
        </div>

        <div className="space-y-3">
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-green-900/20"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.888 11.888-11.888 3.176 0 6.161 1.237 8.404 3.48s3.481 5.229 3.481 8.406c0 6.555-5.332 11.887-11.887 11.887-2.01 0-3.987-.508-5.741-1.472l-6.144 1.696zm6.35-4.812l.312.186c1.474.875 3.172 1.337 4.907 1.337 5.176 0 9.387-4.211 9.387-9.387 0-2.507-.977-4.863-2.752-6.637s-4.13-2.751-6.635-2.751c-5.176 0-9.387 4.211-9.387 9.387 0 1.776.5 3.514 1.446 5.012l.204.323-.974 3.56 3.655-.939zm10.744-6.391c-.299-.149-1.771-.873-2.044-.973-.273-.099-.471-.148-.67.15-.197.297-.767.969-.94 1.167-.173.199-.347.223-.646.074-.3-.149-1.265-.465-2.41-1.487-.89-.793-1.49-1.773-1.665-2.071-.175-.299-.019-.461.13-.609.135-.133.299-.347.448-.521.151-.173.2-.296.3-.496.101-.198.05-.372-.025-.521-.075-.148-.672-1.618-.915-2.203-.235-.57-.47-.493-.646-.502-.167-.008-.362-.01-.557-.01-.195 0-.514.074-.784.37-.269.296-1.028 1.006-1.028 2.454 0 1.448 1.054 2.846 1.203 3.045.149.198 2.073 3.165 5.022 4.441.702.303 1.25.485 1.678.621.705.224 1.347.193 1.854.117.564-.085 1.771-.724 2.02-1.424.249-.699.249-1.299.174-1.424-.075-.124-.275-.198-.574-.348z"/></svg>
            Activar por WhatsApp
          </a>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-slate-800 text-slate-300 font-bold py-5 rounded-2xl hover:bg-slate-700 transition-colors"
          >
            Ya pagué, reintentar
          </button>
        </div>

        <p className="mt-8 text-xs text-slate-500 font-medium">
          © 2026 Aurora Devs · Sistema de Gestión Gastronómica
        </p>
      </motion.div>
    </div>
  );
};

export default LockScreen;
