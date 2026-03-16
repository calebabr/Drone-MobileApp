import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    SafeAreaView,
} from 'react-native';
import { COLORS } from '../config/constants';
import * as api from '../services/api';

export default function LoginScreen({ onSessionStart }) {
    const [username, setUsername] = useState('');
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(null);
    const [summaries, setSummaries] = useState({});
    const [showSessions, setShowSessions] = useState(false);

    const handleLogin = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please enter a username.');
            return;
        }

        setLoading(true);
        try {
            // Fetch existing sessions for this user
            const result = await api.listSessions(username.trim());
            if (result.sessions && result.sessions.length > 0) {
                setSessions(result.sessions);
                setShowSessions(true);
            } else {
                // No existing sessions — create a new one directly
                await handleNewSession();
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            // If backend is unreachable, still allow new session creation
            await handleNewSession();
        } finally {
            setLoading(false);
        }
    };

    const handleNewSession = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please enter a username.');
            return;
        }

        setLoading(true);
        try {
            const result = await api.createSession(username.trim());
            onSessionStart(username.trim(), result.session_id);
        } catch (error) {
            console.error('Error creating session:', error);
            Alert.alert('Error', 'Failed to create session. Make sure your backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleContinueSession = (sessionId) => {
        onSessionStart(username.trim(), sessionId);
    };

    const handleGetSummary = async (sessionId) => {
        if (summaries[sessionId]) return; // Already fetched

        setLoadingSummary(sessionId);
        try {
            const result = await api.getSessionSummary(sessionId);
            setSummaries((prev) => ({
                ...prev,
                [sessionId]: result.summary,
            }));
        } catch (error) {
            console.error('Error getting summary:', error);
            setSummaries((prev) => ({
                ...prev,
                [sessionId]: 'Could not generate summary.',
            }));
        } finally {
            setLoadingSummary(null);
        }
    };

    const handleDeleteSession = (sessionId) => {
        Alert.alert(
            'Delete Session',
            'Are you sure you want to delete this session and all its data?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteSession(sessionId);
                            setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
                            setSummaries((prev) => {
                                const copy = { ...prev };
                                delete copy[sessionId];
                                return copy;
                            });
                        } catch (error) {
                            console.error('Error deleting session:', error);
                            Alert.alert('Error', 'Could not delete session.');
                        }
                    },
                },
            ]
        );
    };

    const renderSessionItem = ({ item }) => {
        const summary = summaries[item.session_id];
        const isLoadingSummary = loadingSummary === item.session_id;

        return (
            <View style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                    <Text style={styles.sessionDate}>
                        {new Date(item.created_at).toLocaleDateString()} {' '}
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteSession(item.session_id)}
                    >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.sessionStats}>
                    <Text style={styles.sessionStatText}>
                        Analyses: {item.analysis_count}
                    </Text>
                    <Text style={styles.sessionStatText}>
                        Messages: {item.chat_message_count}
                    </Text>
                </View>

                {/* Summary Section */}
                {!summary && !isLoadingSummary && (
                    <TouchableOpacity
                        style={styles.summaryButton}
                        onPress={() => handleGetSummary(item.session_id)}
                    >
                        <Text style={styles.summaryButtonText}>Generate AI Summary</Text>
                    </TouchableOpacity>
                )}

                {isLoadingSummary && (
                    <View style={styles.summaryLoading}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={styles.summaryLoadingText}>Generating summary...</Text>
                    </View>
                )}

                {summary && (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryLabel}>AI Summary:</Text>
                        <Text style={styles.summaryText}>{summary}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => handleContinueSession(item.session_id)}
                >
                    <Text style={styles.continueButtonText}>Continue Session</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (showSessions) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Drone Image Analysis</Text>
                    <Text style={styles.subtitle}>Welcome back, {username}!</Text>
                </View>

                <View style={styles.sessionListHeader}>
                    <Text style={styles.sectionTitle}>Your Past Sessions</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setShowSessions(false)}
                    >
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={sessions}
                    renderItem={renderSessionItem}
                    keyExtractor={(item) => item.session_id}
                    contentContainerStyle={styles.sessionList}
                    ListFooterComponent={
                        <TouchableOpacity
                            style={styles.newSessionButton}
                            onPress={handleNewSession}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.newSessionButtonText}>
                                    + Start New Session
                                </Text>
                            )}
                        </TouchableOpacity>
                    }
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.loginContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Drone Image Analysis</Text>
                    <Text style={styles.subtitle}>YOLO Object Detection</Text>
                </View>

                <View style={styles.loginForm}>
                    <Text style={styles.loginLabel}>Enter your username</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="go"
                        onSubmitEditing={handleLogin}
                    />

                    <TouchableOpacity
                        style={[styles.loginButton, !username.trim() && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading || !username.trim()}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.loginButtonText}>Login</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.infoText}>
                    Sessions are stored by username. Enter a username to view past sessions or start a new one.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        backgroundColor: COLORS.primary,
        padding: 30,
        borderRadius: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.white,
        marginTop: 5,
        opacity: 0.9,
    },
    loginForm: {
        backgroundColor: COLORS.white,
        padding: 25,
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    loginLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#fafafa',
        marginBottom: 15,
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    loginButtonDisabled: {
        backgroundColor: '#ccc',
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoText: {
        textAlign: 'center',
        color: COLORS.textLight,
        fontSize: 13,
        marginTop: 20,
        lineHeight: 18,
    },
    // Session List Styles
    sessionListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    backButton: {
        backgroundColor: COLORS.primaryDark,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    backButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    sessionList: {
        padding: 15,
        paddingBottom: 30,
    },
    sessionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sessionDate: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    deleteButton: {
        backgroundColor: COLORS.error,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
    },
    deleteButtonText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    sessionStats: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 10,
    },
    sessionStatText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    summaryButton: {
        backgroundColor: COLORS.lightBlue,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    summaryButtonText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    summaryLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 10,
        marginBottom: 10,
    },
    summaryLoadingText: {
        color: COLORS.textLight,
        fontSize: 13,
    },
    summaryContainer: {
        backgroundColor: COLORS.lightGreen,
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 4,
    },
    summaryText: {
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 18,
    },
    continueButton: {
        backgroundColor: COLORS.success,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    continueButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: 'bold',
    },
    newSessionButton: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 20,
    },
    newSessionButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});