<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import BaseAvatar from './BaseAvatar.vue';

const authStore = useAuthStore();
const userName = computed(() => authStore.user?.display_name || authStore.user?.name || 'User');

defineProps({
  unreadCount: {
    type: Number,
    default: 0,
  },
});
</script>

<template>
  <header class="top-header">
    <div class="header-left">
      <h2 class="breadcrumb">Dashboard</h2>
    </div>

    <div class="header-right">
      <button class="notif-btn" aria-label="Notifications">
        <span class="notif-icon">🔔</span>
        <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
      </button>

      <div class="user-menu">
        <BaseAvatar :name="userName" size="sm" />
        <span class="user-name">{{ userName }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid var(--color-gray-200);
  padding: 0 var(--spacing-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
}

.breadcrumb {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-gray-900);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.notif-btn {
  position: relative;
  background: none;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: var(--spacing-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.notif-btn:hover {
  background: var(--color-gray-50);
}

.notif-icon {
  font-size: var(--font-size-lg);
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: var(--color-danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
  white-space: nowrap;
}
</style>
