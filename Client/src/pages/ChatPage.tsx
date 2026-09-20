import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { messages, sendMessage } = useSocket();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Боковая панель */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-lg text-indigo-400">Pulsr Chat</span>
          <button
            onClick={logout}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition"
          >
            Выйти
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Профиль</div>
          <div className="flex items-center space-x-3 p-2 bg-slate-950 rounded-xl border border-slate-800/60">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-sm text-slate-200">{user?.username}</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                В сети
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основная область чата */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {/* Шапка чата */}
        <div className="h-16 border-b border-slate-800 px-6 flex items-center bg-slate-900/50 backdrop-blur">
          <h3 className="font-semibold text-slate-200">Общий чат</h3>
        </div>

        {/* Список сообщений */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => {
            const isMe = typeof msg.sender === 'object' 
              ? msg.sender.id === user?.id 
              : false; // Зависит от того, как бэкенд возвращает sender

            return (
              <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="max-w-[70%] bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="text-xs text-indigo-400 font-medium mb-1">
                    {typeof msg.sender === 'object' ? msg.sender.username : 'Пользователь'}
                  </div>
                  <p className="text-sm text-slate-200 break-words">{msg.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Форма отправки сообщения */}
        <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Написать сообщение..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
};