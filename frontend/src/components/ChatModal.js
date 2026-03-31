import React, { useRef, useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { sendChatMessage, getChatHistory } from '../services/api';
import { COLORS } from '../config/constants';

export default function ChatModal({ visible, onClose, analysisId, allAnalysisIds, messages, setMessages, sessionId }) {
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const scrollViewRef = useRef();

    useEffect(() => {
        if (visible && !historyLoaded && sessionId) {
            loadChatHistory();
        } else if (visible && !sessionId && messages.length === 0) {
            setMessages([
                {
                    role: 'assistant',
                    content: analysisId
                        ? `Hello! I have context about your current image and ${allAnalysisIds?.length > 1 ? `${allAnalysisIds.length} total analyzed images` : 'all analyzed images'} in this session. What would you like to know?`
                        : 'Hello! Analyze an image first and I can answer questions about the results.',
                },
            ]);
        }
    }, [visible]);

    const loadChatHistory = async () => {
        try {
            const result = await getChatHistory(sessionId);
            const history = result.chat_history || [];

            if (history.length > 0) {
                // Show persisted history + a greeting
                const greeting = {
                    role: 'assistant',
                    content: analysisId
                        ? `Welcome back! I have context about your current image and ${allAnalysisIds?.length || 0} total analyzed images in this session. Here's our conversation history.`
                        : `Welcome back! I have context about ${allAnalysisIds?.length || 0} analyzed images in this session. What would you like to know?`,
                };
                setMessages([greeting, ...history]);
            } else {
                setMessages([
                    {
                        role: 'assistant',
                        content: analysisId
                            ? `Hello! I have context about your current image and ${allAnalysisIds?.length > 1 ? `${allAnalysisIds.length} total analyzed images` : 'all analyzed images'} in this session. What would you like to know?`
                            : 'Hello! Analyze an image first and I can answer questions about the results.',
                    },
                ]);
            }
            setHistoryLoaded(true);
        } catch (error) {
            console.error('Error loading chat history:', error);
            setMessages([
                {
                    role: 'assistant',
                    content: 'Hello! What would you like to know about your analysis?',
                },
            ]);
            setHistoryLoaded(true);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || loading) return;

        const userMessage = inputText.trim();
        setInputText('');

        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await sendChatMessage(userMessage, analysisId, allAnalysisIds, sessionId);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: response.message },
            ]);
        } catch (error) {
            console.error('Chat error:', error);
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

    const handleClose = () => {
        setInputText('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Session Chat</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>

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
                            <Text style={styles.loadingText}>Thinking...</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask about your image analysis..."
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
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.primary,
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    closeButton: {
        backgroundColor: COLORS.primaryDark,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    closeButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
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
    loadingText: {
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