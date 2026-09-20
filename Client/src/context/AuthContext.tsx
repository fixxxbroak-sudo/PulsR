import React, { createContext, useContext, useState, useEffect } from 'react';
import { type IUser } from '../types'; // Если types лежит в src/types, а context в src/context, то нужно подняться в src: '../types'
import { api } from '../api/axios';   // Аналогично: '../api/axios'

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  login: (token: string, user: IUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('pulsr_token'));

  useEffect(() => {
    // Здесь при желании можно добавить запрос на валидацию токена/получение профиля
  }, [token]);

  const login = (newToken: string, newUser: IUser) => {
    localStorage.setItem('pulsr_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('pulsr_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth должен использоваться внутри AuthProvider');
  return context;
};