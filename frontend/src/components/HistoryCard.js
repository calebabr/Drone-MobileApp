import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../config/constants';

/**
 * Build a short human-readable summary from the class_distribution object.
 * Example input:  { "person": 3, "car": 2, "tree": 1 }
 * Example output: "3 persons, 2 cars, 1 tree"
 */
function buildSummary(statistics) {
    const dist = statistics?.class_distribution;
    if (!dist || Object.keys(dist).length === 0) {
        return 'No objects detected';
    }

    // Sort classes by count descending so the most common appear first
    const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);

    const parts = sorted.map(([className, count]) => {
        // Simple pluralisation: add "s" when count > 1
        // Handle common edge-cases (person -> people, bus -> buses)
        let label = className;
        if (count > 1) {
            if (className.toLowerCase() === 'person') {
                label = 'people';
            } else if (className.toLowerCase().endsWith('s') || className.toLowerCase().endsWith('x') || className.toLowerCase().endsWith('sh') || className.toLowerCase().endsWith('ch')) {
                label = className + 'es';
            } else {
                label = className + 's';
            }
        }
        return `${count} ${label}`;
    });

    return parts.join(', ');
}

export default function HistoryCard({ item, onPress, index }) {
    const summary = buildSummary(item.statistics);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image
                source={{ uri: `data:image/jpeg;base64,${item.thumbnail}` }}
                style={styles.thumbnail}
            />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>
                    {summary}
                </Text>
                <Text style={styles.detail}>
                    {item.count} object{item.count !== 1 ? 's' : ''} detected
                </Text>
                <Text style={styles.detail}>
                    {new Date(item.timestamp).toLocaleString()}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    thumbnail: {
        width: 100,
        height: 75,
        borderRadius: 8,
        marginRight: 12,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    detail: {
        fontSize: 12,
        color: COLORS.textLight,
        marginVertical: 2,
    },
});