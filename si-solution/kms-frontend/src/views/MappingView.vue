<script setup>
import { ref, onMounted } from 'vue'
import { mappingApi } from '../api/services'
import StatusBadge from '../components/StatusBadge.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const loading = ref(true)
const error = ref(null)
const mappings = ref([])

async function load() {
  loading.value = true
  error.value = null
  try {
    mappings.value = await mappingApi.list()
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
  <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
    <table class="w-full text-sm min-w-[720px]">
      <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
        <tr>
          <th class="text-left px-4 py-3">SAP 테이블/필드</th>
          <th class="text-left px-4 py-3">KMS 메타데이터</th>
          <th class="text-left px-4 py-3">문서유형</th>
          <th class="text-left px-4 py-3">UNC 경로 패턴</th>
          <th class="text-center px-4 py-3">필수</th>
          <th class="text-center px-4 py-3">상태</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-for="m in mappings" :key="m.id" class="hover:bg-slate-50">
          <td class="px-4 py-3">
            <span class="font-mono text-xs font-semibold text-slate-700">{{ m.sapTable }}.{{ m.sapField }}</span>
            <p class="text-[11px] text-slate-400 mt-0.5">{{ m.sapFieldDesc }}</p>
          </td>
          <td class="px-4 py-3">
            <span class="font-semibold text-slate-700">{{ m.teedyMetadataName }}</span>
            <p class="text-[11px] text-slate-400 mt-0.5">{{ m.teedyMetadataType }}</p>
          </td>
          <td class="px-4 py-3 text-slate-600">{{ m.docType }}</td>
          <td class="px-4 py-3 font-mono text-[11px] text-slate-500">{{ m.uncPathPattern || '-' }}</td>
          <td class="px-4 py-3 text-center">
            <i v-if="m.isRequired" class="fas fa-check text-green-600"></i>
            <i v-else class="fas fa-minus text-slate-300"></i>
          </td>
          <td class="px-4 py-3 text-center"><StatusBadge :status="m.mappingStatus" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
