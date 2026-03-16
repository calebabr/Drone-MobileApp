import React, { useState } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState('login');
    const [username, setUsername] = useState(null);
    const [sessionId, setSessionId] = useState(null);

    const handleSessionStart = (user, sessId) => {
        setUsername(user);
        setSessionId(sessId);
        setCurrentScreen('main');
    };

    const handleLogout = () => {
        setUsername(null);
        setSessionId(null);
        setCurrentScreen('login');
    };

    if (currentScreen === 'login') {
        return <LoginScreen onSessionStart={handleSessionStart} />;
    }

    return (
        <MainScreen
            username={username}
            sessionId={sessionId}
            onLogout={handleLogout}
        />
    );
}