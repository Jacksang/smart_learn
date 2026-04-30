<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLearningStore } from '../stores/learningStore';
import PageHeader from '../components/PageHeader.vue';
import BaseCard from '../components/BaseCard.vue';
import BaseButton from '../components/BaseButton.vue';
import ProgressBar from '../components/ProgressBar.vue';
import MasteryBadge from '../components/MasteryBadge.vue';
import EmptyState from '../components/EmptyState.vue';

const learningStore = useLearningStore();

// State
const currentIndex = ref(0);
const selectedAnswer = ref(null);
const elapsed = ref(0);
const showResults = ref(false);
const reviewMode = ref(false);
const answers = ref([]); // { question, selected, correct }
let timerInterval = null;

// Mock quiz data
const mockQuiz = [
  {
    text: 'What is the capital of France?',
    options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
    correct: 'Paris',
  },
  {
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correct: 'Mars',
  },
  {
    text: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correct: 'Pacific',
  },
  {
    text: 'Who wrote "Romeo and Juliet"?',
    options: ['Dickens', 'Shakespeare', 'Hemingway', 'Austen'],
    correct: 'Shakespeare',
  },
  {
    text: 'What is the chemical symbol for water?',
    options: ['O2', 'CO2', 'H2O', 'NaCl'],
    correct: 'H2O',
  },
  {
    text: 'How many continents are there?',
    options: ['5', '6', '7', '8'],
    correct: '7',
  },
  {
    text: 'What year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correct: '1945',
  },
  {
    text: 'What is the square root of 64?',
    options: ['6', '7', '8', '9'],
    correct: '8',
  },
];

const total = computed(() =>
  reviewMode.value ? answers.value.length : quizData.value.length,
);

const quizData = computed(() => {
  if (learningStore.questions.length > 0) {
    return learningStore.questions.map((q) => ({
      text: q.text || q.question,
      options: q.options || [],
      correct: q.correct || q.answer,
    }));
  }
  return mockQuiz;
});

const currentQuestion = computed(() => {
  if (reviewMode.value) {
    const a = answers.value[currentIndex.value];
    return a
      ? {
          text: a.question.text,
          options: a.question.options,
          correct: a.question.correct,
          _selected: a.selected,
        }
      : null;
  }
  return quizData.value[currentIndex.value] || null;
});

const score = computed(() =>
  answers.value.filter((a) => a.selected === a.correct).length,
);

const accuracy = computed(() => {
  if (answers.value.length === 0) return 0;
  return Math.round((score.value / answers.value.length) * 100);
});

const resultLevel = computed(() => {
  const a = accuracy.value;
  if (a >= 95) return 'expert';
  if (a >= 85) return 'advanced';
  if (a >= 70) return 'proficient';
  if (a >= 50) return 'developing';
  if (a >= 30) return 'emerging';
  return 'novice';
});

// Timer
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    elapsed.value++;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Navigation
function selectAnswer(option) {
  selectedAnswer.value = option;
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    selectedAnswer.value = reviewMode.value
      ? answers.value[currentIndex.value]?.selected
      : null;
  }
}

function next() {
  if (!selectedAnswer.value && !reviewMode.value) return;

  if (!reviewMode.value) {
    // Record answer
    answers.value.push({
      question: currentQuestion.value,
      selected: selectedAnswer.value,
      correct: currentQuestion.value.correct,
    });

    if (currentIndex.value < quizData.value.length - 1) {
      currentIndex.value++;
      selectedAnswer.value = null;
    } else {
      // Quiz finished
      stopTimer();
      showResults.value = true;
    }
  } else {
    if (currentIndex.value < answers.value.length - 1) {
      currentIndex.value++;
      selectedAnswer.value =
        answers.value[currentIndex.value]?.selected;
    }
  }
}

function review() {
  reviewMode.value = true;
  currentIndex.value = 0;
  showResults.value = false;
  selectedAnswer.value = answers.value[0]?.selected;
}

function restartQuiz() {
  stopTimer();
  answers.value = [];
  currentIndex.value = 0;
  selectedAnswer.value = null;
  elapsed.value = 0;
  showResults.value = false;
  reviewMode.value = false;
  startTimer();
}

async function fetchQuizData() {
  const projectId = learningStore.currentProject?.id;
  if (projectId) {
    try {
      await learningStore.fetchQuestions(projectId, { limit: 20 });
    } catch {
      // use mock data
    }
  }
}

onMounted(() => {
  fetchQuizData();
  startTimer();
});

onUnmounted(() => {
  stopTimer();
});
</script>

<template>
  <div class="quiz">
    <!-- Results Screen -->
    <template v-if="showResults">
      <PageHeader title="Quiz Complete!" subtitle="Here's how you did" />

      <BaseCard title="Quiz Results" shadow>
        <div class="results">
          <div class="results-score">
            <div class="score-circle" :class="`score-${resultLevel}`">
              <span class="score-number">{{ accuracy }}%</span>
            </div>
          </div>

          <div class="results-stats">
            <div class="stat-row">
              <span class="stat-label">Score</span>
              <span class="stat-value">{{ score }} / {{ answers.length }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Accuracy</span>
              <span class="stat-value">{{ accuracy }}%</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Time Taken</span>
              <span class="stat-value">{{ formatTime(elapsed) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Mastery</span>
              <MasteryBadge :level="resultLevel" />
            </div>
          </div>

          <div class="results-actions">
            <BaseButton variant="primary" @click="review">
              🔍 Review Answers
            </BaseButton>
            <BaseButton variant="secondary" @click="restartQuiz">
              🔄 Retake Quiz
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </template>

    <!-- Quiz Active -->
    <template v-else>
      <PageHeader
        :title="reviewMode ? 'Review Mode' : 'Quiz'"
        :subtitle="`Question ${currentIndex + 1} of ${total}`"
      />

      <!-- Timer + Progress -->
      <div class="quiz-header">
        <div class="timer">
          <span class="timer-icon">⏱</span>
          <span class="timer-value">{{ formatTime(elapsed) }}</span>
        </div>
        <div class="quiz-progress">
          <ProgressBar
            :value="(currentIndex / total) * 100"
            height="md"
            :show-label="true"
          />
        </div>
        <div class="quiz-counter">
          {{ currentIndex + 1 }} / {{ total }}
        </div>
      </div>

      <!-- Question -->
      <BaseCard v-if="currentQuestion" shadow>
        <div class="question-area">
          <h3 class="question-text">{{ currentQuestion.text }}</h3>

          <div class="options-grid">
            <button
              v-for="opt in currentQuestion.options"
              :key="opt"
              class="option-card"
              :class="{
                'option-selected': selectedAnswer === opt && !reviewMode,
                'option-correct': reviewMode && opt === currentQuestion.correct,
                'option-wrong':
                  reviewMode &&
                  opt === currentQuestion._selected &&
                  opt !== currentQuestion.correct,
                'option-dimmed':
                  reviewMode &&
                  selectedAnswer !== opt &&
                  opt !== currentQuestion.correct,
              }"
              :disabled="reviewMode"
              @click="selectAnswer(opt)"
            >
              <span class="option-text">{{ opt }}</span>
              <span
                v-if="reviewMode && opt === currentQuestion.correct"
                class="option-indicator"
              >✅</span>
              <span
                v-if="
                  reviewMode &&
                  opt === currentQuestion._selected &&
                  opt !== currentQuestion.correct
                "
                class="option-indicator"
              >❌</span>
            </button>
          </div>

          <!-- Review Explanation -->
          <div v-if="reviewMode" class="review-explanation">
            <p v-if="currentQuestion._selected === currentQuestion.correct">
              ✅ Correct! Great job.
            </p>
            <p v-else>
              ❌ Incorrect. The correct answer is
              <strong>{{ currentQuestion.correct }}</strong>.
            </p>
          </div>
        </div>
      </BaseCard>

      <EmptyState
        v-else
        icon="📋"
        title="No questions available"
        description="There are no quiz questions loaded. Try refreshing or selecting a different project."
      />

      <!-- Navigation -->
      <div class="quiz-nav">
        <BaseButton
          variant="secondary"
          :disabled="currentIndex === 0"
          @click="prev"
        >
          ← Previous
        </BaseButton>

        <div class="nav-dots">
          <span
            v-for="(_, i) in total"
            :key="i"
            class="nav-dot"
            :class="{
              'dot-active': i === currentIndex,
              'dot-answered':
                !reviewMode &&
                answers.value[i] !== undefined,
              'dot-correct':
                reviewMode &&
                answers.value[i]?.selected ===
                  answers.value[i]?.correct,
              'dot-wrong':
                reviewMode &&
                answers.value[i]?.selected !==
                  answers.value[i]?.correct,
            }"
          />
        </div>

        <BaseButton
          variant="primary"
          :disabled="!selectedAnswer && !reviewMode"
          @click="next"
        >
          {{ currentIndex === total - 1 ? 'Finish' : 'Next →' }}
        </BaseButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.quiz {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* ---- Header (Timer + Progress) ---- */
.quiz-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-6);
  padding: var(--spacing-4) var(--spacing-6);
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
}

.timer {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

.timer-icon {
  font-size: 1.25rem;
}

.timer-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-gray-900);
  min-width: 4.5em;
}

.quiz-progress {
  flex: 1;
  min-width: 0;
}

.quiz-counter {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-500);
  white-space: nowrap;
}

/* ---- Question Area ---- */
.question-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.question-text {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-gray-900);
  line-height: 1.6;
}

/* ---- Options Grid ---- */
.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.option-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-5);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  background: #fff;
  font-size: var(--font-size-base);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  line-height: 1.4;
}

.option-card:hover:not(:disabled) {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
}

.option-selected {
  border-color: var(--color-primary-500);
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  font-weight: 600;
}

.option-correct {
  border-color: var(--color-success);
  background: #ecfdf5;
  color: #065f46;
  font-weight: 600;
}

.option-wrong {
  border-color: var(--color-danger);
  background: #fef2f2;
  color: #991b1b;
  font-weight: 600;
}

.option-dimmed {
  opacity: 0.4;
}

.option-text {
  flex: 1;
}

.option-indicator {
  font-size: 1.2rem;
  margin-left: var(--spacing-2);
  flex-shrink: 0;
}

/* ---- Review Explanation ---- */
.review-explanation {
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-gray-200);
}

.review-explanation p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
}

.review-explanation strong {
  color: var(--color-gray-900);
}

/* ---- Navigation ---- */
.quiz-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) 0;
}

.nav-dots {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
  justify-content: center;
}

.nav-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--color-gray-200);
  transition: all 0.2s;
}

.dot-active {
  background: var(--color-primary-500);
  transform: scale(1.3);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.dot-answered {
  background: var(--color-primary-300);
}

.dot-correct {
  background: var(--color-success);
}

.dot-wrong {
  background: var(--color-danger);
}

/* ---- Results ---- */
.results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-8);
  padding: var(--spacing-6) 0;
}

.results-score {
  display: flex;
  justify-content: center;
}

.score-circle {
  width: 140px;
  height: 140px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 6px solid;
}

.score-expert {
  border-color: var(--color-mastery-expert);
  background: #ecfdf5;
}

.score-advanced {
  border-color: var(--color-mastery-advanced);
  background: #ecfeff;
}

.score-proficient {
  border-color: var(--color-mastery-proficient);
  background: #eff6ff;
}

.score-developing {
  border-color: var(--color-mastery-developing);
  background: #ecfdf5;
}

.score-emerging {
  border-color: var(--color-mastery-emerging);
  background: #fffbeb;
}

.score-novice {
  border-color: var(--color-mastery-novice);
  background: #fef2f2;
}

.score-number {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  color: var(--color-gray-900);
}

.results-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-6);
  width: 100%;
  max-width: 500px;
}

.stat-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  min-width: 100px;
}

.stat-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-gray-500);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-gray-900);
}

.results-actions {
  display: flex;
  gap: var(--spacing-4);
  flex-wrap: wrap;
  justify-content: center;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .quiz-header {
    flex-wrap: wrap;
    gap: var(--spacing-3);
  }

  .options-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .quiz-nav {
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .nav-dots {
    order: -1;
  }

  .results-stats {
    gap: var(--spacing-3);
  }
}
</style>
