import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config/constants';

export default function DetectionCard({ detection, index }) {
    return (
        <View style={styles.card}>
        <View style={styles.header}>
            <Text style={styles.className}>
            {index + 1}. {detection.class_name}
            </Text>
            <Text style={styles.score}>Score: {detection.score.toFixed(3)}</Text>
        </View>
        <View style={styles.details}>
            <Text style={styles.detailText}>
            Confidence: {(detection.confidence * 100).toFixed(1)}%
            </Text>
            <Text style={styles.detailText}>
            Area: {detection.pixelArea.toFixed(0)}px²
            </Text>
            <Text style={styles.detailText}>
            Size: {detection.width}×{detection.height}
            </Text>
            <Text style={styles.detailText}>
            Position: ({detection.xCenter.toFixed(0)}, {detection.yCenter.toFixed(0)})
            </Text>
            <Text style={styles.detailText}>
            Aspect Ratio: {detection.aspectRatio.toFixed(2)}
            </Text>
            <Text style={styles.detailText}>
            Distance: X:{detection.distance.x.toFixed(2)}m, 
            Y:{detection.distance.y.toFixed(2)}m, 
            Z:{detection.distance.z.toFixed(2)}m
            </Text>
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    className: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primaryDark,
    },
    score: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.success,
    },
    details: {
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
});