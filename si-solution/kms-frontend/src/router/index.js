import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { title: '통합 대시보드', icon: 'fa-gauge-high' }
  },
  {
    path: '/roadmap',
    name: 'Roadmap',
    component: () => import('../views/RoadmapView.vue'),
    meta: { title: '3개월 로드맵', icon: 'fa-map' }
  },
  {
    path: '/dev-modules',
    name: 'DevModules',
    component: () => import('../views/DevModulesView.vue'),
    meta: { title: '개발모듈 백로그', icon: 'fa-list-check' }
  },
  {
    path: '/mapping',
    name: 'Mapping',
    component: () => import('../views/MappingView.vue'),
    meta: { title: 'SAP-KMS 매핑', icon: 'fa-link' }
  },
  {
    path: '/acl',
    name: 'Acl',
    component: () => import('../views/AclView.vue'),
    meta: { title: '권한(ACL) 설계', icon: 'fa-shield-halved' }
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('../views/DocumentsView.vue'),
    meta: { title: '문서관리', icon: 'fa-folder-open' }
  },
  {
    path: '/documents/:id',
    name: 'DocumentDetail',
    component: () => import('../views/DocumentDetailView.vue'),
    meta: { title: '문서 상세', icon: 'fa-file' }
  },
  {
    path: '/sap-lookup',
    name: 'SapLookup',
    component: () => import('../views/SapLookupView.vue'),
    meta: { title: 'SAP 조회', icon: 'fa-magnifying-glass' }
  },
  {
    path: '/certifications',
    name: 'Certifications',
    component: () => import('../views/CertificationsView.vue'),
    meta: { title: '인증서 관리', icon: 'fa-certificate' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
