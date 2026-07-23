<script setup>
import { ref, onMounted, computed } from 'vue'
import { devModuleApi } from '../api/services'
import StatusBadge from '../components/StatusBadge.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { fmtPct } from '../utils/format'

const loading = ref(true)
const error = ref(null)
const modules = ref([])
const filterRisk = ref('all')

const filtered = computed(() => {
  if (filterRisk.value === 'all') return modules.value
  return modules.value.filter(m => m.riskLevel === filterRisk.value)
})

async function load() {
  loading.value = true
  error.value = null
  try {
    modules.value = await devModuleApi.list()
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
  <div v-else class="space-y-4">
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="r in ['all', 'critical', 'high', 'medium', 'low']"
        :key="r"
        @click="filterRisk = r"
        class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
        :class="filterRisk === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
      >
        {{ r === 'all' ? '전체' : r.charAt(0).toUpperCase() + r.slice(1) }}
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="m in filtered" :key="m.id" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-bold text-slate-800">{{ m.name }}</h3>
          <StatusBadge :status="m.riskLevel" />
        </div>
        <p class="text-xs text-slate-400 mb-2">{{ m.moduleKey }} · {{ m.category }}</p>
        <p class="text-sm text-slate-500 mb-3">{{ m.description }}</p>
        <p v-if="m.riskNote" class="text-xs text-orange-600 bg-orange-50 rounded-lg p-2 mb-3">
          <i class="fas fa-triangle-exclamation mr-1"></i>{{ m.riskNote }}
        </p>
        <div class="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
          <div class="h-full rounded-full bg-indigo-500" :style="{ width: `${m.progress}%` }"></div>
        </div>
        <div class="flex items-center justify-between">
          <StatusBadge :status="m.status" />
          <div class="text-xs text-slate-500">
            <span>{{ m.owner || '-' }}</span>
            <span class="mx-1">·</span>
            <span>{{ fmtPct(m.progress) }}</span>
          </div>
        </div>
      </div>
      <p v-if="!filtered.length" class="text-sm text-slate-400 col-span-full text-center py-10">해당 조건의 모듈이 없습니다.</p>
    </div>
  </div>
</template>
