<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// 데스크탑에서 사이드바 접기/펼치기
const sidebarCollapsed = ref(false)
// 모바일에서 사이드바(드로어) 열림 여부
const mobileMenuOpen = ref(false)

const navGroups = [
  {
    title: '프로젝트 관리',
    items: [
      { path: '/dashboard', label: '통합 대시보드', icon: 'fa-gauge-high' },
      { path: '/roadmap', label: '3개월 로드맵', icon: 'fa-map' },
      { path: '/dev-modules', label: '개발모듈 백로그', icon: 'fa-list-check' },
      { path: '/mapping', label: 'SAP-KMS 매핑', icon: 'fa-link' },
      { path: '/acl', label: '권한(ACL) 설계', icon: 'fa-shield-halved' }
    ]
  },
  {
    title: 'PMS (다중 뷰)',
    items: [
      { path: '/pms/projects', label: 'projects', icon: 'fa-diagram-project' },
      { path: '/pms/milestones', label: 'milestones', icon: 'fa-flag-checkered' },
      { path: '/pms/tasks', label: 'tasks', icon: 'fa-list-check' },
      { path: '/pms/dev_modules', label: 'dev_modules', icon: 'fa-cubes' },
      { path: '/pms/sap_teedy_mapping', label: 'sap_teedy_mapping', icon: 'fa-link' },
      { path: '/pms/acl_design', label: 'acl_design', icon: 'fa-shield-halved' },
      { path: '/pms/risks', label: 'risks', icon: 'fa-triangle-exclamation' },
      { path: '/pms/case_studies', label: 'case_studies', icon: 'fa-book-open' }
    ]
  },
  {
    title: '문서관리(DMS)',
    items: [
      { path: '/documents', label: '문서 목록', icon: 'fa-folder-open' },
      { path: '/sap-lookup', label: 'SAP 조회', icon: 'fa-magnifying-glass' },
      { path: '/certifications', label: '인증서 관리', icon: 'fa-certificate' }
    ]
  }
]

// 라우트 이동 시 모바일 드로어는 자동으로 닫는다
function onNavClick() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- 모바일 전용 배경 오버레이 (사이드바 드로어 열렸을 때만) -->
    <div
      v-if="mobileMenuOpen"
      @click="mobileMenuOpen = false"
      class="fixed inset-0 bg-black/50 z-30 md:hidden"
    ></div>

    <!-- Sidebar: 모바일=드로어(overlay), 데스크탑=고정(접기/펼치기) -->
    <aside
      class="bg-slate-900 text-slate-200 flex flex-col fixed md:static inset-y-0 left-0 z-40 w-72 transition-transform duration-200 md:transition-all"
      :class="[
        sidebarCollapsed ? 'md:w-16' : 'md:w-64',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <div class="flex items-center justify-between px-4 h-16 border-b border-slate-700 shrink-0">
        <div class="flex items-center gap-2 overflow-hidden min-w-0">
          <i class="fas fa-cube text-blue-400 text-xl shrink-0"></i>
          <span v-if="!sidebarCollapsed" class="font-bold text-white whitespace-nowrap truncate">KMS SI Solution</span>
        </div>
        <!-- 데스크탑: 접기/펼치기 버튼 -->
        <button @click="sidebarCollapsed = !sidebarCollapsed" class="hidden md:inline-flex text-slate-400 hover:text-white shrink-0">
          <i class="fas fa-bars"></i>
        </button>
        <!-- 모바일: 드로어 닫기 버튼 -->
        <button @click="mobileMenuOpen = false" class="md:hidden text-slate-400 hover:text-white shrink-0 text-lg">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto py-4">
        <div v-for="group in navGroups" :key="group.title" class="mb-4">
          <p v-if="!sidebarCollapsed" class="px-4 text-xs font-semibold text-slate-500 uppercase mb-2 truncate">{{ group.title }}</p>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            @click="onNavClick"
            class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors"
            :class="route.path === item.path || route.path.startsWith(item.path + '/')
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
          >
            <i :class="['fas', item.icon, 'w-4 text-center shrink-0']"></i>
            <span v-if="!sidebarCollapsed" class="whitespace-nowrap truncate">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <div v-if="!sidebarCollapsed" class="px-4 py-3 border-t border-slate-700 text-xs text-slate-500">
        Spring Boot + PostgreSQL + Vue.js<br />On-Premise SI Edition
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-14 sm:h-16 bg-white border-b flex items-center gap-2 sm:gap-3 px-3 sm:px-6 shadow-sm shrink-0">
        <!-- 모바일: 사이드바(드로어) 열기 버튼 -->
        <button @click="mobileMenuOpen = true" class="md:hidden text-slate-500 hover:text-slate-700 text-lg shrink-0 -ml-1 px-1">
          <i class="fas fa-bars"></i>
        </button>
        <h1 class="text-base sm:text-lg font-semibold text-gray-800 truncate min-w-0 flex-1">
          <i :class="['fas', $route.meta.icon, 'text-blue-600 mr-1.5 sm:mr-2']"></i>
          <span class="truncate">{{ $route.meta.title || 'KMS' }}</span>
        </h1>
      </header>

      <main class="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
