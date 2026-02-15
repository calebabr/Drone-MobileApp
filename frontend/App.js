import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import Header from './src/components/Header';
import ImageDisplay from './src/components/ImageDisplay';
import ActionButtons from './src/components/ActionButtons';
import ResultsView from './src/components/ResultsView';
import HistoryModal from './src/components/HistoryModal';
import HistoryDetailModal from './src/components/HistoryDetailModal';
import ChatModal from './src/components/ChatModal';
import { pickImageFromGallery, capturePhoto } from './src/utils/imageUtils';
import * as api from './src/services/api';
import { commonStyles } from './src/styles/commonStyles';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const handlePickImage = async () => {
    const uri = await pickImageFromGallery();
    if (uri) {
      setSelectedImage(uri);
      setResults(null);
    }
  };

  const handleTakePhoto = async () => {
    const uri = await capturePhoto();
    if (uri) {
      setSelectedImage(uri);
      setResults(null);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    setLoading(true);
    try {
      const analysisData = await api.analyzeImage(selectedImage);
      const prominentObject = await api.getMostProminentObject().catch(() => null);

      setResults({
        ...analysisData,
        mostProminent: prominentObject,
      });

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
      const history = await api.getAnalysisHistory();
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
      const analysis = await api.getAnalysisById(analysisId);
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
              await api.clearAnalysisHistory();
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

  const imageUri = results?.annotated_image
    ? `data:image/jpeg;base64,${results.annotated_image}`
    : selectedImage;

  return (
    <ScrollView style={commonStyles.container}>
      <Header />

      <ImageDisplay imageUri={imageUri} isAnnotated={!!results?.annotated_image} />

      <ActionButtons
        onPickImage={handlePickImage}
        onTakePhoto={handleTakePhoto}
        onAnalyze={handleAnalyzeImage}
        onViewHistory={handleViewHistory}
        hasImage={!!selectedImage}
        isLoading={loading}
        historyCount={analysisHistory.length}
      />

      {results && (
        <ResultsView
          results={results}
          onOpenChat={() => setShowChat(true)}
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
      />

      <ChatModal
        visible={showChat}
        onClose={() => setShowChat(false)}
        analysisId={results?.analysis_id}
      />
    </ScrollView>
  );
}