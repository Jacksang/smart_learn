<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: Number,
    default: 0,
    validator: (v) => v >= 0 && v <= 100,
  },
  color: {
    type: String,
    default: '--color-primary-500',
  },
  showLabel: {
    type: Boolean,
    default: true,
  },
  height: {
    type: String,
    default: 'sm',
    validator: (v) => ['sm', 'md'].includes(v),
  },
});

const fillWidth = computed(() => `${props.value}%`);

const displayValue = computed(() => Math.round(props.value));
</script>

<template>
  <div class="progress-wrapper">
    <div class="progress-track" :class="`progress-${height}`">
      <div
        class="progress-fill"
        :class="`progress-${height}`"
        :style="{ width: fillWidth, background: `var(${color})` }"
      />
    </div>
    <span v-if="showLabel" class="progress-label">{{ displayValue }}%</span>
  </div>
</template>

<style scoped>
.progress-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
}

.progress-track {
  flex: 1;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-sm {
  height: 8px;
}

.progress-md {
  height: 14px;
}

.progress-fill {
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.progress-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-500);
  min-width: 2.5em;
  text-align: right;
}
</style>
