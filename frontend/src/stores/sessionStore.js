import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import sessionService from '../services/sessionService';

export const useSessionStore = defineStore('session', () => {
  const currentSession = ref(null);
  const progress = ref(0);
  const mode = ref('learn');
  const modeHistory = ref([]);
  const summary = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const isActive = computed(() => currentSession.value?.status === 'active');
  const isPaused = computed(() => currentSession.value?.status === 'paused');

  async function startSession(projectId, data) {
    loading.value = true;
    error.value = null;
    try {
      const r = await sessionService.createSession(projectId, data);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      currentSession.value = unwrapped.session || unwrapped;
      progress.value = 0;
      summary.value = null;
      return currentSession.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to start session';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function pauseSession(projectId, sessionId, reason) {
    loading.value = true;
    error.value = null;
    try {
      const r = await sessionService.pauseSession(projectId, sessionId, reason);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      currentSession.value = unwrapped.session || unwrapped;
      return currentSession.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to pause session';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function resumeSession(projectId, sessionId) {
    loading.value = true;
    error.value = null;
    try {
      const r = await sessionService.resumeSession(projectId, sessionId);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      currentSession.value = unwrapped.session || unwrapped;
      return currentSession.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to resume session';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function endSession(projectId, sessionId) {
    loading.value = true;
    error.value = null;
    try {
      const r = await sessionService.endSession(projectId, sessionId);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      summary.value = unwrapped.summary || unwrapped;
      currentSession.value = unwrapped.session || unwrapped;
      return summary.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to end session';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateProgress(projectId, sessionId, data) {
    error.value = null;
    try {
      const r = await sessionService.updateProgress(projectId, sessionId, data);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      const p = unwrapped.progress ?? unwrapped;
      progress.value = typeof p === 'object' ? (p.currentProgress ?? p.value ?? 0) : p;
      return progress.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to update progress';
      throw e;
    }
  }

  async function fetchProgress(projectId, sessionId) {
    loading.value = true;
    error.value = null;
    try {
      const r = await sessionService.getProgress(projectId, sessionId);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      const p = unwrapped.progress ?? unwrapped;
      progress.value = typeof p === 'object' ? (p.currentProgress ?? p.value ?? 0) : p;
      return progress.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch progress';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function switchMode(projectId, sessionId, newMode, reason) {
    loading.value = true;
    error.value = null;
    try {
      const r = await sessionService.switchMode(projectId, sessionId, newMode, reason);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      mode.value = newMode;
      currentSession.value = unwrapped.session || unwrapped;
      return currentSession.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to switch mode';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchModeHistory(projectId, sessionId) {
    loading.value = true;
    error.value = null;
    try {
      const r = await sessionService.getModeHistory(projectId, sessionId);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      modeHistory.value = Array.isArray(unwrapped) ? unwrapped : (unwrapped.modeHistory || unwrapped.history || []);
      return modeHistory.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch mode history';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentSession(projectId) {
    loading.value = true;
    error.value = null;
    try {
      const r = await sessionService.getCurrentSession(projectId);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      currentSession.value = unwrapped.session || unwrapped;
      return currentSession.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch current session';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    currentSession,
    progress,
    mode,
    modeHistory,
    summary,
    loading,
    error,
    isActive,
    isPaused,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    updateProgress,
    fetchProgress,
    switchMode,
    fetchModeHistory,
    fetchCurrentSession,
  };
});
