import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config/constants';

export default function StatisticsCard({ results }) {
    return (
        <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Overall Statistics:</Text>
        <Text style={styles.statText}>
            Total Objects Detected: {results.count || 0}
        </Text>
        <Text style={styles.statText}>
            Analysis Status: {results.success ? 'Success' : 'Failed'}
        </Text>
        <Text style={styles.statText}>
            Analysis ID: {results.analysis_id?.substring(0, 20)}...
        </Text>
        </View>
    );
    }

const styles = StyleSheet.create({
    statsContainer: {
        marginBottom: 15,
        padding: 15,
        backgroundColor: COLORS.lightBlue,
        borderRadius: 10,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: COLORS.primaryDark,
    },
    statText: {
        fontSize: 14,
        color: COLORS.text,
        marginVertical: 3,
    },
});