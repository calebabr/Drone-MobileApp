import React from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';

export default function ImageDisplay({ imageUri, isAnnotated }) {
    if (!imageUri) return null;

    return (
        <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            {isAnnotated && (
                <View style={styles.imageLabel}>
                    <Text style={styles.imageLabelText}>Annotated</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        margin: 20,
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
    },
    imageLabel: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(76, 175, 80, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 5,
    },
    imageLabelText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});