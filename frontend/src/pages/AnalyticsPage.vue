<script setup>
import { ref, computed, onMounted } from 'vue';
import { useLearningStore } from '../stores/learningStore';
import { useSessionStore } from '../stores/sessionStore';
import PageHeader from '../components/PageHeader.vue';
import BaseCard from '../components/BaseCard.vue';
import BaseButton from '../components/BaseButton.vue';
import MasteryBadge from '../components/MasteryBadge.vue';

const learningStore = useLearningStore();
const sessionStore = useSessionStore();

const periods = ['Week', 'Month', '3 Months', 'Year'];
const selectedPeriod = ref('Month');

const summaryStats = ref([
  { icon: '📊', value: '24', label: 'Sessions' },
  { icon: '❓', value: '156', label: 'Questions' },
  { icon: '🎯', value: '82%', label: 'Accuracy' },
  { icon: '⏱️', value: '8.5h', label: 'Time' },
]);

const topics = ref([
  { name: 'JavaScript', accuracy: 88, time: 120, mastery: 'advanced' },
  { name: 'Python', accuracy: 85, time: 95, mastery: 'proficient' },
  { name: 'React', accuracy: 78, time: 60, mastery: 'developing' },
  { name: 'Data Structures', accuracy: 72, time: 45, mastery: 'developing' },
  { name: 'Algorithms', accuracy: 65, time: 55, mastery: 'emerging' },
  { name: 'CSS', accuracy: 90, time: 35, mastery: 'expert' },
  { name: 'Database', accuracy: 76, time: 40, mastery: 'proficient' },
  { name: 'System Design', accuracy: 58, time: 30, mastery: 'emerging' },
]);

const filteredTopics = computed(() => topics.value);

function selectPeriod(period) {
  selectedPeriod.value = period;
  // In future: refetch analytics for this period
}

function exportData() {
  // placeholder for export functionality
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
  <div class="analytics">
    <PageHeader title="Analytics" subtitle="Track your learning progress">
      <template #actions>
        <BaseButton variant="secondary" size="sm" @click="exportData">Export</BaseButton>
      </template>
    </PageHeader>

    <!-- Time Period Filter -->
    <BaseCard>
      <div class="filters">
        <BaseButton
          v-for="period in periods"
          :key="period"
          :variant="selectedPeriod === period ? 'primary' : 'secondary'"
          size="sm"
          @click="selectPeriod(period)"
        >
          {{ period }}
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Stats Row -->
    <div class="stats-row">
      <BaseCard v-for="s in summaryStats" :key="s.label">
        <div class="stat">
          <span class="stat-icon">{{ s.icon }}</span>
          <span class="stat-value">{{ s.value }}</span>
          <small class="stat-label">{{ s.label }}</small>
        </div>
      </BaseCard>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <BaseCard title="Learning Activity">
        <div class="chart-placeholder">
          <span class="chart-emoji">📈</span>
          <span class="chart-text">Activity over time</span>
          <div class="mock-chart activity-chart">
            <div class="bar-group" v-for="n in 7" :key="n">
              <div class="bar" :style="{ height: (30 + Math.random() * 70) + '%' }"></div>
            </div>
          </div>
        </div>
      </BaseCard>
      <BaseCard title="Mastery Trends">
        <div class="chart-placeholder">
          <span class="chart-emoji">📊</span>
          <span class="chart-text">Mastery by topic</span>
          <div class="mock-chart mastery-chart">
            <div class="mastery-bar" v-for="(level, idx) in ['expert','advanced','proficient','developing','emerging','novice']" :key="level">
              <span class="mastery-label">{{ level }}</span>
              <div class="mastery-track">
                <div class="mastery-fill" :style="{ width: (60 - idx * 8) + '%', background: `var(--color-mastery-${level})` }"></div>
              </div>
              <span class="mastery-count">{{ 5 - idx }}</span>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Topics Table -->
    <BaseCard title="Topics Performance">
      <div class="table-wrapper">
        <table class="topics-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Accuracy</th>
              <th>Time</th>
              <th>Mastery</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTopics" :key="t.name">
              <td class="topic-name">{{ t.name }}</td>
              <td>
                <span class="accuracy-value" :style="{ color: t.accuracy >= 80 ? 'var(--color-success)' : t.accuracy >= 60 ? 'var(--color-warning)' : 'var(--color-danger)' }">
                  {{ t.accuracy }}%
                </span>
              </td>
              <td>{{ t.time }}m</td>
              <td><MasteryBadge :level="t.mastery" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.analytics {
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

/* ---- Stats Row ---- */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-4);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2) 0;
}

.stat-icon {
  font-size: 2rem;
  line-height: 1;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-gray-900);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

/* ---- Charts Grid ---- */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4) 0;
}

.chart-emoji {
  font-size: 2.5rem;
  line-height: 1;
}

.chart-text {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

/* Mock activity bar chart */
.mock-chart {
  width: 100%;
  max-width: 300px;
}

.activity-chart {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: var(--spacing-2);
  height: 100px;
  padding-top: var(--spacing-3);
}

.bar-group {
  flex: 1;
  display: flex;
  align-items: flex-end;
  height: 100%;
}

.bar {
  width: 100%;
  background: var(--color-primary-500);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  min-height: 4px;
  transition: height 0.3s;
}

/* Mastery distribution chart */
.mastery-chart {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding-top: var(--spacing-2);
}

.mastery-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.mastery-label {
  width: 80px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: capitalize;
  color: var(--color-gray-700);
}

.mastery-track {
  flex: 1;
  height: 10px;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.mastery-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s;
}

.mastery-count {
  width: 24px;
  text-align: right;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-gray-500);
}

/* ---- Topics Table ---- */
.table-wrapper {
  overflow-x: auto;
}

.topics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.topics-table th {
  text-align: left;
  padding: var(--spacing-2) var(--spacing-4);
  font-weight: 600;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-gray-500);
  border-bottom: 2px solid var(--color-gray-200);
  white-space: nowrap;
}

.topics-table td {
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-100);
  color: var(--color-gray-700);
  vertical-align: middle;
}

.topics-table tbody tr:hover {
  background: var(--color-gray-50);
}

.topic-name {
  font-weight: 600;
  color: var(--color-gray-900);
}

.accuracy-value {
  font-weight: 600;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .topics-table th,
  .topics-table td {
    padding: var(--spacing-2);
  }
}
</style>
