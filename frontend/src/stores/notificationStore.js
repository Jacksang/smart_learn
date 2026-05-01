import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import notificationService from '../services/notificationService';

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([]);
  const preferences = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.is_read).length
  );

  async function fetchNotifications(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const r = await notificationService.getNotifications(params);
      const body = r.data;
      const data = body.success ? body.data : body;
      notifications.value = Array.isArray(data) ? data : (data.notifications || []);
      return notifications.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch notifications';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function markAsRead(id) {
    error.value = null;
    try {
      const r = await notificationService.markRead(id);
      const body = r.data;
      const data = body.success ? body.data : body;
      const idx = notifications.value.findIndex(n => n.id === id);
      if (idx !== -1) {
        notifications.value[idx] = { ...notifications.value[idx], is_read: true, ...data };
      }
      return data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to mark notification as read';
      throw e;
    }
  }

  async function markAllAsRead() {
    error.value = null;
    try {
      const r = await notificationService.markAllRead();
      const body = r.data;
      const data = body.success ? body.data : body;
      notifications.value = notifications.value.map(n => ({ ...n, is_read: true }));
      return data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to mark all notifications as read';
      throw e;
    }
  }

  async function deleteNotification(id) {
    error.value = null;
    try {
      const r = await notificationService.deleteNotification(id);
      const body = r.data;
      const data = body.success ? body.data : body;
      notifications.value = notifications.value.filter(n => n.id !== id);
      return data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to delete notification';
      throw e;
    }
  }

  async function clearAll(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const r = await notificationService.deleteAll(params);
      const body = r.data;
      const data = body.success ? body.data : body;
      notifications.value = [];
      return data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to clear notifications';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPreferences() {
    loading.value = true;
    error.value = null;
    try {
      const r = await notificationService.getPreferences();
      const body = r.data;
      const data = body.success ? body.data : body;
      preferences.value = data.preferences || data;
      return preferences.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch notification preferences';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updatePreferences(data) {
    loading.value = true;
    error.value = null;
    try {
      const r = await notificationService.updatePreferences(data);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      preferences.value = unwrapped.preferences || unwrapped;
      return unwrapped;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to update notification preferences';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    notifications,
    preferences,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    fetchPreferences,
    updatePreferences,
  };
});
