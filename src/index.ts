import express from 'express'
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db';
import { User } from './models/User';
import { Message } from './models/Message';
import { authMiddleware, AuthRequest } from './middleware/authMiddleware';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Создаём HTTP-сервер для совместной работы Express и Socket.io
const server = http.createServer(app);

// Инициализируем Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

connectDB();

// ==========================================
// 1. REAL-TIME СООБЩЕНИЯ (SOCKET.IO)
// ==========================================

// Хранилище онлайн-пользователей: userId -> socketId
const userSockets = new Map<string, string>();

io.on('connection', (socket) => {

  console.log(`⚡ Пользователь подключился к сокету: ${socket.id}`);

  // Регистрация сокета при входе пользователя
  socket.on('register_user', (userId: string) => {
    userSockets.set(userId, socket.id);
    console.log(`👤 Пользователь ${userId} привязан к сокету ${socket.id}`);
  });

  // Обработка отправки сообщения в реальном времени
  socket.on('send_message', async (data: { senderId: string; recipientId: string; text: string }) => {
    try {
      const { senderId, recipientId, text } = data;

      if (!senderId || !recipientId || !text) return;

      // 1. Сохраняем сообщение в MongoDB
      const newMessage = await Message.create({
        sender: senderId,
        recipient: recipientId,
        text,
      });

      // 2. Подтягиваем данные отправителя
      const populatedMessage = await newMessage.populate('sender', 'username avatarUrl')

      // 3. Ищем сокет получателя
      const recipientSocketId = userSockets.get(recipientId);

      // Если получатель онлайн — мгновенно отправляем ему
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_message', populatedMessage);
      }

      // Отправляем подтверждение обратно отправителю
      socket.emit('message_sent', populatedMessage);
    } catch (error) {
      console.error('Ошибка отправки сообщения через сокет:', error);
    }
  });


  // Отключение пользователя

  socket.on('disconnect', () => {

    console.log(`❌ Пользователь отключился: ${socket.id}`);

    for (const [userId, socketId] of userSockets.entries()) {

      if (socketId === socket.id) {

        userSockets.delete(userId);

        break;

      }

    }

  });

});



// ==========================================

// 2. REST API: АУТЕНТИФИКАЦИЯ (AUTH ROUTES)

// ==========================================



// РЕГИСТРАЦИЯ

app.post('/api/auth/register', async (req, res) => {

  try {

    const { username, email, password } = req.body;



    if (!username || !email || !password) {

      return res.status(400).json({ message: 'Заполните все обязательные поля!' });

    }



    const existingUser = await User.findOne({

      $or: [{ email }, { username }],

    });



    if (existingUser) {

      return res.status(400).json({

        message: 'Пользователь с таким email или ником уже существует',

      });

    }



    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);



    const newUser = await User.create({

      username,

      email,

      passwordHash: hashedPassword,

    });



    return res.status(201).json({

      message: 'Пользователь успешно зарегистрирован!',

      user: {

        id: newUser._id,

        username: newUser.username,

        email: newUser.email,

      },

    });

  } catch (error) {

    console.error('Ошибка при регистрации:', error);

    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });

  }

});



// ЛОГИКА ВХОДА (LOGIN)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Проверяем, что переданы именно username и password
    if (!username || !password) {
      return res.status(400).json({ message: 'Необходимо указать логин и пароль' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Успешный вход!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

// ==========================================

// 3. REST API: ПОЛЬЗОВАТЕЛИ (USER ROUTES)

// ==========================================



// ПОЛУЧЕНИЕ ТЕКУЩЕГО ПРОФИЛЯ

app.get('/api/users/me', authMiddleware, async (req: AuthRequest, res) => {

  try {

    const currentUserId = req.user?.userId;

    const user = await User.findById(currentUserId).select('-passwordHash');



    if (!user) {

      return res.status(404).json({ message: 'Пользователь не найден' });

    }



    return res.json(user);

  } catch (error) {

    console.error('Ошибка получения профиля:', error);

    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });

  }

});



// ==========================================

// 4. REST API: СООБЩЕНИЯ (MESSAGE ROUTES)

// ==========================================



// ОТПРАВКА СООБЩЕНИЯ ЧЕРЕЗ HTTP (Резервный метод)

app.post('/api/messages', authMiddleware, async (req: AuthRequest, res) => {

  try {

    const senderId = req.user?.userId;

    const { recipientId, text } = req.body;



    if (!recipientId || !text) {

      return res.status(400).json({ message: 'Укажите получателя и текст сообщения' });

    }



    const message = await Message.create({

      sender: senderId,

      recipient: recipientId,

      text,

    });



    return res.status(201).json(message);

  } catch (error) {

    console.error('Ошибка отправки сообщения:', error);

    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });

  }

});



// ПОЛУЧЕНИЕ ИСТОРИИ ЧАТА

app.get('/api/messages/:userId', authMiddleware, async (req: AuthRequest, res) => {

  try {

    const currentUserId = req.user?.userId;

    const otherUserId = req.params.userId;



    const messages = await Message.find({

      $or: [

        { sender: currentUserId, recipient: otherUserId },

        { sender: otherUserId, recipient: currentUserId },

      ],

    })

      .sort({ createdAt: 1 })

      .populate('sender', 'username avatarUrl')

      .populate('recipient', 'username avatarUrl');



    return res.json(messages);

  } catch (error) {

    console.error('Ошибка получения сообщений:', error);

    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });

  }

});



// ==========================================

// 5. ЗАПУСК СЕРВЕРА

// ==========================================

const PORT = process.env.PORT || 5000;



server.listen(PORT, () => {

  console.log(`🚀 Сервер Pulsr и Socket.io запущены на порту ${PORT}`);

}); 

