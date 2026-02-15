import axios from 'axios';
import { BACKEND_URL } from '../config/constants';

export const analyzeImage = async (imageUri) => {
    const formData = new FormData();
    formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
    });

    const response = await axios.post(`${BACKEND_URL}/analyze-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
};

export const getMostProminentObject = async () => {
    const response = await axios.get(`${BACKEND_URL}/most-prominent-object`);
    return response.data.mostProminentObject;
};

export const getAnalysisHistory = async () => {
    const response = await axios.get(`${BACKEND_URL}/analysis-history`);
    return response.data.history;
};

export const getAnalysisById = async (analysisId) => {
    const response = await axios.get(`${BACKEND_URL}/analysis/${analysisId}`);
    return response.data.analysis;
};

export const clearAnalysisHistory = async () => {
    const response = await axios.delete(`${BACKEND_URL}/analysis-history`);
    return response.data;
};

export const sendChatMessage = async (message, analysisId = null) => {
    const response = await axios.post(`${BACKEND_URL}/chat`, {
        message,
        analysis_id: analysisId,
    });
    return response.data;
};

export const clearChatHistory = async () => {
    const response = await axios.delete(`${BACKEND_URL}/chat/history`);
    return response.data;
};