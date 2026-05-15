import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(socket);

  useEffect(() => {
    if (!socket) {
      socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });
      socketRef.current = socket;
    }

    const s = socketRef.current;

    s.on('connect', () => {
      setConnected(true);
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      s.off('connect');
      s.off('disconnect');
    };
  }, []);

  return socketRef.current;
}
