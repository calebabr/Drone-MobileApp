import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, FlatList } from 'react-native';
import HistoryCard from './HistoryCard';
import { COLORS } from '../config/constants';

export default function HistoryModal({
    visible,
    history,
    onClose,
    onSelectItem,
    onClearHistory,
    }) {
    return (
        <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
        >
        <View style={styles.container}>
            <View style={styles.header}>
            <Text style={styles.title}>Analysis History</Text>
            <View style={styles.buttons}>
                {history.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={onClearHistory}>
                    <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
            </View>

            {history.length > 0 ? (
            <FlatList
                data={history}
                renderItem={({ item }) => (
                <HistoryCard item={item} onPress={() => onSelectItem(item.analysis_id)} />
                )}
                keyExtractor={(item) => item.analysis_id}
                contentContainerStyle={styles.list}
            />
            ) : (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                No analysis history yet. Analyze some images to see them here!
                </Text>
            </View>
            )}
        </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.primary,
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    buttons: {
        flexDirection: 'row',
        gap: 10,
    },
    closeButton: {
        backgroundColor: COLORS.primaryDark,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    closeButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    clearButton: {
        backgroundColor: COLORS.error,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    clearButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    list: {
        padding: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
});