import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';
import { getToken } from '@/services/storage';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/note'
      },
      {
        path: 'note',
        component: () => import('@/views/NoteView.vue')
      },
      {
        path: 'shares',
        component: () => import('@/views/ShareView.vue')
      },
      {
        path: 'trash',
        component: () => import('@/views/TrashView.vue')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/change-password',
    component: () => import('@/views/ChangePasswordView.vue')
  },
  {
    // 笔记详情子页：顶层路由（不在 TabsPage children 内），底部 Tab 栏自动隐藏
    path: '/note/:noteId',
    component: () => import('@/views/NoteDetailView.vue')
  },
  {
    // 关于页：顶层路由（不在 TabsPage children 内），底部 Tab 栏自动隐藏
    path: '/about',
    component: () => import('@/views/AboutPage.vue')
  },
  {
    // AI 对话页：顶层路由（不在 TabsPage children 内），底部 Tab 栏自动隐藏
    path: '/ai',
    component: () => import('@/views/AIView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫：未登录跳登录页；已登录访问登录页跳笔记页
router.beforeEach((to) => {
  const isLoggedIn = !!getToken();
  const isLoginRoute = to.path === '/login';

  if (!isLoggedIn && !isLoginRoute) {
    // 未登录：除登录页外一律重定向到登录页
    return { path: '/login' };
  }

  if (isLoggedIn && isLoginRoute) {
    // 已登录访问登录页：重定向到笔记页
    return { path: '/note' };
  }

  return true;
});

export default router;
