import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true, title: '로그인' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { title: '통합 대시보드', icon: 'fa-gauge-high', pageKey: 'dashboard' }
  },
  {
    path: '/pms',
    redirect: '/pms/projects'
  },
  {
    path: '/pms/:table',
    name: 'Pms',
    component: () => import('../pms/PmsView.vue'),
    meta: { title: 'PMS · Teedy 도입 통합 대시보드', icon: 'fa-table-cells', pageKey: 'pms' }
  },
  {
    path: '/roadmap',
    name: 'Roadmap',
    component: () => import('../views/RoadmapView.vue'),
    meta: { title: '3개월 로드맵', icon: 'fa-map', pageKey: 'roadmap' }
  },
  {
    path: '/dev-modules',
    name: 'DevModules',
    component: () => import('../views/DevModulesView.vue'),
    meta: { title: '개발모듈 백로그', icon: 'fa-list-check', pageKey: 'dev-modules' }
  },
  {
    path: '/mapping',
    name: 'Mapping',
    component: () => import('../views/MappingView.vue'),
    meta: { title: 'SAP-KMS 매핑', icon: 'fa-link', pageKey: 'mapping' }
  },
  {
    path: '/acl',
    name: 'Acl',
    component: () => import('../views/AclView.vue'),
    meta: { title: '권한(ACL) 설계', icon: 'fa-shield-halved', pageKey: 'acl' }
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('../views/DocumentsView.vue'),
    meta: { title: '문서관리', icon: 'fa-folder-open', pageKey: 'documents' }
  },
  {
    path: '/documents/:id',
    name: 'DocumentDetail',
    component: () => import('../views/DocumentDetailView.vue'),
    meta: { title: '문서 상세', icon: 'fa-file', pageKey: 'documents' }
  },
  {
    path: '/sap-lookup',
    name: 'SapLookup',
    component: () => import('../views/SapLookupView.vue'),
    meta: { title: 'SAP 조회', icon: 'fa-magnifying-glass', pageKey: 'sap-lookup' }
  },
  {
    path: '/certifications',
    name: 'Certifications',
    component: () => import('../views/CertificationsView.vue'),
    meta: { title: '인증서 관리', icon: 'fa-certificate', pageKey: 'certifications' }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('../views/admin/UserManagementView.vue'),
    meta: { title: '사용자 계정 관리', icon: 'fa-users-gear', adminOnly: true }
  },
  {
    path: '/admin/page-permissions',
    name: 'AdminPagePermissions',
    component: () => import('../views/admin/PagePermissionView.vue'),
    meta: { title: '페이지별 접근권한(ACL) 관리', icon: 'fa-user-lock', adminOnly: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 인증/인가 Navigation Guard
// 1) 로그인하지 않은 사용자는 /login 으로 리다이렉트(단, meta.public 라우트는 예외)
// 2) adminOnly 라우트는 ADMIN 역할만 접근 가능
// 3) pageKey가 있는 라우트는 authStore.canAccessPage(pageKey)로 페이지별 사용자ID 권한 체크
router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    // 이미 로그인한 사용자가 /login에 접근하면 대시보드로 보낸다
    if (to.name === 'Login' && authStore.isLoggedIn) {
      return '/dashboard'
    }
    return true
  }

  if (!authStore.isLoggedIn) {
    return { path: '/login', query: { next: to.fullPath } }
  }

  if (to.meta.adminOnly && !authStore.isAdmin) {
    return { path: '/dashboard' }
  }

  if (to.meta.pageKey && !authStore.canAccessPage(to.meta.pageKey)) {
    // 대시보드 자체 권한도 없는 극단적인 경우 무한 리다이렉트를 막기 위해 로그아웃 처리
    if (to.path === '/dashboard') {
      authStore.clear()
      return { path: '/login' }
    }
    return { path: '/dashboard' }
  }

  return true
})

export default router
