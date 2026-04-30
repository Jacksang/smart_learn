<script setup>
import SidebarNav from '../components/SidebarNav.vue';
import TopHeader from '../components/TopHeader.vue';
</script>

<template>
  <div class="app-layout">
    <SidebarNav />
    <div class="app-main">
      <TopHeader />
      <main class="app-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  margin-left: 240px;
}

.app-content {
  padding: var(--spacing-6);
  max-width: 1280px;
}
</style>
