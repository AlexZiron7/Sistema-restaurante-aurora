import { useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../contexts/ToastContext';

export default function SocketStatus() {
  const { socket } = useSocket();
  const { warning, success } = useToast();
  const wasDisconnected = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const onDisconnect = () => {
      wasDisconnected.current = true;
    };

    const onConnect = () => {
      if (wasDisconnected.current) {
        success('🔄 Conexión restablecida');
        wasDisconnected.current = false;
      }
    };

    const onReconnectAttempt = () => {
      warning('⚠️ Reconectando...');
    };

    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);
    socket.on('reconnect_attempt', onReconnectAttempt);

    return () => {
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
    };
  }, [socket]);

  return null;
}
