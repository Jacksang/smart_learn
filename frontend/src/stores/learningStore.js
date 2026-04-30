import { defineStore } from 'pinia';
import { ref } from 'vue';
import learningService from '../services/learningService';

export const useLearningStore = defineStore('learning', () => {
  const projects = ref([]);
  const currentProject = ref(null);
  const outline = ref(null);
  const materials = ref([]);
  const questions = ref([]);
  const answers = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    try {
      const r = await learningService.getProjects();
      projects.value = Array.isArray(r.data) ? r.data : (r.data.projects || []);
      return projects.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch projects';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProject(id) {
    loading.value = true;
    error.value = null;
    try {
      const r = await learningService.getProject(id);
      currentProject.value = r.data;
      return currentProject.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch project';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function createProject(data) {
    loading.value = true;
    error.value = null;
    try {
      const r = await learningService.createProject(data);
      projects.value.push(r.data);
      return r.data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to create project';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOutline(projectId) {
    loading.value = true;
    error.value = null;
    try {
      const r = await learningService.getOutline(projectId);
      outline.value = r.data;
      return outline.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch outline';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchQuestions(projectId, params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const r = await learningService.getQuestions(projectId, params);
      questions.value = Array.isArray(r.data) ? r.data : (r.data.questions || []);
      return questions.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch questions';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function submitAnswer(questionId, data) {
    loading.value = true;
    error.value = null;
    try {
      const r = await learningService.submitAnswer(questionId, data);
      answers.value.push(r.data);
      return r.data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to submit answer';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMaterials(projectId) {
    loading.value = true;
    error.value = null;
    try {
      const r = await learningService.getMaterials(projectId);
      materials.value = Array.isArray(r.data) ? r.data : (r.data.materials || []);
      return materials.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch materials';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function uploadMaterial(projectId, file) {
    loading.value = true;
    error.value = null;
    try {
      const r = await learningService.uploadMaterial(projectId, file);
      materials.value.push(r.data);
      return r.data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to upload material';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    projects,
    currentProject,
    outline,
    materials,
    questions,
    answers,
    loading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    fetchOutline,
    fetchQuestions,
    submitAnswer,
    fetchMaterials,
    uploadMaterial,
  };
});
