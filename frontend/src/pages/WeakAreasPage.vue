<script setup>
import { ref, computed, onMounted } from 'vue';
import { useLearningStore } from '../stores/learningStore';
import PageHeader from '../components/PageHeader.vue';
import BaseCard from '../components/BaseCard.vue';
import BaseButton from '../components/BaseButton.vue';
import MasteryBadge from '../components/MasteryBadge.vue';
import ProgressBar from '../components/ProgressBar.vue';

const learningStore = useLearningStore();

const priorities = ['All', 'High', 'Medium', 'Low'];
const selectedPriority = ref('All');

const areas = ref([
  {
    topic: 'Algorithms',
    mastery: 'emerging',
    accuracy: 35,
    description: 'Struggling with dynamic programming and graph traversal algorithms. Focus on BFS/DFS fundamentals.',
    priority: 'high',
  },
  {
    topic: 'System Design',
    mastery: 'emerging',
    accuracy: 42,
    description: 'Needs improvement in distributed systems concepts, load balancing, and database sharding patterns.',
    priority: 'high',
  },
  {
    topic: 'Recursion',
    mastery: 'developing',
    accuracy: 52,
    description: 'Tree recursion is improving but backtracking problems still need practice.',
    priority: 'medium',
  },
  {
    topic: 'SQL Optimization',
    mastery: 'developing',
    accuracy: 58,
    description: 'Query planning and indexing strategies need work. JOIN performance weak.',
    priority: 'medium',
  },
  {
    topic: 'Error Handling',
    mastery: 'proficient',
    accuracy: 68,
    description: 'Generally good but async error boundaries and global error patterns need refinement.',
    priority: 'low',
  },
  {
    topic: 'Testing',
    mastery: 'proficient',
    accuracy: 72,
    description: 'Unit tests are solid, but integration and E2E testing coverage is below target.',
    priority: 'low',
  },
]);

const recommendations = ref([
  {
    icon: '🎯',
    title: 'Focus Drill: Dynamic Programming',
    description: 'Complete 10 DP problems this week starting with memoization basics',
    estimatedTime: 30,
  },
  {
    icon: '📖',
    title: 'Read: Designing Data-Intensive Applications',
    description: 'Chapters 5-6 on replication and partitioning',
    estimatedTime: 45,
  },
  {
    icon: '💻',
    title: 'Practice: SQL Performance',
    description: 'Hands-on lab with EXPLAIN ANALYZE and index optimization',
    estimatedTime: 20,
  },
  {
    icon: '🧪',
    title: 'Build: Integration Test Suite',
    description: 'Add integration tests for your top 3 API endpoints',
    estimatedTime: 25,
  },
]);

const filteredAreas = computed(() => {
  if (selectedPriority.value === 'All') return areas.value;
  return areas.value.filter((a) => a.priority === selectedPriority.value.toLowerCase());
});

const priorityColor = (priority) => {
  const map = { high: 'var(--color-danger)', medium: 'var(--color-warning)', low: 'var(--color-success)' };
  return map[priority] || 'var(--color-gray-500)';
};

function selectPriority(p) {
  selectedPriority.value = p;
}

function practiceArea(topic) {
  // placeholder — navigate to practice session for this topic
}

function reviewArea(topic) {
  // placeholder — navigate to review materials for this topic
}

async function fetchData() {
  if (learningStore.projects.length === 0) {
    try {
      await learningStore.fetchProjects();
    } catch {
      // use mock data
    }
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="weak-areas">
    <PageHeader title="Weak Areas" subtitle="Focus on what needs improvement" />

    <!-- Priority Filter -->
    <BaseCard>
      <div class="filters">
        <BaseButton
          v-for="p in priorities"
          :key="p"
          :variant="selectedPriority === p ? 'primary' : 'secondary'"
          size="sm"
          @click="selectPriority(p)"
        >
          {{ p }}
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Empty State if no areas match filter -->
    <div v-if="filteredAreas.length === 0" class="empty-wrapper">
      <BaseCard>
        <div class="empty-state">
          <span class="empty-icon">🎉</span>
          <h3>No weak areas found</h3>
          <p>Great job! No areas match the selected priority filter.</p>
        </div>
      </BaseCard>
    </div>

    <!-- Weak Area Cards -->
    <div class="areas-grid">
      <BaseCard
        v-for="area in filteredAreas"
        :key="area.topic"
        class="area-card"
      >
        <template #header>
          <div class="area-header">
            <h3 class="area-topic">{{ area.topic }}</h3>
            <MasteryBadge :level="area.mastery" />
          </div>
        </template>

        <p class="area-description">{{ area.description }}</p>

        <div class="area-progress">
          <div class="progress-meta">
            <span class="progress-label">Accuracy</span>
            <span class="progress-value" :style="{ color: priorityColor(area.priority) }">
              {{ area.accuracy }}%
            </span>
          </div>
          <ProgressBar
            :value="area.accuracy"
            :color="area.accuracy < 40 ? '--color-danger' : area.accuracy < 60 ? '--color-warning' : '--color-info'"
            height="sm"
          />
        </div>

        <div class="priority-indicator">
          <span
            class="priority-dot"
            :style="{ background: priorityColor(area.priority) }"
          ></span>
          <span class="priority-text" :style="{ color: priorityColor(area.priority) }">
            {{ area.priority.charAt(0).toUpperCase() + area.priority.slice(1) }} Priority
          </span>
        </div>

        <template #footer>
          <div class="area-actions">
            <BaseButton variant="primary" size="sm" @click="practiceArea(area.topic)">
              Practice
            </BaseButton>
            <BaseButton variant="secondary" size="sm" @click="reviewArea(area.topic)">
              Review
            </BaseButton>
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- Recommended Actions -->
    <BaseCard title="Recommended Actions">
      <div class="recommendations">
        <div v-for="rec in recommendations" :key="rec.title" class="rec-item">
          <span class="rec-icon">{{ rec.icon }}</span>
          <div class="rec-body">
            <strong class="rec-title">{{ rec.title }}</strong>
            <p class="rec-desc">{{ rec.description }}</p>
          </div>
          <span class="rec-time">~{{ rec.estimatedTime }}min</span>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.weak-areas {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* ---- Filters ---- */
.filters {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

/* ---- Empty State ---- */
.empty-wrapper {
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-8) 0;
  gap: var(--spacing-2);
}

.empty-icon {
  font-size: 3rem;
  line-height: 1;
}

.empty-state h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-gray-900);
}

.empty-state p {
  margin: 0;
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
}

/* ---- Areas Grid ---- */
.areas-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.area-card {
  display: flex;
  flex-direction: column;
}

.area-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.area-topic {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

.area-description {
  margin: 0 0 var(--spacing-3);
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.area-progress {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-gray-500);
}

.progress-value {
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.priority-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.priority-text {
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.area-actions {
  display: flex;
  gap: var(--spacing-3);
  width: 100%;
}

/* ---- Recommendations ---- */
.recommendations {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.rec-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3);
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
  transition: background-color 0.2s;
}

.rec-item:hover {
  background: var(--color-gray-100);
}

.rec-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: var(--radius-md);
}

.rec-body {
  flex: 1;
  min-width: 0;
}

.rec-title {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-gray-900);
  margin-bottom: 2px;
}

.rec-desc {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  line-height: 1.4;
}

.rec-time {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-gray-500);
  background: #fff;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .areas-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    justify-content: center;
  }

  .rec-item {
    flex-wrap: wrap;
    gap: var(--spacing-3);
  }

  .rec-time {
    margin-left: auto;
  }
}

@media (max-width: 480px) {
  .area-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-2);
  }

  .area-actions {
    flex-direction: column;
  }

  .area-actions .base-btn,
  .area-actions :deep(.base-btn) {
    width: 100%;
  }
}
</style>
