import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import DetectionCard from './DetectionCard';
import { COLORS } from '../config/constants';

export default function DetectionsList({ detections }) {
    if (!detections || detections.length === 0) {
        return <Text style={styles.noDetections}>No objects detected</Text>;
    }

    return (
        <View style={styles.container}>
        <Text style={styles.title}>All Detected Objects:</Text>
        <ScrollView style={styles.list}>
            {detections.map((detection, index) => (
            <DetectionCard key={index} detection={detection} index={index} />
            ))}
        </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: COLORS.primaryDark,
    },
    list: {
        maxHeight: 400,
    },
    noDetections: {
        fontSize: 14,
        color: COLORS.textLight,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
    },
});