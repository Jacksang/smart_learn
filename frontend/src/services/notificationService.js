import apiClient from './apiClient';

export default {
  getNotifications(params) {
    return apiClient.get('/notifications', { params });
  },
  getNotification(id) {
    return apiClient.get(`/notifications/${id}`);
  },
  markRead(id) {
    return apiClient.post(`/notifications/${id}/read`);
  },
  markAllRead() {
    return apiClient.post('/notifications/mark-all-read');
  },
  markBatchRead(ids) {
    return apiClient.post('/notifications/read-all', { notificationIds: ids });
  },
  deleteNotification(id) {
    return apiClient.delete(`/notifications/${id}`);
  },
  deleteAll(params) {
    return apiClient.delete('/notifications', { params });
  },
  getPreferences() {
    return apiClient.get('/notifications/preferences');
  },
  updatePreferences(data) {
    return apiClient.patch('/notifications/preferences', data);
  },
  sendTest(data) {
    return apiClient.post('/notifications/test', data);
  },
};
