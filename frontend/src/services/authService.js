import apiClient from './apiClient';

export default {
  login(email, password) {
    return apiClient.post('/users/login', { email, password });
  },
  register(data) {
    return apiClient.post('/users/register', data);
  },
  getProfile() {
    return apiClient.get('/users/me');
  },
  forgotPassword(email) {
    return apiClient.post('/auth/password-reset/request', { email });
  },
  resetPassword(token, newPassword) {
    return apiClient.post('/auth/password-reset/complete', { token, newPassword });
  },
  requestVerification() {
    return apiClient.post('/auth/verification/request');
  },
  verifyEmail(token) {
    return apiClient.post('/auth/verification/complete', { token });
  },
  getSessions() {
    return apiClient.get('/auth/sessions');
  },
  revokeSession(id) {
    return apiClient.delete(`/auth/sessions/${id}`);
  },
  revokeAllSessions() {
    return apiClient.delete('/auth/sessions/all');
  },
  linkOAuth(provider, token) {
    return apiClient.post('/auth/oauth/link', { provider, ...token });
  },
  getOAuthProviders() {
    return apiClient.get('/auth/oauth/providers');
  },
};
