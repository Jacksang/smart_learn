import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import authService from '../services/authService';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('auth_token') || null);
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(email, password) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authService.login(email, password);
      token.value = res.data.token;
      user.value = res.data.user;
      localStorage.setItem('auth_token', res.data.token);
      return true;
    } catch (e) {
      error.value = e.response?.data?.message || 'Login failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(data) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authService.register(data);
      token.value = res.data.token;
      user.value = res.data.user;
      localStorage.setItem('auth_token', res.data.token);
      return true;
    } catch (e) {
      error.value = e.response?.data?.message || 'Registration failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfile() {
    loading.value = true;
    error.value = null;
    try {
      const res = await authService.getProfile();
      user.value = res.data.user || res.data;
      return user.value;
    } catch (e) {
      error.value = e.response?.data?.message || 'Failed to fetch profile';
      return null;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('auth_token');
  }

  async function forgotPassword(email) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authService.forgotPassword(email);
      return res.data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Password reset request failed';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function resetPassword(tokenParam, newPassword) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authService.resetPassword(tokenParam, newPassword);
      return res.data;
    } catch (e) {
      error.value = e.response?.data?.message || 'Password reset failed';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    fetchProfile,
    logout,
    forgotPassword,
    resetPassword,
  };
});
