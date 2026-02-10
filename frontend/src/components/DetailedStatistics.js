import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config/constants';

export default function DetailedStatistics({ statistics }) {
    if (!statistics) return null;

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Detailed Statistics</Text>

        <StatRow label="Total Objects:" value={statistics.total_objects} />
        <StatRow label="Unique Classes:" value={statistics.unique_classes} />
        <StatRow
            label="Average Confidence:"
            value={`${(statistics.average_confidence * 100).toFixed(1)}%`}
        />
        <StatRow label="Average Score:" value={statistics.average_score?.toFixed(3)} />
        <StatRow label="Average Area:" value={`${statistics.average_area?.toFixed(0)} px²`} />
        <StatRow
            label="Coverage:"
            value={`${statistics.coverage_percentage?.toFixed(2)}%`}
        />

        {statistics.class_distribution &&
            Object.keys(statistics.class_distribution).length > 0 && (
            <View style={styles.classDistribution}>
                <Text style={styles.sectionLabel}>Class Distribution:</Text>
                {Object.entries(statistics.class_distribution).map(([className, count]) => (
                <Text key={className} style={styles.distributionItem}>
                    • {className}: {count}
                </Text>
                ))}
            </View>
            )}

        {statistics.average_distance && (
            <View style={styles.section}>
            <Text style={styles.sectionLabel}>Average Distance:</Text>
            <Text style={styles.distanceText}>
                X: {statistics.average_distance.x.toFixed(2)}m
            </Text>
            <Text style={styles.distanceText}>
                Y: {statistics.average_distance.y.toFixed(2)}m
            </Text>
            <Text style={styles.distanceText}>
                Z: {statistics.average_distance.z.toFixed(2)}m
            </Text>
            </View>
        )}

        {statistics.size_range && (
            <View style={styles.section}>
            <Text style={styles.sectionLabel}>Size Range:</Text>
            <Text style={styles.rangeText}>
                Min: {statistics.size_range.min.toFixed(0)} px² | Max:{' '}
                {statistics.size_range.max.toFixed(0)} px²
            </Text>
            </View>
        )}
        </View>
    );
}

function StatRow({ label, value }) {
    return (
        <View style={styles.statRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: COLORS.lightGreen,
        borderRadius: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#2E7D32',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
        paddingVertical: 2,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    section: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    classDistribution: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    distributionItem: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 10,
        marginVertical: 2,
    },
    distanceText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 10,
        marginVertical: 1,
    },
    rangeText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 10,
    },
});