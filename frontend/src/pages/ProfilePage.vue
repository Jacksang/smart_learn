<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProfileStore } from '../stores/profileStore';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader.vue';
import BaseCard from '../components/BaseCard.vue';
import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import BaseAvatar from '../components/BaseAvatar.vue';
import MasteryBadge from '../components/MasteryBadge.vue';

const profileStore = useProfileStore();
const authStore = useAuthStore();

const showPasswordModal = ref(false);
const showEditModal = ref(false);

const stats = ref([
  { icon: '📊', value: '42', label: 'Total Sessions' },
  { icon: '⏱️', value: '18h', label: 'Total Time' },
  { icon: '🔥', value: '7d', label: 'Streak' },
  { icon: '🎯', value: '82%', label: 'Accuracy' },
]);

const profile = computed(() => profileStore.profile);
const subscription = computed(() => profileStore.subscription);
const prefs = computed(() => profileStore.preferences);

const achievements = computed(() => [
  { icon: '🏆', title: '7-Day Streak', description: 'Completed 7 consecutive days', color: '#F59E0B' },
  { icon: '🚀', title: 'Fast Learner', description: 'Completed 10+ sessions', color: '#3B82F6' },
  { icon: '🎯', title: 'Sharpshooter', description: 'Accuracy above 80%', color: '#10B981' },
  { icon: '📚', title: 'Bookworm', description: 'Studied 5+ topics', color: '#8B5CF6' },
]);

function editProfile() {
  showEditModal.value = true;
}

function editAvatar() {
  // trigger file upload — placeholder
}

async function fetchData() {
  try {
    await profileStore.fetchProfile();
  } catch {
    // use mock fallback
  }
  try {
    await profileStore.fetchSubscription();
  } catch {
    // use mock fallback
  }
  if (!authStore.user) {
    try {
      await authStore.fetchProfile();
    } catch {
      // use mock fallback
    }
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="profile-page">
    <PageHeader title="Profile" subtitle="Manage your account" />

    <!-- Profile Header -->
    <BaseCard>
      <div class="profile-header">
        <div class="avatar-section">
          <BaseAvatar
            :name="profile?.display_name || authStore.user?.display_name || 'User'"
            size="xl"
            :src="profile?.avatar_url || authStore.user?.avatar_url"
          />
          <BaseButton variant="ghost" size="sm" @click="editAvatar">📷</BaseButton>
        </div>
        <div class="profile-info">
          <h2>{{ profile?.display_name || authStore.user?.display_name || 'User' }}</h2>
          <p class="profile-email">{{ profile?.email || authStore.user?.email || 'No email set' }}</p>
          <p class="profile-bio">{{ profile?.bio || 'No bio yet — tell us about yourself!' }}</p>
          <div class="profile-actions">
            <BaseButton variant="secondary" size="sm" @click="editProfile">Edit Profile</BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Achievements -->
    <BaseCard title="🏆 Achievements">
      <div class="achievements-grid">
        <div v-for="a in achievements" :key="a.title" class="achievement-item">
          <span class="achievement-icon" :style="{ background: a.color }">{{ a.icon }}</span>
          <div class="achievement-text">
            <strong>{{ a.title }}</strong>
            <small>{{ a.description }}</small>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <BaseCard v-for="stat in stats" :key="stat.label">
        <div class="stat">
          <span class="stat-icon">{{ stat.icon }}</span>
          <span class="stat-value">{{ stat.value }}</span>
          <small class="stat-label">{{ stat.label }}</small>
        </div>
      </BaseCard>
    </div>

    <!-- Subscription Card -->
    <BaseCard title="Subscription">
      <div class="subscription">
        <div class="sub-header">
          <span class="plan-badge" :class="subscription?.plan || 'free'">
            {{ subscription?.plan || 'Free' }}
          </span>
          <MasteryBadge
            v-if="subscription?.plan && subscription.plan !== 'free'"
            :level="'advanced'"
          />
        </div>
        <p class="sub-description">
          {{ subscription?.description || 'Basic access with limited features. Upgrade for full access to premium content and personalized learning paths.' }}
        </p>
        <div class="sub-features">
          <div class="sub-feature" v-for="f in subscription?.features || ['📊 Basic analytics', '📚 3 topics', '⏱️ 30 min/session']" :key="f">
            <span>{{ f }}</span>
          </div>
        </div>
        <div class="sub-actions">
          <BaseButton v-if="!subscription?.plan || subscription.plan === 'free'" variant="primary">
            Upgrade to Premium
          </BaseButton>
          <BaseButton v-else variant="secondary">Manage Subscription</BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Learning Preferences -->
    <BaseCard title="Learning Preferences">
      <div class="prefs-form">
        <div class="pref-row">
          <BaseInput
            label="Daily Goal (minutes)"
            type="number"
            :modelValue="String(prefs?.dailyGoalMinutes || 30)"
          />
        </div>
        <div class="pref-row">
          <BaseInput
            label="Learning Style"
            :modelValue="prefs?.learningStyle || 'Visual'"
          />
        </div>
        <div class="pref-row">
          <BaseInput
            label="Preferred Topics"
            :modelValue="prefs?.preferredTopics?.join(', ') || ''"
          />
        </div>
        <div class="pref-actions">
          <BaseButton variant="primary" size="sm">Save Preferences</BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Notification Preferences -->
    <BaseCard title="Notification Preferences">
      <div class="toggle-list">
        <div class="toggle-row">
          <span>Email Notifications</span>
          <label class="toggle-switch">
            <input type="checkbox" :checked="prefs?.emailNotifications !== false" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="toggle-row">
          <span>Push Notifications</span>
          <label class="toggle-switch">
            <input type="checkbox" :checked="prefs?.pushNotifications !== false" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="toggle-row">
          <span>Session Reminders</span>
          <label class="toggle-switch">
            <input type="checkbox" :checked="prefs?.sessionReminders !== false" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="toggle-row">
          <span>Weekly Reports</span>
          <label class="toggle-switch">
            <input type="checkbox" :checked="prefs?.weeklyReports !== false" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </BaseCard>

    <!-- Security -->
    <BaseCard title="Security">
      <div class="security-section">
        <p class="security-desc">Manage your password and account security settings.</p>
        <BaseButton variant="secondary" @click="showPasswordModal = true">
          Change Password
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* ---- Profile Header ---- */
.profile-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-6);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-info h2 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-gray-900);
}

.profile-email {
  margin: var(--spacing-1) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.profile-bio {
  margin: var(--spacing-3) 0 0;
  color: var(--color-gray-700);
  line-height: 1.5;
}

.profile-actions {
  margin-top: var(--spacing-4);
  display: flex;
  gap: var(--spacing-3);
}

/* ---- Stats Grid ---- */
.stats-grid {
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

/* ---- Achievements ---- */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
}

.achievement-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  font-size: 1.3rem;
  flex-shrink: 0;
}

.achievement-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.achievement-text strong {
  font-size: var(--font-size-sm);
  color: var(--color-gray-900);
}

.achievement-text small {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

/* ---- Subscription ---- */
.subscription {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.sub-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.plan-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-4);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: capitalize;
}

.plan-badge.free {
  background: var(--color-gray-200);
  color: var(--color-gray-700);
}

.plan-badge.premium {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
}

.sub-description {
  margin: 0;
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.sub-features {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.sub-feature {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
}

.sub-actions {
  padding-top: var(--spacing-2);
}

/* ---- Preferences ---- */
.prefs-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.pref-row {
  max-width: 400px;
}

.pref-actions {
  padding-top: var(--spacing-2);
}

/* ---- Toggle Switches ---- */
.toggle-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid var(--color-gray-100);
}

.toggle-row:last-child {
  border-bottom: none;
}

.toggle-row span {
  font-size: var(--font-size-base);
  color: var(--color-gray-700);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--color-gray-300);
  border-radius: var(--radius-full);
  transition: background-color 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  top: 3px;
  left: 3px;
  background: #fff;
  border-radius: var(--radius-full);
  transition: transform 0.2s;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-primary-500);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* ---- Security ---- */
.security-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.security-desc {
  margin: 0;
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-info {
    text-align: center;
  }

  .profile-actions {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
