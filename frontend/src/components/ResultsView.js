import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import StatisticsCard from './StatisticsCard';
import DetailedStatistics from './DetailedStatistics';
import ProminentObject from './ProminentObject';
import DetectionsList from './DetectionsList';
import { COLORS } from '../config/constants';

export default function ResultsView({ results, onOpenChat }) {
    return (
    <View style={styles.container}>
        <View style={styles.titleRow}>
            <Text style={styles.title}>Detection Results</Text>
            <TouchableOpacity style={styles.chatButton} onPress={onOpenChat}>
            <Text style={styles.chatButtonText}>Ask AI</Text>
            </TouchableOpacity>
        </View>

        <StatisticsCard results={results} />
        <DetailedStatistics statistics={results.statistics} />
        <ProminentObject mostProminent={results.mostProminent} />
        <DetectionsList detections={results.detections} />
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 20,
        marginBottom: 40,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: COLORS.text,
    },
    chatButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    chatButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
});