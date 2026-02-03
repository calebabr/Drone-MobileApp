import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Replace with your actual backend URL
  const BACKEND_URL = 'http://192.168.1.48:8000/analyze-image';
  const PROMINENT_URL = 'http://192.168.1.48:8000/most-prominent-object';

  // Request camera permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to select images.');
      return false;
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setResults(null); // Clear previous results
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setResults(null); // Clear previous results
    }
  };

  // Upload image to backend for analysis
  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }

    setLoading(true);

    try {
      // Create FormData to send image
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });

      // Send to backend
      const response = await axios.post(BACKEND_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Get the most prominent object
      let prominentObject = null;
      try {
        const prominentResponse = await axios.get(PROMINENT_URL);
        prominentObject = prominentResponse.data.mostProminentObject;
      } catch (error) {
        console.log('Could not fetch most prominent object:', error);
      }

      // Set results from backend with FastAPI structure
      setResults({
        success: response.data.success,
        count: response.data.count,
        detections: response.data.detections,
        mostProminent: prominentObject,
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Error',
        'Failed to analyze image. Make sure your backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Drone Image Analysis</Text>
        <Text style={styles.subtitle}>YOLO Object Detection</Text>
      </View>

      {/* Image Display */}
      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.image} />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Pick from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        {selectedImage && (
          <TouchableOpacity
            style={[styles.button, styles.analyzeButton]}
            onPress={analyzeImage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Analyze Image</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Results Display */}
      {results && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Detection Results</Text>

          {/* Display overall statistics */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Overall Statistics:</Text>
            <Text style={styles.statText}>
              Total Objects Detected: {results.count || 0}
            </Text>
            <Text style={styles.statText}>
              Analysis Status: {results.success ? 'Success' : 'Failed'}
            </Text>
          </View>

          {/* Display most prominent object */}
          {results.mostProminent && (
            <View style={styles.prominentContainer}>
              <Text style={styles.prominentTitle}>Most Prominent Object:</Text>
              <Text style={styles.prominentClass}>
                {results.mostProminent.class_name}
              </Text>
              <View style={styles.prominentDetails}>
                <Text style={styles.detailText}>
                  Confidence: {(results.mostProminent.confidence * 100).toFixed(1)}%
                </Text>
                <Text style={styles.detailText}>
                  Score: {results.mostProminent.score.toFixed(3)}
                </Text>
                <Text style={styles.detailText}>
                  Size: {results.mostProminent.width}×{results.mostProminent.height}px
                </Text>
                <Text style={styles.detailText}>
                  Distance: X:{results.mostProminent.distance.x.toFixed(2)}m, 
                  Y:{results.mostProminent.distance.y.toFixed(2)}m, 
                  Z:{results.mostProminent.distance.z.toFixed(2)}m
                </Text>
              </View>
            </View>
          )}

          {/* Display all detected objects */}
          {results.detections && results.detections.length > 0 ? (
            <View style={styles.detectionsContainer}>
              <Text style={styles.statsTitle}>All Detected Objects:</Text>
              <ScrollView style={styles.detectionsList}>
                {results.detections.map((detection, index) => (
                  <View key={index} style={styles.detectionCard}>
                    <View style={styles.detectionHeader}>
                      <Text style={styles.detectionClass}>
                        {index + 1}. {detection.class_name}
                      </Text>
                      <Text style={styles.detectionScore}>
                        Score: {detection.score.toFixed(3)}
                      </Text>
                    </View>
                    <View style={styles.detectionDetails}>
                      <Text style={styles.detectionText}>
                        Confidence: {(detection.confidence * 100).toFixed(1)}%
                      </Text>
                      <Text style={styles.detectionText}>
                        Area: {detection.pixelArea.toFixed(0)}px²
                      </Text>
                      <Text style={styles.detectionText}>
                        Size: {detection.width}×{detection.height}
                      </Text>
                      <Text style={styles.detectionText}>
                        Position: ({detection.xCenter.toFixed(0)}, {detection.yCenter.toFixed(0)})
                      </Text>
                      <Text style={styles.detectionText}>
                        Aspect Ratio: {detection.aspectRatio.toFixed(2)}
                      </Text>
                      <Text style={styles.detectionText}>
                        Distance: X:{detection.distance.x.toFixed(2)}m, 
                        Y:{detection.distance.y.toFixed(2)}m, 
                        Z:{detection.distance.z.toFixed(2)}m
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.noDetections}>No objects detected</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  imageContainer: {
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  buttonContainer: {
    padding: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    margin: 20,
    marginBottom: 40,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  statText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 3,
  },
  prominentContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  prominentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 5,
  },
  prominentClass: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 10,
  },
  prominentDetails: {
    gap: 5,
  },
  detailText: {
    fontSize: 13,
    color: '#5D4037',
  },
  detectionsContainer: {
    marginTop: 10,
  },
  detectionsList: {
    maxHeight: 400,
  },
  detectionCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detectionClass: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  detectionScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  detectionDetails: {
    gap: 4,
  },
  detectionItem: {
    paddingVertical: 5,
  },
  detectionText: {
    fontSize: 12,
    color: '#555',
  },
  noDetections: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});
