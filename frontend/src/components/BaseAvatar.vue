<script setup>
import { computed } from 'vue';

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v),
  },
});

const initials = computed(() => {
  if (!props.name) return '?';
  return props.name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');
});

const bgColor = computed(() => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
  ];
  let hash = 0;
  for (let i = 0; i < (props.name || '?').length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
});
</script>

<template>
  <div class="base-avatar" :class="`avatar-${size}`">
    <img v-if="src" :src="src" :alt="name || 'Avatar'" class="avatar-img" />
    <span v-else class="avatar-initials" :style="{ background: bgColor }">
      {{ initials }}
    </span>
  </div>
</template>

<style scoped>
.base-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
  user-select: none;
}

.avatar-sm  { width: 28px;  height: 28px;  font-size: var(--font-size-xs); }
.avatar-md  { width: 40px;  height: 40px;  font-size: var(--font-size-sm); }
.avatar-lg  { width: 56px;  height: 56px;  font-size: var(--font-size-lg); }
.avatar-xl  { width: 80px;  height: 80px;  font-size: var(--font-size-2xl); }

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
}
</style>
