import React, { useRef, useEffect } from 'react';
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
import { sendChatMessage } from '../services/api';
import { COLORS } from '../config/constants';
import { useState } from 'react';

export default function ChatModal({ visible, onClose, analysisId, allAnalysisIds, messages, setMessages }) {
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef();

    useEffect(() => {
        if (visible && messages.length === 0) {
        setMessages([
            {
            role: 'assistant',
            content: analysisId
                ? `Hello! I have context about your current image and ${allAnalysisIds?.length > 1 ? `${allAnalysisIds.length} other analyzed images` : 'all analyzed images'} in this session. What would you like to know?`
                : 'Hello! Analyze an image first and I can answer questions about the results.',
            },
        ]);
        }
    }, [visible]);

    const handleSend = async () => {
        if (!inputText.trim() || loading) return;

        const userMessage = inputText.trim();
        setInputText('');

        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
        const response = await sendChatMessage(userMessage, analysisId, allAnalysisIds);
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
            <Text style={styles.title}>AI Assistant</Text>
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
        borderRadius: 15,
        marginBottom: 10,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.primary,
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
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
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 8,
    },
    loadingText: {
        color: COLORS.textLight,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        alignItems: 'flex-end',
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sendButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 15,
    },
});