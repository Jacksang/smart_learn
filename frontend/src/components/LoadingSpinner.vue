<script setup>
defineProps({
  message: {
    type: String,
    default: 'Loading...',
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
});
</script>

<template>
  <div class="spinner-container">
    <div class="spinner" :class="`spinner-${size}`" role="status" aria-label="Loading">
      <div class="spinner-circle" />
    </div>
    <p v-if="message" class="spinner-message">{{ message }}</p>
  </div>
</template>

<style scoped>
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  padding: var(--spacing-8);
}

.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-sm .spinner-circle {
  width: 18px;
  height: 18px;
  border-width: 2px;
}

.spinner-md .spinner-circle {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.spinner-lg .spinner-circle {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

.spinner-circle {
  border-style: solid;
  border-color: var(--color-gray-200);
  border-top-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  animation: spin 0.7s linear infinite;
}

.spinner-message {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
