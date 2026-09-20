export interface IUser {
  id: string;
  username: string;
}

export interface IMessage {
  id: string;
  sender: IUser | string;
  content: string;
  createdAt: string;
}