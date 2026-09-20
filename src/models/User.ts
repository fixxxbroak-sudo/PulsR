import { Schema, model, Document } from 'mongoose';

// 1. Интерфейс TypeScript для строгой типизации в коде
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Схема Mongoose для валидации и структуры данных в MongoDB
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Имя пользователя обязательно'],
      unique: true, // Запрещает повторение ников в базе
      trim: true,   // Убирает случайные пробелы по краям
    },
    email: {
      type: String,
      required: [true, 'Email обязателен'],
      unique: true,   // Запрещает повторение email
      lowercase: true, // Приводит все буквы к нижнему регистру
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Пароль обязателен'],
    },
    avatarUrl: {
      type: String,
      default: '', // Если аватарка не указана, будет пустая строка
    },
  },
  {
    timestamps: true, // Автоматически создаёт и обновляет поля createdAt и updatedAt
  }
);

// 3. Создаём и экспортируем модель
export const User = model<IUser>('User', userSchema);