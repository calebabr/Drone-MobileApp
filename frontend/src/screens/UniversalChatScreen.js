import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    Alert,
} from 'react-native';
import { COLORS } from '../config/constants';
import * as api from '../services/api';

export default function UniversalChatScreen({ onBack }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const scrollViewRef = useRef();

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const result = await api.getUniversalChatHistory();
            const history = result.chat_history || [];

            if (history.length > 0) {
                setMessages([
                    {
                        role: 'assistant',
                        content: 'Welcome back! I have access to all your sessions and analyses. Here\'s our conversation history.',
                    },
                    ...history,
                ]);
            } else {
                setMessages([
                    {
                        role: 'assistant',
                        content: 'Hello! I\'m the universal assistant with access to ALL your drone analysis sessions. I can compare sessions, identify trends, and answer questions about any analysis across all your sessions. What would you like to know?',
                    },
                ]);
            }
        } catch (error) {
            console.error('Error loading universal chat history:', error);
            setMessages([
                {
                    role: 'assistant',
                    content: 'Hello! I have access to all your sessions. What would you like to know?',
                },
            ]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || loading) return;

        const userMessage = inputText.trim();
        setInputText('');

        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await api.sendUniversalChatMessage(userMessage);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: response.message },
            ]);
        } catch (error) {
            console.error('Universal chat error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please try again.',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = () => {
        Alert.alert(
            'Clear Chat History',
            'Are you sure you want to clear the universal chat history?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.clearUniversalChatHistory();
                            setMessages([
                                {
                                    role: 'assistant',
                                    content: 'Chat history cleared. I still have access to all your sessions. What would you like to know?',
                                },
                            ]);
                        } catch (error) {
                            console.error('Error clearing history:', error);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity style={styles.backButton} onPress={onBack}>
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Universal Assistant</Text>
                    </View>
                    <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
                        <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoBanner}>
                    <Text style={styles.infoBannerText}>
                        Access to all sessions and analyses
                    </Text>
                </View>

                {historyLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading chat history...</Text>
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        onContentSizeChange={() =>
                            scrollViewRef.current?.scrollToEnd({ animated: true })
                        }
                    >
                        {messages.map((message, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.messageBubble,
                                    message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.messageText,
                                        message.role === 'user' ? styles.userText : styles.assistantText,
                                    ]}
                                >
                                    {message.content}
                                </Text>
                            </View>
                        ))}

                        {loading && (
                            <View style={styles.loadingBubble}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.loadingBubbleText}>Thinking...</Text>
                            </View>
                        )}
                    </ScrollView>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask about any session or analysis..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || loading) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || loading}
                    >
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.primary,
        padding: 15,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        backgroundColor: COLORS.primaryDark,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    backButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 13,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    clearButton: {
        backgroundColor: COLORS.error,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    clearButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 13,
    },
    infoBanner: {
        backgroundColor: COLORS.lightGreen,
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    infoBannerText: {
        fontSize: 12,
        color: '#2E7D32',
        textAlign: 'center',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: COLORS.textLight,
        fontSize: 15,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 15,
        paddingBottom: 20,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    userBubble: {
        backgroundColor: COLORS.primary,
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: COLORS.white,
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userText: {
        color: COLORS.white,
    },
    assistantText: {
        color: COLORS.text,
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    loadingBubbleText: {
        color: COLORS.textLight,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 100,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sendButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
});