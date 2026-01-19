import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'https://backend-production-1710.up.railway.app';
    // Convert HTTP URL to WebSocket URL
    const wsUrl = apiUrl.replace(/^https?/, 'ws');
    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      newSocket.emit('authenticate', { userId: user.id });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('authenticated', (data) => {
      console.log('Socket authenticated', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const subscribeMigration = (migrationId) => {
    if (socket) {
      socket.emit('subscribe:migration', migrationId);
    }
  };

  const unsubscribeMigration = (migrationId) => {
    if (socket) {
      socket.emit('unsubscribe:migration', migrationId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, subscribeMigration, unsubscribeMigration }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
