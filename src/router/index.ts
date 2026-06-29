import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';
import { getToken } from '@/services/storage';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/tab1'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        component: () => import('@/views/Tab1Page.vue')
      },
      {
        path: 'tab2',
        component: () => import('@/views/Tab2Page.vue')
      },
      {
        path: 'tab3',
        component: () => import('@/views/Tab3Page.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫：未登录跳登录页；已登录访问登录页跳主页
router.beforeEach((to) => {
  const isLoggedIn = !!getToken();
  const isLoginRoute = to.path === '/login';

  if (!isLoggedIn && !isLoginRoute) {
    // 未登录：除登录页外一律重定向到登录页
    return { path: '/login' };
  }

  if (isLoggedIn && isLoginRoute) {
    // 已登录访问登录页：重定向到主页
    return { path: '/tabs/tab1' };
  }

  return true;
});

export default router;
