<script setup>
defineProps({
  icon: {
    type: String,
    default: '📭',
  },
  title: {
    type: String,
    default: 'No items found',
  },
  description: {
    type: String,
    default: '',
  },
  actionLabel: {
    type: String,
    default: '',
  },
  actionLink: {
    type: String,
    default: '',
  },
});

defineEmits(['action']);
</script>

<template>
  <div class="empty-state">
    <span class="empty-icon">{{ icon }}</span>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-desc">{{ description }}</p>
    <button
      v-if="actionLabel"
      class="empty-action"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-16) var(--spacing-4);
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-4);
  line-height: 1;
}

.empty-title {
  margin: 0 0 var(--spacing-2);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.empty-desc {
  margin: 0 0 var(--spacing-6);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  max-width: 320px;
}

.empty-action {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: #fff;
  background: var(--color-primary-500);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s;
}

.empty-action:hover {
  background: var(--color-primary-700);
}
</style>
