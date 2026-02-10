import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { IMAGE_PICKER_OPTIONS } from '../config/constants';

export const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to select images.');
        return false;
    }
    return true;
};

export const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        ...IMAGE_PICKER_OPTIONS,
    });

    return result.canceled ? null : result.assets[0].uri;
};

export const capturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions to take photos.');
        return null;
    }

    const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);
    return result.canceled ? null : result.assets[0].uri;
};