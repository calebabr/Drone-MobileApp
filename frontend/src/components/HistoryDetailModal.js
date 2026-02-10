import React from 'react';
import { StyleSheet, Text, View, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import DetailedStatistics from './DetailedStatistics';
import DetectionCard from './DetectionCard';
import { COLORS } from '../config/constants';

export default function HistoryDetailModal({ visible, analysis, onClose }) {
    if (!analysis) return null;

    return (
        <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
        >
        <ScrollView style={styles.container}>
            <View style={styles.header}>
            <Text style={styles.title}>Analysis Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.content}>
            {/* Annotated Image */}
            <View style={styles.imageContainer}>
                <Image
                source={{
                    uri: `data:image/jpeg;base64,${analysis.annotated_image}`,
                }}
                style={styles.image}
                />
            </View>

            {/* Statistics */}
            <DetailedStatistics statistics={analysis.statistics} />

            {/* Detections */}
            <View style={styles.detectionsContainer}>
                <Text style={styles.detectionsTitle}>Detected Objects:</Text>
                {analysis.detections.map((detection, index) => (
                <DetectionCard key={index} detection={detection} index={index} />
                ))}
            </View>
            </View>
        </ScrollView>
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
    content: {
        padding: 20,
    },
    imageContainer: {
        marginBottom: 20,
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
        resizeMode: 'contain',
    },
    detectionsContainer: {
        marginTop: 10,
    },
    detectionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: COLORS.primaryDark,
    },
});