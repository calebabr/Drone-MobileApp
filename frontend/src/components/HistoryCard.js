import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../config/constants';

export default function HistoryCard({ item, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
        <Image
            source={{ uri: `data:image/jpeg;base64,${item.thumbnail}` }}
            style={styles.thumbnail}
        />
        <View style={styles.info}>
            <Text style={styles.title}>
            Analysis {item.analysis_id.substring(0, 15)}...
            </Text>
            <Text style={styles.detail}>Objects Detected: {item.count}</Text>
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