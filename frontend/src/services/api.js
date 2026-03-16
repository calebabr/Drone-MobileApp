import axios from 'axios';
import { BACKEND_URL } from '../config/constants';

// ─── Session APIs ────────────────────────────────────────────────────────────

export const createSession = async (username) => {
    const response = await axios.post(`${BACKEND_URL}/sessions/create`, {
        username,
    });
    return response.data;
};

export const listSessions = async (username) => {
    const response = await axios.get(`${BACKEND_URL}/sessions/list/${username}`);
    return response.data;
};

export const getSessionSummary = async (sessionId) => {
    const response = await axios.get(`${BACKEND_URL}/sessions/summary/${sessionId}`);
    return response.data;
};

export const deleteSession = async (sessionId) => {
    const response = await axios.delete(`${BACKEND_URL}/sessions/${sessionId}`);
    return response.data;
};

// ─── Analysis APIs ───────────────────────────────────────────────────────────

export const analyzeImage = async (imageUri, sessionId = null) => {
    const formData = new FormData();
    formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
    });

    let url = `${BACKEND_URL}/analyze-image`;
    if (sessionId) {
        url += `?session_id=${sessionId}`;
    }

    const response = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
};

export const getMostProminentObject = async () => {
    const response = await axios.get(`${BACKEND_URL}/most-prominent-object`);
    return response.data.mostProminentObject;
};

export const getAnalysisHistory = async (sessionId = null) => {
    let url = `${BACKEND_URL}/analysis-history`;
    if (sessionId) {
        url += `?session_id=${sessionId}`;
    }
    const response = await axios.get(url);
    return response.data.history;
};

export const getAnalysisById = async (analysisId, sessionId = null) => {
    let url = `${BACKEND_URL}/analysis/${analysisId}`;
    if (sessionId) {
        url += `?session_id=${sessionId}`;
    }
    const response = await axios.get(url);
    return response.data.analysis;
};

export const clearAnalysisHistory = async (sessionId = null) => {
    let url = `${BACKEND_URL}/analysis-history`;
    if (sessionId) {
        url += `?session_id=${sessionId}`;
    }
    const response = await axios.delete(url);
    return response.data;
};

export const sendChatMessage = async (message, analysisId = null, allAnalysisIds = null, sessionId = null) => {
    const response = await axios.post(`${BACKEND_URL}/chat`, {
        message,
        analysis_id: analysisId,
        all_analysis_ids: allAnalysisIds,
        session_id: sessionId,
    });
    return response.data;
};

export const clearChatHistory = async (sessionId = null) => {
    let url = `${BACKEND_URL}/chat/history`;
    if (sessionId) {
        url += `?session_id=${sessionId}`;
    }
    const response = await axios.delete(url);
    return response.data;
};