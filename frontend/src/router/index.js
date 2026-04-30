import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('../pages/DashboardPage.vue') },
      { path: 'learn', name: 'learn', component: () => import('../pages/LearningSessionPage.vue') },
      { path: 'quiz', name: 'quiz', component: () => import('../pages/QuizPage.vue') },
      { path: 'profile', name: 'profile', component: () => import('../pages/ProfilePage.vue') },
      { path: 'analytics', name: 'analytics', component: () => import('../pages/AnalyticsPage.vue') },
      { path: 'weak-areas', name: 'weak-areas', component: () => import('../pages/WeakAreasPage.vue') },
    ],
  },
  {
    path: '/login',
    name: 'login',
    // Simple login placeholder - just a div with "Login Page" text
    component: { template: '<div class="login-page" style="display:flex;align-items:center;justify-content:center;height:100vh"><h1>Smart Learn Login</h1></div>' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth guard
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return next('/login');
    }
  }
  next();
});

export default router;
