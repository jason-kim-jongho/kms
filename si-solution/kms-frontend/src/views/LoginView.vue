<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import logoColor from '../assets/logo-color.png'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

async function onSubmit() {
  if (!username.value || !password.value) {
    error.value = '아이디와 비밀번호를 입력해 주세요.'
    return
  }
  loading.value = true
  error.value = null
  try {
    await authStore.login(username.value.trim(), password.value)
    const next = typeof route.query.next === 'string' ? route.query.next : '/dashboard'
    router.replace(next || '/dashboard')
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

function fillDemo(id, pw) {
  username.value = id
  password.value = pw
}
</script>

<template>
  <div id="login-page" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <!-- 로고 헤더 -->
        <div class="px-8 pt-10 pb-6 flex flex-col items-center">
          <img :src="logoColor" alt="미래지기 PMS" class="h-16 w-auto object-contain mb-3" />
          <p class="text-sm text-slate-500">SI 프로젝트 관리 · 문서관리 통합 플랫폼</p>
        </div>

        <form id="login-form" @submit.prevent="onSubmit" class="px-8 pb-8 space-y-4">
          <div v-if="error" id="login-error" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5 flex items-center gap-2">
            <i class="fas fa-circle-exclamation shrink-0"></i>
            <span>{{ error }}</span>
          </div>

          <div>
            <label for="login-username" class="block text-sm font-medium text-slate-700 mb-1.5">아이디</label>
            <div class="relative">
              <i class="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                id="login-username"
                v-model="username"
                type="text"
                autocomplete="username"
                placeholder="아이디를 입력하세요"
                class="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label for="login-password" class="block text-sm font-medium text-slate-700 mb-1.5">비밀번호</label>
            <div class="relative">
              <i class="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                id="login-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="비밀번호를 입력하세요"
                class="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <span>{{ loading ? '로그인 중...' : '로그인' }}</span>
          </button>

          <!-- 데모 계정 안내 -->
          <div class="pt-3 border-t border-slate-100">
            <p class="text-xs text-slate-400 mb-2">데모 계정으로 빠르게 체험해 보세요</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" @click="fillDemo('admin', 'admin123!')" class="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                <i class="fas fa-shield-halved mr-1 text-blue-500"></i>admin (전체권한)
              </button>
              <button type="button" @click="fillDemo('manager', 'manager123!')" class="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                <i class="fas fa-user-tie mr-1 text-emerald-500"></i>manager
              </button>
              <button type="button" @click="fillDemo('viewer', 'viewer123!')" class="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                <i class="fas fa-eye mr-1 text-slate-400"></i>viewer
              </button>
            </div>
          </div>
        </form>
      </div>

      <p class="text-center text-slate-400 text-xs mt-6">
        © 2026 미래지기 PMS · Spring Boot + PostgreSQL + Vue.js On-Premise SI Edition
      </p>
    </div>
  </div>
</template>
