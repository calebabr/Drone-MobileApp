import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config/constants';

export default function Header() {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>Drone Image Analysis</Text>
            <Text style={styles.subtitle}>YOLO Object Detection</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: COLORS.primary,
        padding: 20,
        paddingTop: 50,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.white,
        marginTop: 5,
    },
});