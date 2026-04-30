<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  shadow: {
    type: Boolean,
    default: false,
  },
  padding: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <div
    class="base-card"
    :class="{ 'card-shadow': shadow, 'card-no-padding': !padding }"
  >
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="card-title">{{ title }}</h3>
      </slot>
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.base-card {
  background: #fff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
}

.card-shadow {
  box-shadow: var(--shadow-md);
  border-color: transparent;
}

.card-no-padding .card-body {
  padding: 0;
}

.card-header {
  padding: var(--spacing-4) var(--spacing-6) 0;
}

.card-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.card-body {
  padding: var(--spacing-6);
}

.card-footer {
  padding: 0 var(--spacing-6) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
  padding-top: var(--spacing-4);
}
</style>
