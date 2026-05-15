import React, { useState } from 'react';
import { motion } from 'framer-motion';

const LockScreen = ({ message, clientId }) => {
  const [reintentando, setReintentando] = useState(false);
  const [mensajeActual, setMensajeActual] = useState(message);
  const WHATSAPP_NUMBER = "584127108519"; 
  const whatsappMessage = encodeURIComponent(`Hola Aurora Devs, solicito activación para mi sistema.\n\nMi ID de Hardware es: ${clientId}`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  const handleRetry = async () => {
    setReintentando(true);
    try {
      const res = await fetch('/api/license-status/recheck', { method: 'POST' });
      const data = await res.json();
      if (!data.isSystemLocked) {
        window.location.reload();
      } else {
        setMensajeActual(data.lockMessage);
      }
    } catch (err) {
      console.error('Error al reintentar conexión:', err);
      setMensajeActual('Error de conexión al servidor. Verifique que el sistema esté ejecutándose.');
    } finally {
      setReintentando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0F19] text-white p-6 font-sans">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#151C2C]/80 backdrop-blur-xl rounded-[2.5rem] p-10 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden"
      >
        {/* Glow de fondo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/10 blur-[100px] rounded-full"></div>

        <div className="mb-10 flex justify-center relative">
          <div className="w-28 h-28 bg-white/5 rounded-3xl flex items-center justify-center p-4 border border-white/10 shadow-inner">
            <img 
              src="/logo-aplicacion.png" 
              alt="Aurora Logo" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            />
          </div>
        </div>
        
        <h1 className="text-3xl font-black mb-3 tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
          Activación Requerida
        </h1>
        
        <p className="text-slate-400 mb-10 text-lg font-medium leading-relaxed">
          {mensajeActual || 'El sistema no está activado para este equipo.'}
        </p>
        
        <div className="bg-black/40 backdrop-blur-md p-6 rounded-3xl mb-10 border border-white/5">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Tu ID de Hardware</p>
          <p className="text-2xl font-mono font-bold text-white tracking-widest select-all">{clientId || '---'}</p>
        </div>

        <div className="space-y-4">
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-white text-black hover:bg-slate-200 font-black py-5 rounded-2xl transition-all shadow-xl shadow-white/5"
          >
            <svg className="w-6 h-6 fill-green-600" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.888 11.888-11.888 3.176 0 6.161 1.237 8.404 3.48s3.481 5.229 3.481 8.406c0 6.555-5.332 11.887-11.887 11.887-2.01 0-3.987-.508-5.741-1.472l-6.144 1.696zm6.35-4.812l.312.186c1.474.875 3.172 1.337 4.907 1.337 5.176 0 9.387-4.211 9.387-9.387 0-2.507-.977-4.863-2.752-6.637s-4.13-2.751-6.635-2.751c-5.176 0-9.387 4.211-9.387 9.387 0 1.776.5 3.514 1.446 5.012l.204.323-.974 3.56 3.655-.939zm10.744-6.391c-.299-.149-1.771-.873-2.044-.973-.273-.099-.471-.148-.67.15-.197.297-.767.969-.94 1.167-.173.199-.347.223-.646.074-.3-.149-1.265-.465-2.41-1.487-.89-.793-1.49-1.773-1.665-2.071-.175-.299-.019-.461.13-.609.135-.133.299-.347.448-.521.151-.173.2-.296.3-.496.101-.198.05-.372-.025-.521-.075-.148-.672-1.618-.915-2.203-.235-.57-.47-.493-.646-.502-.167-.008-.362-.01-.557-.01-.195 0-.514.074-.784.37-.269.296-1.028 1.006-1.028 2.454 0 1.448 1.054 2.846 1.203 3.045.149.198 2.073 3.165 5.022 4.441.702.303 1.25.485 1.678.621.705.224 1.347.193 1.854.117.564-.085 1.771-.724 2.02-1.424.249-.699.249-1.299.174-1.424-.075-.124-.275-.198-.574-.348z"/></svg>
            Solicitar Activación
          </a>
          
          <button 
            onClick={handleRetry}
            disabled={reintentando}
            className="w-full bg-slate-800/50 text-slate-400 font-bold py-5 rounded-2xl hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reintentando ? 'Reintentando...' : 'Ya pagué, reintentar conexión'}
          </button>
        </div>

        <p className="mt-10 text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
          Powered by Aurora Devs
        </p>
      </motion.div>
    </div>
  );
};

export default LockScreen;
