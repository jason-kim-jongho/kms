<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const sidebarOpen = ref(true)

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
    title: '문서관리(DMS)',
    items: [
      { path: '/documents', label: '문서 목록', icon: 'fa-folder-open' },
      { path: '/sap-lookup', label: 'SAP 조회', icon: 'fa-magnifying-glass' },
      { path: '/certifications', label: '인증서 관리', icon: 'fa-certificate' }
    ]
  }
]
</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside
      class="bg-slate-900 text-slate-200 transition-all duration-200 flex flex-col"
      :class="sidebarOpen ? 'w-64' : 'w-16'"
    >
      <div class="flex items-center justify-between px-4 h-16 border-b border-slate-700">
        <div class="flex items-center gap-2 overflow-hidden">
          <i class="fas fa-cube text-blue-400 text-xl shrink-0"></i>
          <span v-if="sidebarOpen" class="font-bold text-white whitespace-nowrap">KMS SI Solution</span>
        </div>
        <button @click="sidebarOpen = !sidebarOpen" class="text-slate-400 hover:text-white shrink-0">
          <i class="fas fa-bars"></i>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto py-4">
        <div v-for="group in navGroups" :key="group.title" class="mb-4">
          <p v-if="sidebarOpen" class="px-4 text-xs font-semibold text-slate-500 uppercase mb-2">{{ group.title }}</p>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors"
            :class="route.path === item.path || route.path.startsWith(item.path + '/')
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
          >
            <i :class="['fas', item.icon, 'w-4 text-center shrink-0']"></i>
            <span v-if="sidebarOpen" class="whitespace-nowrap">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <div class="px-4 py-3 border-t border-slate-700 text-xs text-slate-500" v-if="sidebarOpen">
        Spring Boot + PostgreSQL + Vue.js<br />On-Premise SI Edition
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-white border-b flex items-center px-6 shadow-sm">
        <h1 class="text-lg font-semibold text-gray-800">
          <i :class="['fas', $route.meta.icon, 'text-blue-600 mr-2']"></i>
          {{ $route.meta.title || 'KMS' }}
        </h1>
      </header>

      <main class="flex-1 overflow-y-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
