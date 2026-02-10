import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import StatisticsCard from './StatisticsCard';
import DetailedStatistics from './DetailedStatistics';
import ProminentObject from './ProminentObject';
import DetectionsList from './DetectionsList';
import { COLORS } from '../config/constants';

export default function ResultsView({ results }) {
    return (
        <View style={styles.container}>
        <Text style={styles.title}>Detection Results</Text>

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
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: COLORS.text,
    },
});