import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { type IMessage } from '../types';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  messages: IMessage[];
  sendMessage: (content: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Подключаемся к бэкенду и передаем JWT вauth
    const newSocket = io('http://localhost:5000', {
      auth: { token },
    });

    setSocket(newSocket);

    // Слушаем входящие сообщения
    newSocket.on('message:receive', (message: IMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  const sendMessage = (content: string) => {
    if (socket && content.trim()) {
      socket.emit('message:send', { content });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, messages, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket должен использоваться внутри SocketProvider');
  return context;
};