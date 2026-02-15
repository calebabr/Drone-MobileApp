import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config/constants';

export default function ProminentObject({ mostProminent }) {
    if (!mostProminent) return null;

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Most Prominent Object:</Text>
        <Text style={styles.className}>{mostProminent.class_name}</Text>
        <View style={styles.details}>
            <Text style={styles.detailText}>
            Confidence: {(mostProminent.confidence * 100).toFixed(1)}%
            </Text>
            <Text style={styles.detailText}>
            Score: {mostProminent.score.toFixed(3)}
            </Text>
            <Text style={styles.detailText}>
            Size: {mostProminent.width}×{mostProminent.height}px
            </Text>
            <Text style={styles.detailText}>
            Distance: X:{mostProminent.distance.x.toFixed(2)}m,
            Y:{mostProminent.distance.y.toFixed(2)}m,
            Z:{mostProminent.distance.z.toFixed(2)}m
            </Text>
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: COLORS.lightOrange,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.warning,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E65100',
        marginBottom: 5,
    },
    className: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F57C00',
        marginBottom: 10,
    },
    details: {
        gap: 5,
    },
    detailText: {
        fontSize: 13,
        color: '#5D4037',
    },
});