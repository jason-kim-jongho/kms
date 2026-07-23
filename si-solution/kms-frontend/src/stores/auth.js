import { defineStore } from 'pinia'
import { authApi } from '../api/services'

const STORAGE_KEY = 'miraejigi_auth'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToStorage(state) {
  if (state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const saved = loadFromStorage()
    return {
      token: saved?.token || null,
      username: saved?.username || null,
      displayName: saved?.displayName || null,
      role: saved?.role || null,
      pages: saved?.pages || []
    }
  },

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.role === 'ADMIN',
    // ADMIN은 전체 페이지 접근, USER는 pages 화이트리스트 기준
    canAccessPage: (state) => (pageKey) => {
      if (!pageKey) return true
      if (state.role === 'ADMIN') return true
      return state.pages.includes(pageKey)
    }
  },

  actions: {
    async login(username, password) {
      const data = await authApi.login({ username, password })
      this.token = data.token
      this.username = data.username
      this.displayName = data.displayName
      this.role = data.role
      this.pages = data.pages || []
      saveToStorage({
        token: this.token,
        username: this.username,
        displayName: this.displayName,
        role: this.role,
        pages: this.pages
      })
      return data
    },

    async logout() {
      try {
        if (this.token) await authApi.logout()
      } catch {
        // 로그아웃 API 실패해도 로컬 상태는 정리한다
      }
      this.clear()
    },

    clear() {
      this.token = null
      this.username = null
      this.displayName = null
      this.role = null
      this.pages = []
      saveToStorage(null)
    },

    async refreshMe() {
      const data = await authApi.me()
      this.username = data.username
      this.displayName = data.displayName
      this.role = data.role
      this.pages = data.pages || []
      saveToStorage({
        token: this.token,
        username: this.username,
        displayName: this.displayName,
        role: this.role,
        pages: this.pages
      })
      return data
    }
  }
})
