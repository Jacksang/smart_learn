<script setup>
import { computed } from 'vue';

const props = defineProps({
  level: {
    type: String,
    default: 'novice',
    validator: (v) =>
      ['novice', 'emerging', 'developing', 'proficient', 'advanced', 'expert'].includes(v),
  },
  showLabel: {
    type: Boolean,
    default: true,
  },
});

const varName = computed(() => `--color-mastery-${props.level}`);

const label = computed(() => {
  return props.level.charAt(0).toUpperCase() + props.level.slice(1);
});
</script>

<template>
  <span
    class="mastery-badge"
    :style="{ background: `var(${varName})` }"
    :title="label"
  >
    <span v-if="showLabel" class="mastery-label">{{ label }}</span>
  </span>
</template>

<style scoped>
.mastery-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  line-height: 1.4;
}

.mastery-label {
  position: relative;
  top: 0;
}
</style>
