<script setup>
import { ref, onMounted } from 'vue'
import { userApi } from '../../api/services'

const users = ref([])
const loading = ref(true)
const error = ref(null)

const showForm = ref(false)
const editingId = ref(null)
const form = ref({ username: '', password: '', displayName: '', email: '', role: 'USER', isActive: true })
const saving = ref(false)
const formError = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    users.value = await userApi.list()
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || '사용자 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { username: '', password: '', displayName: '', email: '', role: 'USER', isActive: true }
  formError.value = null
  showForm.value = true
}

function openEdit(u) {
  editingId.value = u.id
  form.value = { username: u.username, password: '', displayName: u.displayName, email: u.email || '', role: u.role, isActive: u.isActive }
  formError.value = null
  showForm.value = true
}

async function submitForm() {
  formError.value = null
  if (!form.value.username || (!editingId.value && !form.value.password)) {
    formError.value = '아이디와 비밀번호는 필수입니다.'
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await userApi.update(editingId.value, form.value)
    } else {
      await userApi.create(form.value)
    }
    showForm.value = false
    await load()
  } catch (e) {
    formError.value = e?.response?.data?.message || e.message || '저장에 실패했습니다.'
  } finally {
    saving.value = false
  }
}

async function removeUser(u) {
  if (!confirm(`'${u.username}' 사용자를 삭제하시겠습니까?`)) return
  try {
    await userApi.remove(u.id)
    await load()
  } catch (e) {
    alert(e?.response?.data?.message || e.message || '삭제에 실패했습니다.')
  }
}

onMounted(load)
</script>

<template>
  <div id="user-management-view" class="max-w-5xl mx-auto space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">사용자 계정 관리</h2>
        <p class="text-sm text-slate-500">시스템에 로그인할 수 있는 사용자 계정을 생성/수정/삭제합니다.</p>
      </div>
      <button id="user-create-btn" @click="openCreate" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg shrink-0">
        <i class="fas fa-plus mr-1.5"></i>사용자 추가
      </button>
    </div>

    <div v-if="loading" class="text-center py-10 text-slate-400"><i class="fas fa-spinner fa-spin mr-2"></i>로딩 중...</div>
    <div v-else-if="error" class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{{ error }}</div>

    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <table class="w-full text-sm min-w-[640px]">
        <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-2.5 text-left">아이디</th>
            <th class="px-4 py-2.5 text-left">이름</th>
            <th class="px-4 py-2.5 text-left">이메일</th>
            <th class="px-4 py-2.5 text-left">역할</th>
            <th class="px-4 py-2.5 text-left">상태</th>
            <th class="px-4 py-2.5 text-right">관리</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="u in users" :key="u.id" class="hover:bg-slate-50">
            <td class="px-4 py-2.5 font-medium text-slate-700">{{ u.username }}</td>
            <td class="px-4 py-2.5">{{ u.displayName }}</td>
            <td class="px-4 py-2.5 text-slate-500">{{ u.email || '-' }}</td>
            <td class="px-4 py-2.5">
              <span :class="u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'" class="px-2 py-0.5 rounded-full text-xs font-medium">
                {{ u.role === 'ADMIN' ? '관리자' : '일반 사용자' }}
              </span>
            </td>
            <td class="px-4 py-2.5">
              <span :class="u.isActive ? 'text-emerald-600' : 'text-slate-400'" class="text-xs font-medium">
                <i :class="u.isActive ? 'fa-circle-check' : 'fa-circle-xmark'" class="fas mr-1"></i>{{ u.isActive ? '활성' : '비활성' }}
              </span>
            </td>
            <td class="px-4 py-2.5 text-right whitespace-nowrap">
              <button @click="openEdit(u)" class="text-blue-600 hover:underline text-xs mr-3">수정</button>
              <button @click="removeUser(u)" class="text-red-500 hover:underline text-xs">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 생성/수정 모달 -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showForm = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 class="text-base font-semibold text-slate-800">{{ editingId ? '사용자 수정' : '사용자 추가' }}</h3>
        <div v-if="formError" class="bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2">{{ formError }}</div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">아이디</label>
            <input v-model="form.username" :disabled="!!editingId" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">비밀번호 {{ editingId ? '(변경 시에만 입력)' : '' }}</label>
            <input v-model="form.password" type="password" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">이름</label>
            <input v-model="form.displayName" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">이메일</label>
            <input v-model="form.email" type="email" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-xs font-medium text-slate-600 mb-1">역할</label>
              <select v-model="form.role" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="USER">일반 사용자</option>
                <option value="ADMIN">관리자</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="block text-xs font-medium text-slate-600 mb-1">상태</label>
              <select v-model="form.isActive" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option :value="true">활성</option>
                <option :value="false">비활성</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button @click="showForm = false" class="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">취소</button>
          <button @click="submitForm" :disabled="saving" class="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300">
            {{ saving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
