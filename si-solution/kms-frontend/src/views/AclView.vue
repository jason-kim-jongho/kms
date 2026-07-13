<script setup>
import { ref, onMounted } from 'vue'
import { aclApi } from '../api/services'
import StatusBadge from '../components/StatusBadge.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const loading = ref(true)
const error = ref(null)
const acls = ref([])

function permIcon(v) {
  return v
    ? '<i class="fas fa-check text-green-600"></i>'
    : '<i class="fas fa-xmark text-slate-300"></i>'
}

async function load() {
  loading.value = true
  error.value = null
  try {
    acls.value = await aclApi.list()
  } catch (e) {
    error.value = e?.response?.data?.message || e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <LoadingSpinner v-if="loading" />
  <div v-else-if="error" class="p-6 bg-red-50 text-red-600 rounded-xl">{{ error }}</div>
  <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
        <tr>
          <th class="text-left px-4 py-3">그룹/역할</th>
          <th class="text-left px-4 py-3">문서유형</th>
          <th class="text-center px-4 py-3">읽기</th>
          <th class="text-center px-4 py-3">쓰기</th>
          <th class="text-center px-4 py-3">삭제</th>
          <th class="text-center px-4 py-3">공유</th>
          <th class="text-left px-4 py-3">범위</th>
          <th class="text-center px-4 py-3">상태</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-for="a in acls" :key="a.id" class="hover:bg-slate-50">
          <td class="px-4 py-3">
            <span class="font-semibold text-slate-700">{{ a.groupName }}</span>
            <p class="text-[11px] text-slate-400 mt-0.5">{{ a.roleName }}</p>
          </td>
          <td class="px-4 py-3 text-slate-600">{{ a.docType }}</td>
          <td class="px-4 py-3 text-center"><i :class="a.permissionRead ? 'fas fa-check text-green-600' : 'fas fa-xmark text-slate-300'"></i></td>
          <td class="px-4 py-3 text-center"><i :class="a.permissionWrite ? 'fas fa-check text-green-600' : 'fas fa-xmark text-slate-300'"></i></td>
          <td class="px-4 py-3 text-center"><i :class="a.permissionDelete ? 'fas fa-check text-green-600' : 'fas fa-xmark text-slate-300'"></i></td>
          <td class="px-4 py-3 text-center"><i :class="a.permissionShare ? 'fas fa-check text-green-600' : 'fas fa-xmark text-slate-300'"></i></td>
          <td class="px-4 py-3 text-[11px] text-slate-500">{{ a.scopeNote || '-' }}</td>
          <td class="px-4 py-3 text-center"><StatusBadge :status="a.status" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
