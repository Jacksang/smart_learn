import apiClient from './apiClient';

export default {
  createSession(projectId, data) {
    return apiClient.post(`/projects/${projectId}/sessions`, data);
  },
  getCurrentSession(projectId) {
    return apiClient.get(`/projects/${projectId}/sessions/current`);
  },
  pauseSession(projectId, sessionId, reason) {
    return apiClient.post(`/projects/${projectId}/sessions/${sessionId}/pause`, { reason });
  },
  resumeSession(projectId, sessionId) {
    return apiClient.post(`/projects/${projectId}/sessions/${sessionId}/resume`);
  },
  endSession(projectId, sessionId) {
    return apiClient.post(`/projects/${projectId}/sessions/${sessionId}/end`);
  },
  getSessionDetails(projectId, sessionId) {
    return apiClient.get(`/projects/${projectId}/sessions/${sessionId}`);
  },
  updateProgress(projectId, sessionId, data) {
    return apiClient.patch(`/projects/${projectId}/sessions/${sessionId}/progress`, data);
  },
  getProgress(projectId, sessionId) {
    return apiClient.get(`/projects/${projectId}/sessions/${sessionId}/progress`);
  },
  switchMode(projectId, sessionId, mode, reason) {
    return apiClient.patch(`/projects/${projectId}/sessions/${sessionId}/mode`, { mode, reason });
  },
  getModeHistory(projectId, sessionId) {
    return apiClient.get(`/projects/${projectId}/sessions/${sessionId}/mode-history`);
  },
};
