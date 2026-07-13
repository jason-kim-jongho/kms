<script setup>
import { ref, onMounted } from 'vue'
import { milestoneApi, taskApi } from '../api/services'
import StatusBadge from '../components/StatusBadge.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { fmtPct } from '../utils/format'

const loading = ref(true)
const error = ref(null)
const milestones = ref([])
const tasksByMilestone = ref({})
const expanded = ref({})

async function load() {
  loading.value = true
  error.value = null
  try {
    milestones.value = await milestoneApi.list()
    for (const m of milestones.value) {
      const detail = await milestoneApi.get(m.id)
      tasksByMilestone.value[m.id] = detail.tasks || []
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e.message
  } finally {
    loading.value = false
  }
}

function toggle(id) {
  expanded.value[id] = !expanded.value[id]
}

onMounted(load)
</script>

<template>
  <LoadingSpinner v-if="loading" />
  <div v-else-if="error" class="p-6 bg-red-50 text-red-600 rounded-xl">{{ error }}</div>
  <div v-else class="space-y-6">
    <div v-for="m in milestones" :key="m.id" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="p-5 cursor-pointer" @click="toggle(m.id)">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">{{ m.monthNo }}</span>
            <div>
              <h3 class="font-bold text-slate-800">{{ m.title }}</h3>
              <p class="text-xs text-slate-400 mt-0.5">{{ m.startDate }} ~ {{ m.endDate }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <StatusBadge :status="m.status" />
            <span class="text-sm font-bold text-slate-600">{{ fmtPct(m.progress) }}</span>
            <i :class="['fas', expanded[m.id] ? 'fa-chevron-up' : 'fa-chevron-down', 'text-slate-400']"></i>
          </div>
        </div>
        <p class="text-sm text-slate-500 mt-3">{{ m.description }}</p>
        <div class="h-2 rounded-full bg-slate-100 overflow-hidden mt-3">
          <div class="h-full rounded-full bg-blue-500" :style="{ width: `${m.progress}%` }"></div>
        </div>
      </div>

      <div v-if="expanded[m.id]" class="border-t border-slate-100 bg-slate-50 p-5">
        <h4 class="text-xs font-semibold text-slate-500 uppercase mb-3">태스크 목록 ({{ (tasksByMilestone[m.id] || []).length }}건)</h4>
        <div class="space-y-2">
          <div v-for="t in tasksByMilestone[m.id]" :key="t.id" class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
            <div class="flex-1">
              <span class="text-sm font-medium text-slate-700">{{ t.title }}</span>
              <p class="text-xs text-slate-400 mt-0.5">{{ t.owner || '-' }} · 마감 {{ t.dueDate || '-' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <StatusBadge :status="t.priority" :label-map="{ high: '높음', medium: '보통', low: '낮음' }" />
              <StatusBadge :status="t.status" />
              <span class="text-xs font-bold text-slate-500 w-10 text-right">{{ fmtPct(t.progress) }}</span>
            </div>
          </div>
          <p v-if="!(tasksByMilestone[m.id] || []).length" class="text-sm text-slate-400">태스크 없음</p>
        </div>
      </div>
    </div>
  </div>
</template>
