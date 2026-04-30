<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSessionStore } from '../stores/sessionStore';
import { useLearningStore } from '../stores/learningStore';
import PageHeader from '../components/PageHeader.vue';
import BaseCard from '../components/BaseCard.vue';
import BaseButton from '../components/BaseButton.vue';
import BaseModal from '../components/BaseModal.vue';
import ProgressBar from '../components/ProgressBar.vue';
import EmptyState from '../components/EmptyState.vue';

const sessionStore = useSessionStore();
const learningStore = useLearningStore();

const currentTopic = ref('');
const currentContent = ref('');
const currentQuestion = ref(null);
const selectedAnswer = ref(null);
const showSwitchModal = ref(false);
const pendingMode = ref('learn');

const availableModes = ['learn', 'review', 'quiz'];

const projectId = computed(() => learningStore.currentProject?.id);
const sessionId = computed(() => sessionStore.currentSession?.id);

// Mock content for when no backend data is available
const mockContent = [
  {
    topic: 'Introduction to Machine Learning',
    content:
      'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing computer programs that can access data and use it to learn for themselves.',
  },
  {
    topic: 'Supervised Learning',
    content:
      'Supervised learning is the machine learning task of learning a function that maps an input to an output based on example input-output pairs. It infers a function from labeled training data consisting of a set of training examples.',
  },
  {
    topic: 'Neural Networks',
    content:
      'Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) organized in layers that process information using dynamic state responses to external inputs.',
  },
];

const mockQuestions = [
  {
    text: 'What is the primary goal of supervised learning?',
    options: [
      'Learn from unlabeled data',
      'Map inputs to outputs using labeled examples',
      'Maximize reward signals',
      'Reduce data dimensionality',
    ],
  },
  {
    text: 'Which of the following is a key characteristic of neural networks?',
    options: [
      'They require explicit programming for each task',
      'They are composed of interconnected layers of neurons',
      'They only work with structured data',
      'They cannot be trained on images',
    ],
  },
  {
    text: 'What distinguishes machine learning from traditional programming?',
    options: [
      'Faster execution speed',
      'Learning from data without explicit rules',
      'Lower memory usage',
      'Better user interfaces',
    ],
  },
];

let contentIndex = 0;

function loadContent() {
  if (currentTopic.value) {
    const match = mockContent.find((m) => m.topic === currentTopic.value);
    if (match) {
      currentContent.value = match.content;
      return;
    }
  }
  // Default to first item
  currentTopic.value = mockContent[0].topic;
  currentContent.value = mockContent[0].content;
}

function loadQuestion() {
  currentQuestion.value = mockQuestions[contentIndex % mockQuestions.length];
  selectedAnswer.value = null;
}

async function fetchSessionData() {
  const pid = projectId.value;
  const sid = sessionId.value;

  if (pid && sid) {
    try {
      await sessionStore.fetchProgress(pid, sid);
    } catch {
      // use local progress
    }
    try {
      await learningStore.fetchQuestions(pid);
      if (learningStore.questions.length > 0) {
        currentQuestion.value = learningStore.questions[0];
        currentTopic.value =
          learningStore.currentProject?.title || 'Learning Session';
        currentContent.value =
          learningStore.currentProject?.description || '';
      } else {
        loadContent();
        loadQuestion();
      }
    } catch {
      loadContent();
      loadQuestion();
    }
  } else {
    loadContent();
    loadQuestion();
  }
}

function answer(option) {
  selectedAnswer.value = option;
  const isCorrect =
    currentQuestion.value &&
    mockQuestions.indexOf(currentQuestion.value) === 0
      ? option === mockQuestions[0].options[1]
      : option === mockQuestions[1]?.options[1]; // simplified check

  // Move to next question after brief feedback
  if (projectId.value && sessionId.value) {
    sessionStore.updateProgress(projectId.value, sessionId.value, {
      progress: Math.min((sessionStore.progress || 0) + 5, 100),
    });
  }

  currentQuestion.value = null;
  setTimeout(() => {
    contentIndex++;
    loadQuestion();
  }, 800);
}

async function pause() {
  if (projectId.value && sessionId.value) {
    try {
      await sessionStore.pauseSession(projectId.value, sessionId.value);
    } catch {
      // optimistic — store already has isPaused computed
    }
  }
}

async function resume() {
  if (projectId.value && sessionId.value) {
    try {
      await sessionStore.resumeSession(projectId.value, sessionId.value);
    } catch {
      // optimistic
    }
  }
}

function openSwitchModal(mode) {
  pendingMode.value = mode;
  showSwitchModal.value = true;
}

async function confirmSwitchMode() {
  showSwitchModal.value = false;
  if (projectId.value && sessionId.value) {
    try {
      await sessionStore.switchMode(
        projectId.value,
        sessionId.value,
        pendingMode.value,
      );
    } catch {
      // optimistic
    }
  }
  sessionStore.mode = pendingMode.value;
}

async function end() {
  if (projectId.value && sessionId.value) {
    try {
      await sessionStore.endSession(projectId.value, sessionId.value);
    } catch {
      // optimistic
    }
  }
}

onMounted(() => {
  fetchSessionData();
});
</script>

<template>
  <div class="learning-session">
    <PageHeader title="Learning Session" :subtitle="currentTopic" />

    <!-- Progress -->
    <div class="session-progress-bar">
      <span class="progress-heading">Session Progress</span>
      <ProgressBar :value="sessionStore.progress" height="md" />
    </div>

    <!-- Content Area -->
    <div class="session-layout">
      <!-- Main content -->
      <BaseCard class="content-panel" shadow>
        <template #header>
          <h3 class="content-topic">{{ currentTopic }}</h3>
        </template>
        <div class="content-body">
          <p class="content-text">{{ currentContent }}</p>
        </div>
      </BaseCard>

      <!-- Question / Tutor Panel -->
      <BaseCard class="side-panel" shadow>
        <template #header>
          <h4 class="panel-title">💬 AI Tutor</h4>
        </template>

        <div v-if="currentQuestion" class="question-area">
          <p class="question-text">{{ currentQuestion.text }}</p>
          <div class="question-options">
            <BaseButton
              v-for="opt in currentQuestion.options"
              :key="opt"
              variant="secondary"
              size="sm"
              class="option-btn"
              :class="{ 'option-selected': selectedAnswer === opt }"
              @click="answer(opt)"
            >
              {{ opt }}
            </BaseButton>
          </div>
          <p v-if="selectedAnswer" class="answer-feedback">
            ✅ Answer submitted! Loading next question...
          </p>
        </div>
        <EmptyState
          v-else
          icon="🤔"
          title="No active question"
          description="Continue the lesson to receive questions from the AI tutor."
        />
      </BaseCard>
    </div>

    <!-- Session Controls -->
    <div class="session-controls">
      <div class="controls-left">
        <BaseButton
          v-if="sessionStore.isActive"
          variant="secondary"
          @click="pause"
        >
          ⏸ Pause
        </BaseButton>
        <BaseButton
          v-if="sessionStore.isPaused"
          variant="primary"
          @click="resume"
        >
          ▶ Resume
        </BaseButton>
      </div>

      <div class="controls-right">
        <div class="mode-switcher">
          <span class="control-label">Mode:</span>
          <BaseButton
            v-for="mode in availableModes"
            :key="mode"
            size="sm"
            :variant="sessionStore.mode === mode ? 'primary' : 'secondary'"
            @click="openSwitchModal(mode)"
          >
            {{ mode }}
          </BaseButton>
        </div>
        <BaseButton variant="danger" @click="end">
          ⏹ End Session
        </BaseButton>
      </div>
    </div>

    <!-- Switch Mode Confirmation Modal -->
    <BaseModal
      v-model="showSwitchModal"
      title="Switch Mode"
      size="sm"
    >
      <p>Are you sure you want to switch to <strong>{{ pendingMode }}</strong> mode?</p>
      <p class="modal-note">Your current progress will be saved.</p>
      <template #footer>
        <BaseButton variant="secondary" @click="showSwitchModal = false">
          Cancel
        </BaseButton>
        <BaseButton variant="primary" @click="confirmSwitchMode">
          Switch to {{ pendingMode }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.learning-session {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* ---- Progress Bar ---- */
.session-progress-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  max-width: 600px;
}

.progress-heading {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ---- Layout ---- */
.session-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--spacing-6);
  align-items: start;
}

.content-panel {
  min-height: 400px;
}

.content-topic {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-gray-900);
}

.content-body {
  line-height: 1.8;
}

.content-text {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-gray-700);
  line-height: 1.8;
}

/* ---- Side Panel ---- */
.side-panel {
  min-height: 300px;
}

.panel-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.question-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.question-text {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-gray-900);
  line-height: 1.6;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.option-btn {
  width: 100%;
  justify-content: flex-start;
  text-align: left;
  transition: all 0.15s;
}

.option-selected {
  background: var(--color-primary-100) !important;
  border-color: var(--color-primary-500) !important;
  color: var(--color-primary-700) !important;
}

.answer-feedback {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-success);
  text-align: center;
  padding: var(--spacing-2);
  background: #ecfdf5;
  border-radius: var(--radius-md);
}

/* ---- Controls ---- */
.session-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-6);
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
  gap: var(--spacing-4);
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.mode-switcher {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.control-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-500);
  margin-right: var(--spacing-1);
  text-transform: capitalize;
}

/* ---- Modal ---- */
.modal-note {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

/* ---- Responsive ---- */
@media (max-width: 1024px) {
  .session-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .session-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-left,
  .controls-right {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
