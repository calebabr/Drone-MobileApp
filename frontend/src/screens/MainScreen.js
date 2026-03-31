import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';
import ImageDisplay from '../components/ImageDisplay';
import ActionButtons from '../components/ActionButtons';
import ResultsView from '../components/ResultsView';
import HistoryModal from '../components/HistoryModal';
import HistoryDetailModal from '../components/HistoryDetailModal';
import ChatModal from '../components/ChatModal';
import { pickImageFromGallery, capturePhoto } from '../utils/imageUtils';
import * as api from '../services/api';
import { commonStyles } from '../styles/commonStyles';
import { COLORS } from '../config/constants';

export default function MainScreen({ sessionId, onLogout }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    // Track which analysis the chat is focused on
    const [chatAnalysisId, setChatAnalysisId] = useState(null);

    useEffect(() => {
        if (sessionId) {
            fetchAnalysisHistory();
        }
    }, [sessionId]);

    const handlePickImage = async () => {
        const uri = await pickImageFromGallery();
        if (uri) {
            setSelectedImage(uri);
            setResults(null);
            setChatMessages([]);
            setHasAnalyzed(false);
        }
    };

    const handleTakePhoto = async () => {
        const uri = await capturePhoto();
        if (uri) {
            setSelectedImage(uri);
            setResults(null);
            setChatMessages([]);
            setHasAnalyzed(false);
        }
    };

    const handleAnalyzeImage = async () => {
        if (!selectedImage) {
            Alert.alert('No Image', 'Please select an image first.');
            return;
        }

        if (hasAnalyzed) {
            Alert.alert(
                'Already Analyzed',
                'This image has already been analyzed. Select a new image to analyze again.'
            );
            return;
        }

        setLoading(true);
        try {
            const analysisData = await api.analyzeImage(selectedImage, sessionId);

            if (analysisData.is_duplicate) {
                Alert.alert(
                    'Duplicate Analysis',
                    'This image was already analyzed. Showing previous results.'
                );
            }

            const prominentObject = await api.getMostProminentObject().catch(() => null);

            setResults({
                ...analysisData,
                mostProminent: prominentObject,
            });

            setChatMessages([]);
            setHasAnalyzed(true);
            fetchAnalysisHistory();
        } catch (error) {
            console.error('Error analyzing image:', error);
            Alert.alert('Error', 'Failed to analyze image. Make sure your backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalysisHistory = async () => {
        try {
            const history = await api.getAnalysisHistory(sessionId);
            setAnalysisHistory(history);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const handleViewHistory = () => {
        fetchAnalysisHistory();
        setShowHistory(true);
    };

    const handleViewHistoryItem = async (analysisId) => {
        try {
            const analysis = await api.getAnalysisById(analysisId, sessionId);
            setSelectedHistoryItem(analysis);
            setShowHistory(false);
        } catch (error) {
            console.error('Error fetching analysis:', error);
            Alert.alert('Error', 'Could not load analysis details.');
        }
    };

    const handleClearHistory = async () => {
        Alert.alert(
            'Clear History',
            'Are you sure you want to clear all analysis history?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.clearAnalysisHistory(sessionId);
                            setAnalysisHistory([]);
                            Alert.alert('Success', 'History cleared successfully.');
                        } catch (error) {
                            console.error('Error clearing history:', error);
                            Alert.alert('Error', 'Could not clear history.');
                        }
                    },
                },
            ]
        );
    };

    const openChat = (analysisId = null) => {
        setChatAnalysisId(analysisId || results?.analysis_id || null);
        setChatMessages([]);
        setShowChat(true);
    };

    const imageUri = results?.annotated_image
        ? `data:image/jpeg;base64,${results.annotated_image}`
        : selectedImage;

    const allAnalysisIds = analysisHistory.map((item) => item.analysis_id);

    const formatSessionId = (id) => {
        if (id && id.length > 12) {
            return id.substring(0, 6) + '...' + id.substring(id.length - 6);
        }
        return id || '';
    };

    return (
        <ScrollView style={commonStyles.container}>
            <View style={styles.headerContainer}>
                <Header />
                <View style={styles.sessionBar}>
                    <Text style={styles.sessionText}>
                        Session: {formatSessionId(sessionId)}
                    </Text>
                    <View style={styles.sessionBarButtons}>
                        <TouchableOpacity
                            style={styles.sessionChatButton}
                            onPress={() => openChat(null)}
                        >
                            <Text style={styles.sessionChatButtonText}>Session Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ImageDisplay imageUri={imageUri} isAnnotated={!!results?.annotated_image} />

            <ActionButtons
                onPickImage={handlePickImage}
                onTakePhoto={handleTakePhoto}
                onAnalyze={handleAnalyzeImage}
                onViewHistory={handleViewHistory}
                hasImage={!!selectedImage}
                isLoading={loading}
                historyCount={analysisHistory.length}
                hasAnalyzed={hasAnalyzed}
            />

            {results && (
                <ResultsView
                    results={results}
                    onOpenChat={() => openChat(results?.analysis_id)}
                />
            )}

            <HistoryModal
                visible={showHistory}
                history={analysisHistory}
                onClose={() => setShowHistory(false)}
                onSelectItem={handleViewHistoryItem}
                onClearHistory={handleClearHistory}
            />

            <HistoryDetailModal
                visible={!!selectedHistoryItem}
                analysis={selectedHistoryItem}
                onClose={() => setSelectedHistoryItem(null)}
                onOpenChat={(analysisId) => {
                    setSelectedHistoryItem(null);
                    openChat(analysisId);
                }}
            />

            <ChatModal
                visible={showChat}
                onClose={() => setShowChat(false)}
                analysisId={chatAnalysisId}
                allAnalysisIds={allAnalysisIds}
                messages={chatMessages}
                setMessages={setChatMessages}
                sessionId={sessionId}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {},
    sessionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.primaryDark,
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    sessionText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '500',
        opacity: 0.9,
    },
    sessionBarButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    sessionChatButton: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
    },
    sessionChatButtonText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
    },
    logoutButtonText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
});