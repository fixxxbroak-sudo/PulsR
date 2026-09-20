import { useState } from "react";
import "../style.css";

import logoSrc from "../assets/logo.png";
import sunIconSrc from "../assets/themeSun.png";
import moonIconSrc from "../assets/themeMoon.png";

export default function Auth() {
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [theme, setTheme] = useState<string>(localStorage.getItem('theme') || 'dark');

    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const endpoint = isRegistering 
            ? 'http://localhost:5000/api/auth/register' 
            : 'http://localhost:5000/api/auth/login';
        
        // При регистрации отправляем все поля, при входе — только username и password
        const payload = isRegistering 
            ? { username, email, password } 
            : { username, password };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Произошла ошибка');
            }

            if (isRegistering) {
                setSuccessMessage('Регистрация успешна! Теперь вы можете войти.');
                setIsRegistering(false);
            } else {
                setSuccessMessage('Успешный вход!');
                localStorage.setItem('token', data.token);
                console.log('Данные пользователя:', data.user);
            }
        } catch (err: any) {
            setErrorMessage(err.message);
        }
    };

    return (
        <>
            <div className="container">
                <img src={logoSrc} alt="Логотип Pulsr" className="logo" />
            </div>

            <form id="loginForm" onSubmit={handleSubmit}>
                {/* Логин нужен всегда */}
                <input 
                    className="login" 
                    type="text" 
                    placeholder="Логин" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                {/* Почта показывается ТОЛЬКО при регистрации */}
                {isRegistering && (
                    <input 
                        className="email" 
                        type="email" 
                        placeholder="Электронная почта (email)" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                )}

                <input 
                    className="password" 
                    type="password" 
                    placeholder="Пароль" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {errorMessage && <p style={{ color: '#ff4d4d', fontSize: '14px', textAlign: 'center', margin: '5px 0' }}>{errorMessage}</p>}
                {successMessage && <p style={{ color: '#4bb543', fontSize: '14px', textAlign: 'center', margin: '5px 0' }}>{successMessage}</p>}

                <button className="login-button" type="submit">
                    {isRegistering ? 'Зарегистрироваться' : 'Войти'}
                </button>
            </form>
            
            <button className="theme" onClick={toggleTheme} aria-label="Переключить тему">
                <img 
                    src={theme === 'light' ? moonIconSrc : sunIconSrc} 
                    alt="Переключить тему" 
                    className="theme-icon" 
                />
            </button>

            <p className="switch-text">
                <span id="switchPrompt">
                    {isRegistering ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
                </span>{' '}
                <a 
                    href="#" 
                    id="switchModeBtn" 
                    onClick={(e) => {
                        e.preventDefault();
                        setIsRegistering(!isRegistering);
                        setErrorMessage('');
                        setSuccessMessage('');
                    }}
                >
                    {isRegistering ? 'Войти' : 'Зарегистрироваться'}
                </a>
            </p>
        </>
    );
}