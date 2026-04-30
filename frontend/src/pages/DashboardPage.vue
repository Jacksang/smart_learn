<script setup>
import { ref, onMounted } from 'vue';
import { useSessionStore } from '../stores/sessionStore';
import { useLearningStore } from '../stores/learningStore';
import PageHeader from '../components/PageHeader.vue';
import BaseCard from '../components/BaseCard.vue';
import BaseButton from '../components/BaseButton.vue';
import MasteryBadge from '../components/MasteryBadge.vue';
import ProgressBar from '../components/ProgressBar.vue';
import EmptyState from '../components/EmptyState.vue';

const sessionStore = useSessionStore();
const learningStore = useLearningStore();

const metrics = ref([
  { icon: '🔥', value: '7 days', label: 'Streak' },
  { icon: '⏱️', value: '45 min', label: 'Today' },
  { icon: '🎯', value: '82%', label: 'Accuracy' },
  { icon: '📚', value: '12', label: 'Topics Learned' },
]);

async function fetchData() {
  if (learningStore.projects.length === 0) {
    try {
      await learningStore.fetchProjects();
    } catch {
      // keep mock metrics
    }
  }

  const projectId = learningStore.currentProject?.id;
  if (projectId) {
    try {
      await sessionStore.fetchCurrentSession(projectId);
    } catch {
      // no active session — UI handles gracefully
    }
  }
}

function continueLearning() {
  // navigate to learning session page — placeholder
}

function newSession() {
  // navigate to new session flow — placeholder
}

function uploadMaterial() {
  // navigate to upload flow — placeholder
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="dashboard">
    <PageHeader title="Dashboard" subtitle="Welcome back!" />

    <!-- Metrics Cards Row -->
    <div class="metrics-grid">
      <BaseCard
        v-for="m in metrics"
        :key="m.label"
        class="metric-card"
        shadow
      >
        <div class="metric">
          <span class="metric-icon">{{ m.icon }}</span>
          <span class="metric-value">{{ m.value }}</span>
          <span class="metric-label">{{ m.label }}</span>
        </div>
      </BaseCard>
    </div>

    <!-- Current Session Card -->
    <BaseCard
      v-if="sessionStore.currentSession"
      title="Current Session"
      class="session-card"
      shadow
    >
      <div class="session-info">
        <div class="session-meta">
          <div class="session-meta-item">
            <span class="session-meta-label">Level</span>
            <MasteryBadge :level="'proficient'" />
          </div>
          <div class="session-meta-item">
            <span class="session-meta-label">Mode</span>
            <span class="session-mode">{{ sessionStore.mode }}</span>
          </div>
          <div class="session-meta-item">
            <span class="session-meta-label">Status</span>
            <span
              class="session-status"
              :class="{
                'status-active': sessionStore.isActive,
                'status-paused': sessionStore.isPaused,
              }"
            >
              {{ sessionStore.isActive ? 'Active' : sessionStore.isPaused ? 'Paused' : 'Idle' }}
            </span>
          </div>
        </div>

        <div class="session-progress">
          <span class="session-meta-label">Progress</span>
          <ProgressBar :value="sessionStore.progress" height="md" />
        </div>

        <BaseButton variant="primary" @click="continueLearning">
          Continue Learning
        </BaseButton>
      </div>
    </BaseCard>

    <!-- No Active Session -->
    <BaseCard
      v-else
      title="Current Session"
      shadow
    >
      <EmptyState
        icon="🧘"
        title="No active session"
        description="Start a new learning session or continue where you left off."
        action-label="Start New Session"
        @action="newSession"
      />
    </BaseCard>

    <!-- Quick Actions -->
    <BaseCard title="Quick Actions" shadow>
      <div class="quick-actions">
        <BaseButton variant="primary" @click="newSession">
          🚀 Start New Session
        </BaseButton>
        <BaseButton variant="secondary" @click="uploadMaterial">
          📤 Upload Material
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* ---- Metrics Grid ---- */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-4);
}

.metric-card {
  text-align: center;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2) 0;
}

.metric-icon {
  font-size: 2rem;
  line-height: 1;
}

.metric-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-gray-900);
}

.metric-label {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

/* ---- Session Card ---- */
.session-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.session-meta {
  display: flex;
  gap: var(--spacing-8);
}

.session-meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.session-meta-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-gray-500);
}

.session-mode {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-900);
  text-transform: capitalize;
}

.session-status {
  font-size: var(--font-size-lg);
  font-weight: 600;
  text-transform: capitalize;
}

.status-active {
  color: var(--color-success);
}

.status-paused {
  color: var(--color-warning);
}

.session-progress {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

/* ---- Quick Actions ---- */
.quick-actions {
  display: flex;
  gap: var(--spacing-4);
  flex-wrap: wrap;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .session-meta {
    flex-wrap: wrap;
    gap: var(--spacing-4);
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    flex-direction: column;
  }
}
</style>
