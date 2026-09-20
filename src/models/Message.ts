import { Schema, model, Document, Types } from 'mongoose';

// 1. Интерфейс TypeScript для строгой типизации сообщений
export interface IMessage extends Document {
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Схема Mongoose для валидации данных в MongoDB
const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Связывает поле с коллекцией User для использования .populate()
      required: [true, 'Отправитель обязателен'],
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Связывает поле с получателем из коллекции User
      required: [true, 'Получатель обязателен'],
    },
    text: {
      type: String,
      required: [true, 'Текст сообщения не может быть пустым'],
      trim: true,
    },
    read: {
      type: Boolean,
      default: false, // По умолчанию сообщение считается непрочитанным
    },
  },
  {
    timestamps: true, // Автоматически добавляет createdAt (время отправки) и updatedAt
  }
);

// 3. Экспортируем модель
export const Message = model<IMessage>('Message', messageSchema);