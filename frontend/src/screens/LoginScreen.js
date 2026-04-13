import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    SafeAreaView,
} from 'react-native';
import { COLORS } from '../config/constants';
import * as api from '../services/api';

export default function LoginScreen({ onSessionStart, onOpenUniversalChat }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creatingSession, setCreatingSession] = useState(false);
    const [summaries, setSummaries] = useState({});
    const [summaryLoading, setSummaryLoading] = useState({});
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        if (!hasLoadedOnce) {
            setLoading(true);
        }
        try {
            const result = await api.listSessions();
            const sessionList = result.sessions || [];
            setSessions(sessionList);
            fetchAllSummaries(sessionList);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            if (!hasLoadedOnce) setSessions([]);
        } finally {
            setLoading(false);
            setHasLoadedOnce(true);
        }
    };

    const fetchAllSummaries = (sessionList) => {
        if (sessionList.length === 0) return;

        // Mark all as loading
        const loadingMap = {};
        sessionList.forEach((s) => { loadingMap[s.session_id] = true; });
        setSummaryLoading(loadingMap);

        sessionList.forEach(async (session) => {
            try {
                const result = await api.getSessionSummary(session.session_id);
                setSummaries((prev) => ({ ...prev, [session.session_id]: result.summary }));
            } catch {
                setSummaries((prev) => ({ ...prev, [session.session_id]: 'No summary available.' }));
            } finally {
                setSummaryLoading((prev) => {
                    const copy = { ...prev };
                    delete copy[session.session_id];
                    return copy;
                });
            }
        });
    };

    const handleNewSession = async () => {
        setCreatingSession(true);
        try {
            const result = await api.createSession();
            onSessionStart(result.session_id);
        } catch (error) {
            console.error('Error creating session:', error);
            Alert.alert('Error', 'Failed to create session. Make sure your backend is running.');
        } finally {
            setCreatingSession(false);
        }
    };

    const handleContinueSession = (sessionId) => {
        onSessionStart(sessionId);
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

    const renderSessionItem = ({ item, index }) => {
        const summary = summaries[item.session_id];
        const isLoadingSummary = summaryLoading[item.session_id];
        const sessionNumber = index + 1;

        return (
            <View style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                    <Text style={styles.sessionNumber}>Session #{sessionNumber}</Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteSession(item.session_id)}
                    >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>

                {isLoadingSummary ? (
                    <View style={styles.summaryLoading}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={styles.summaryLoadingText}>Loading summary...</Text>
                    </View>
                ) : summary ? (
                    <Text style={styles.summaryText}>{summary}</Text>
                ) : null}

                <Text style={styles.sessionDate}>
                    Created: {new Date(item.created_at).toLocaleDateString()}{' '}
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>

                <View style={styles.sessionStats}>
                    <View style={styles.statBadge}>
                        <Text style={styles.statBadgeText}>
                            {item.analysis_count} Analyses
                        </Text>
                    </View>
                    <View style={styles.statBadge}>
                        <Text style={styles.statBadgeText}>
                            {item.chat_message_count} Messages
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => handleContinueSession(item.session_id)}
                >
                    <Text style={styles.continueButtonText}>Continue Session</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Drone Image Analysis</Text>
                <Text style={styles.subtitle}>YOLO Object Detection</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={styles.sectionTitle}>
                        {sessions.length > 0 ? 'Your Sessions' : 'No Sessions Yet'}
                    </Text>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={fetchSessions}
                    >
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading sessions...</Text>
                    </View>
                ) : sessions.length > 0 ? (
                    <FlatList
                        data={sessions}
                        renderItem={renderSessionItem}
                        keyExtractor={(item) => item.session_id}
                        contentContainerStyle={styles.sessionList}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            No sessions found. Tap the button below to start your first session!
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.newSessionButton}
                    onPress={handleNewSession}
                    disabled={creatingSession}
                >
                    {creatingSession ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.newSessionButtonText}>+ New Session</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.universalChatButton}
                    onPress={onOpenUniversalChat}
                >
                    <Text style={styles.universalChatButtonText}>Universal Session Chat</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        padding: 20,
        paddingTop: 50,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.white,
        marginTop: 4,
        opacity: 0.9,
    },
    content: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    refreshButton: {
        backgroundColor: COLORS.lightBlue,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    refreshButtonText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '600',
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 15,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 22,
    },
    sessionList: {
        paddingBottom: 10,
    },
    sessionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sessionNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    summaryLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    summaryLoadingText: {
        color: COLORS.textLight,
        fontSize: 13,
    },
    summaryText: {
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 19,
        marginBottom: 8,
    },
    sessionDate: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 8,
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
        gap: 10,
        marginBottom: 10,
    },
    statBadge: {
        backgroundColor: COLORS.lightBlue,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statBadgeText: {
        fontSize: 12,
        color: COLORS.primaryDark,
        fontWeight: '600',
    },
    continueButton: {
        backgroundColor: COLORS.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    continueButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: 'bold',
    },
    footer: {
        padding: 15,
        paddingBottom: 25,
        backgroundColor: COLORS.background,
    },
    newSessionButton: {
        backgroundColor: '#DD550C',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    newSessionButtonText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: 'bold',
    },
    universalChatButton: {
        backgroundColor: '#1B4D8E',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    universalChatButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
