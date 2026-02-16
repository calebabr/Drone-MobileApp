import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../config/constants';

export default function ActionButtons({
    onPickImage,
    onTakePhoto,
    onAnalyze,
    onViewHistory,
    hasImage,
    isLoading,
    historyCount,
    hasAnalyzed,
    }) {
    return (
        <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onPickImage}>
            <Text style={styles.buttonText}>Pick from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onTakePhoto}>
            <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        {hasImage && (
            <TouchableOpacity
            style={[
                styles.button,
                styles.analyzeButton,
                hasAnalyzed && styles.disabledButton
            ]}
            onPress={onAnalyze}
            disabled={isLoading || hasAnalyzed}
            >
            {isLoading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.buttonText}>
                {hasAnalyzed ? 'Already Analyzed' : 'Analyze Image'}
                </Text>
            )}
            </TouchableOpacity>
        )}

        <TouchableOpacity
            style={[styles.button, styles.historyButton]}
            onPress={onViewHistory}
        >
            <Text style={styles.buttonText}>View History ({historyCount})</Text>
        </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        padding: 20,
        gap: 10,
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    analyzeButton: {
        backgroundColor: COLORS.success,
        marginTop: 10,
    },
    historyButton: {
        backgroundColor: COLORS.warning,
        marginTop: 5,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});