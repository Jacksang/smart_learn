<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import BaseAvatar from './BaseAvatar.vue';

const route = useRoute();
const authStore = useAuthStore();
const userName = computed(() => authStore.user?.display_name || authStore.user?.name || 'User');

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/learn', icon: '📖', label: 'Learn' },
  { to: '/analytics', icon: '📈', label: 'Analytics' },
  { to: '/weak-areas', icon: '🎯', label: 'Weak Areas' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <RouterLink to="/" class="sidebar-logo">
        <span class="logo-icon">📚</span>
        <span class="logo-text">Smart Learn</span>
      </RouterLink>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-link"
        :class="{ active: route.path === item.to }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-user">
      <BaseAvatar :name="userName" size="sm" />
      <span class="user-name">{{ userName }}</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid var(--color-gray-200);
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.sidebar-header {
  padding: var(--spacing-6) var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-100);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  text-decoration: none;
}

.logo-icon {
  font-size: var(--font-size-2xl);
}

.logo-text {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary-500);
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}

.nav-link:hover {
  background: var(--color-gray-50);
  color: var(--color-gray-900);
}

.nav-link.active {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  border-left-color: var(--color-primary-500);
}

.nav-icon {
  font-size: var(--font-size-lg);
  width: 24px;
  text-align: center;
}

.nav-label {
  white-space: nowrap;
}

.sidebar-user {
  padding: var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
