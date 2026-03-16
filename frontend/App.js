import React, { useState } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState('login');
    const [sessionId, setSessionId] = useState(null);

    const handleSessionStart = (sessId) => {
        setSessionId(sessId);
        setCurrentScreen('main');
    };

    const handleLogout = () => {
        setSessionId(null);
        setCurrentScreen('login');
    };

    if (currentScreen === 'login') {
        return <LoginScreen onSessionStart={handleSessionStart} />;
    }

    return (
        <MainScreen
            sessionId={sessionId}
            onLogout={handleLogout}
        />
    );
}