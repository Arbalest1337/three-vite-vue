import { createRouter, createWebHistory } from 'vue-router'

const constantRoutes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/Home.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/Dashboard.vue')
  }
]

export const resetRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: constantRoutes
  })

const router = resetRouter()

export default router
