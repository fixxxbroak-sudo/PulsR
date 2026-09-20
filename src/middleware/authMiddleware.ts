import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Расширяем стандартный интерфейс Request из Express,
// чтобы TypeScript знал, что внутри req появится поле user с userId
export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

// 2. Функция-прослойка для защиты приватных маршрутов
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Токен передаётся в заголовке Authorization в формате: "Bearer <TOKEN>"
  const authHeader = req.headers.authorization;

  // Проверяем наличие заголовка и префикса "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Нет авторизации, токен отсутствует' });
  }

  // Извлекаем сам токен (отрезаем "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // Проверяем и расшифровываем токен с помощью секретного ключа из .env
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as { userId: string };

    // Записываем ID пользователя в объект запроса для использования в контроллерах
    req.user = { userId: decoded.userId };

    // Передаём управление следующей функции (контроллеру)
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Невалидный или просроченный токен' });
  }
};