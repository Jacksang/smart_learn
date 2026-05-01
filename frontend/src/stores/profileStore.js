import { defineStore } from 'pinia';
import { ref } from 'vue';
import profileService from '../services/profileService';

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null);
  const subscription = ref(null);
  const preferences = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function fetchProfile() {
    loading.value = true;
    error.value = null;
    try {
      const r = await profileService.getProfile();
      const body = r.data;
      const data = body.success ? body.data : body;
      profile.value = data.user || data;
      return profile.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch profile';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(data) {
    loading.value = true;
    error.value = null;
    try {
      const r = await profileService.updateProfile(data);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      profile.value = unwrapped.user || unwrapped;
      return unwrapped;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to update profile';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function uploadAvatar(file) {
    loading.value = true;
    error.value = null;
    try {
      const r = await profileService.uploadAvatar(file);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      if (profile.value) {
        profile.value.avatarUrl = unwrapped.avatarUrl || unwrapped.url;
      }
      return unwrapped;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to upload avatar';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function changePassword(data) {
    loading.value = true;
    error.value = null;
    try {
      const r = await profileService.changePassword(data);
      const body = r.data;
      return body.success ? body.data : body;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to change password';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSubscription() {
    loading.value = true;
    error.value = null;
    try {
      const r = await profileService.getSubscription();
      const body = r.data;
      const data = body.success ? body.data : body;
      subscription.value = data.subscription || data;
      return subscription.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch subscription';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateLearningPrefs(data) {
    loading.value = true;
    error.value = null;
    try {
      const r = await profileService.updateLearningPrefs(data);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      preferences.value = unwrapped.learningPreferences || unwrapped;
      return unwrapped;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to update learning preferences';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateNotifPrefs(data) {
    loading.value = true;
    error.value = null;
    try {
      const r = await profileService.updateNotifPrefs(data);
      const body = r.data;
      const unwrapped = body.success ? body.data : body;
      preferences.value = unwrapped.notificationPreferences || unwrapped;
      return unwrapped;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to update notification preferences';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    profile,
    subscription,
    preferences,
    loading,
    error,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    fetchSubscription,
    updateLearningPrefs,
    updateNotifPrefs,
  };
});
