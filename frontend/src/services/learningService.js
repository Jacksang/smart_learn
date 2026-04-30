import apiClient from './apiClient';

export default {
  getProjects() {
    return apiClient.get('/projects');
  },
  getProject(id) {
    return apiClient.get(`/projects/${id}`);
  },
  createProject(data) {
    return apiClient.post('/projects', data);
  },
  getMaterials(projectId) {
    return apiClient.get(`/projects/${projectId}/materials`);
  },
  uploadMaterial(projectId, file) {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post(`/projects/${projectId}/materials`, fd);
  },
  getOutline(projectId) {
    return apiClient.get(`/projects/${projectId}/outline`);
  },
  getQuestions(projectId, params) {
    return apiClient.get(`/projects/${projectId}/questions`, { params });
  },
  submitAnswer(questionId, data) {
    return apiClient.post(`/answers/${questionId}`, data);
  },
  getProgress(projectId) {
    return apiClient.get(`/projects/${projectId}/progress`);
  },
};
