<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger', 'ghost'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['click']);
</script>

<template>
  <button
    class="base-btn"
    :class="[`btn-${variant}`, `btn-${size}`, { 'btn-loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <span v-if="loading" class="btn-spinner" aria-hidden="true" />
    <span :class="{ 'opacity-0': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: background-color 0.2s, opacity 0.2s, box-shadow 0.2s;
  position: relative;
  white-space: nowrap;
  line-height: 1;
}

.base-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.btn-sm {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-sm);
}

.btn-md {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-base);
}

.btn-lg {
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-lg);
  border-radius: var(--radius-lg);
}

/* Primary */
.btn-primary {
  background: var(--color-primary-500);
  color: #fff;
  border-color: var(--color-primary-500);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-700);
  border-color: var(--color-primary-700);
}

/* Secondary */
.btn-secondary {
  background: #fff;
  color: var(--color-gray-700);
  border-color: var(--color-gray-300);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-gray-50);
  border-color: var(--color-gray-500);
}

/* Danger */
.btn-danger {
  background: var(--color-danger);
  color: #fff;
  border-color: var(--color-danger);
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--color-gray-700);
  border-color: transparent;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--color-gray-100);
}

/* Loading spinner */
.btn-loading {
  pointer-events: none;
}

.btn-spinner {
  position: absolute;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--radius-full);
  animation: btn-spin 0.5s linear infinite;
}

.opacity-0 {
  opacity: 0;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
