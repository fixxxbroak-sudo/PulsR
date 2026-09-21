import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

const ChatPage: React.FC = () => {
  interface Message {
    _id: string;
    sender: {
      _id: string;
      username: string;
      avatarUrl?: string;
    };
    recipient: string;
    text: string;
    createdAt?: string;
  }

  interface ChatProps {
    currentUserId: string;
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string;
    socket: Socket;
    conversations?: Array<{ id: string; name: string; avatar?: string }>;
    onSelectConversation?: (id: string) => void;
  }

  const Messenger: React.FC<ChatProps> = ({
    currentUserId,
    recipientId,
    recipientName,
    recipientAvatar,
    socket,
    conversations = [],
    onSelectConversation,
  }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      // Регистрируем юзера в сокетах
      socket.emit('register_user', currentUserId);

      const handleReceiveMessage = (message: Message) => {
        if (
          message.sender._id === recipientId ||
          message.sender._id === currentUserId
        ) {
          setMessages((prev) => [...prev, message]);
        }
      };

      const handleMessageSent = (message: Message) => {
        setMessages((prev) => [...prev, message]);
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('message_sent', handleMessageSent);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('message_sent', handleMessageSent);
      };
    }, [socket, currentUserId, recipientId]);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim()) return;

      socket.emit('send_message', {
        senderId: currentUserId,
        recipientId,
        text: inputText,
      });

      setInputText('');
    };

    return (
      <div className="flex h-screen bg-[#1e2229] text-white font-sans overflow-hidden">
        {/* Левая панель с аватарами/чатами */}
        <div className="w-20 bg-[#16191f] flex flex-col items-center py-6 space-y-4 border-r border-[#2a2f38]">
          {/* Логотип или главная кнопка */}
          <div className="w-12 h-12 rounded-full bg-[#2a2f38] flex items-center justify-center text-blue-400 font-bold mb-4 cursor-pointer">
            P
          </div>

          {/* Список аватаров чатов из макета */}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation?.(conv.id)}
              className="w-12 h-12 rounded-full bg-[#363b46] hover:bg-blue-600 transition cursor-pointer flex items-center justify-center overflow-hidden"
            >
              {conv.avatar ? (
                <img src={conv.avatar} alt={conv.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold">{conv.name[0]}</span>
              )}
            </div>
          ))}
        </div>

        {/* Основная область чата */}
        <div className="flex-1 flex flex-col">
          {/* Шапка профиля / чата */}
          <div className="h-20 bg-[#1e2229] border-b border-[#2a2f38] flex items-center px-8 space-x-4">
            <div className="w-10 h-10 rounded-full bg-[#363b46] overflow-hidden flex items-center justify-center">
              {recipientAvatar ? (
                <img src={recipientAvatar} alt={recipientName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold">{recipientName?.[0] || 'U'}</span>
              )}
            </div>
            <span className="text-lg font-medium tracking-wide">{recipientName || 'Имя пользователя'}</span>
          </div>

          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {messages.map((msg) => {
              const isMe = msg.sender._id === currentUserId;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[45%] px-5 py-3.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-[#d9d9d9] text-black rounded-br-none'
                        : 'bg-[#d9d9d9] text-black rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Инпут отправки сообщения */}
          <div className="p-6 bg-[#1e2229]">
            <form onSubmit={sendMessage} className="flex gap-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Введите сообщение..."
                className="flex-1 bg-[#2a2f38] text-white placeholder-gray-400 px-6 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 transition px-8 py-3.5 rounded-xl font-medium"
              >
                Отправить
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };
};
export default ChatPage;