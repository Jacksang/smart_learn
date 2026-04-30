import apiClient from './apiClient';

export default {
  getProfile() {
    return apiClient.get('/users/profile');
  },
  updateProfile(data) {
    return apiClient.patch('/users/profile', data);
  },
  uploadAvatar(file) {
    const fd = new FormData();
    fd.append('avatar', file);
    return apiClient.post('/users/profile/avatar', fd);
  },
  deleteAvatar() {
    return apiClient.delete('/users/profile/avatar');
  },
  updateLearningPrefs(data) {
    return apiClient.patch('/users/profile/preferences/learning', data);
  },
  updateNotifPrefs(data) {
    return apiClient.patch('/users/profile/preferences/notifications', data);
  },
  changePassword(data) {
    return apiClient.post('/users/profile/change-password', data);
  },
  getSubscription() {
    return apiClient.get('/users/profile/subscription');
  },
  requestDataExport(format) {
    return apiClient.post('/users/profile/data-export', { format });
  },
  getSessions() {
    return apiClient.get('/users/profile/sessions');
  },
  revokeSession(id) {
    return apiClient.delete(`/users/profile/sessions/${id}`);
  },
  revokeAllSessions() {
    return apiClient.delete('/users/profile/sessions/all');
  },
};
