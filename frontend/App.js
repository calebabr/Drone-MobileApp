import React, { useState } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import UniversalChatScreen from './src/screens/UniversalChatScreen';

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

    const handleOpenUniversalChat = () => {
        setCurrentScreen('universalChat');
    };

    const handleBackFromUniversalChat = () => {
        setCurrentScreen('login');
    };

    if (currentScreen === 'login') {
        return (
            <LoginScreen
                onSessionStart={handleSessionStart}
                onOpenUniversalChat={handleOpenUniversalChat}
            />
        );
    }

    if (currentScreen === 'universalChat') {
        return <UniversalChatScreen onBack={handleBackFromUniversalChat} />;
    }

    return (
        <MainScreen
            sessionId={sessionId}
            onLogout={handleLogout}
        />
    );
}