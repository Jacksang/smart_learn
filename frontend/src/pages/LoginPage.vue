<template>
  <div class="login-page">
    <div class="login-card">
      <h1>📚 Smart Learn</h1>
      <p class="subtitle">Your AI-powered learning companion</p>

      <BaseInput v-model="email" label="Email" type="email" placeholder="Enter your email" />
      <BaseInput v-model="password" label="Password" type="password" placeholder="Enter your password" />

      <div v-if="authStore.error" class="error">{{ authStore.error }}</div>

      <BaseButton variant="primary" @click="login" :loading="authStore.loading" :disabled="!email || !password">
        Sign In
      </BaseButton>

      <div class="links">
        <a href="#" @click.prevent="showRegister = !showRegister">
          {{ showRegister ? 'Already have an account? Sign in' : 'Create an account' }}
        </a>
      </div>

      <div v-if="showRegister" class="register-form">
        <BaseInput v-model="name" label="Name" placeholder="Your name" />
        <BaseButton variant="secondary" @click="register" :loading="authStore.loading" :disabled="!email || !password || !name">
          Register
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import BaseInput from '../components/BaseInput.vue';
import BaseButton from '../components/BaseButton.vue';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const name = ref('');
const showRegister = ref(false);

async function login() {
  const success = await authStore.login(email.value, password.value);
  if (success) router.push('/');
}

async function register() {
  const success = await authStore.register({
    name: name.value,
    email: email.value,
    password: password.value,
  });
  if (success) router.push('/');
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-gray-50);
}

.login-card {
  background: white;
  padding: var(--spacing-12);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.login-card h1 {
  text-align: center;
  color: var(--color-primary-500);
  font-size: var(--font-size-2xl);
  margin: 0;
}

.subtitle {
  text-align: center;
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
  margin: 0;
}

.error {
  background: #FEE2E2;
  color: var(--color-danger);
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.links {
  text-align: center;
  font-size: var(--font-size-sm);
}

.links a {
  color: var(--color-primary-500);
  text-decoration: none;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-gray-200);
}
</style>
