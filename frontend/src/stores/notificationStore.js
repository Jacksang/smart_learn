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
      notifications.value = Array.isArray(r.data) ? r.data : (r.data.notifications || []);
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
      const idx = notifications.value.findIndex(n => n.id === id);
      if (idx !== -1) {
        notifications.value[idx] = { ...notifications.value[idx], is_read: true, ...r.data };
      }
      return r.data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to mark notification as read';
      throw e;
    }
  }

  async function markAllAsRead() {
    error.value = null;
    try {
      const r = await notificationService.markAllRead();
      notifications.value = notifications.value.map(n => ({ ...n, is_read: true }));
      return r.data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to mark all notifications as read';
      throw e;
    }
  }

  async function deleteNotification(id) {
    error.value = null;
    try {
      const r = await notificationService.deleteNotification(id);
      notifications.value = notifications.value.filter(n => n.id !== id);
      return r.data;
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
      notifications.value = [];
      return r.data;
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
      preferences.value = r.data;
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
      preferences.value = r.data;
      return r.data;
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
