<script setup>
import { ref } from 'vue'
import { sapLookupApi } from '../api/services'

const table = ref('OINV')
const docNum = ref('')
const loading = ref(false)
const result = ref(null)
const error = ref(null)

const tables = [
  { value: 'OPCH', label: 'OPCH - 매입 세금계산서(AP Invoice)' },
  { value: 'OINV', label: 'OINV - 매출 세금계산서(AR Invoice)' },
  { value: 'OPOR', label: 'OPOR - 발주서(Purchase Order)' },
  { value: 'ORDR', label: 'ORDR - 수주서(Sales Order)' },
  { value: 'OPDN', label: 'OPDN - 입고증(Goods Receipt PO)' }
]

async function lookup() {
  if (!docNum.value) {
    alert('전표번호를 입력하세요.')
    return
  }
  loading.value = true
  error.value = null
  result.value = null
  try {
    result.value = await sapLookupApi.lookup(table.value, docNum.value)
  } catch (e) {
    error.value = e?.response?.data?.error || e?.response?.data?.message || e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 class="font-bold text-slate-800 mb-4">
        <i class="fas fa-magnifying-glass mr-2 text-blue-600"></i>SAP B1 Service Layer 조회 (Mock)
      </h3>
      <p class="text-xs text-slate-400 mb-4">
        ※ 운영 환경에서는 이 조회가 실제 SAP Business One Service Layer(로그인 → 쿠키 인증 → 엔티티 GET)로 대체됩니다.
      </p>
      <div class="flex flex-wrap gap-3">
        <select v-model="table" class="border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option v-for="t in tables" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <input v-model="docNum" placeholder="전표번호 (DocNum)" class="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[150px]" @keyup.enter="lookup" />
        <button @click="lookup" :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {{ loading ? '조회 중...' : '조회' }}
        </button>
      </div>
    </section>

    <section v-if="error" class="bg-red-50 text-red-600 rounded-2xl p-6 text-sm">{{ error }}</section>

    <section v-if="result" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">{{ result.source }}</span>
      </div>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-slate-100">
          <tr v-for="(v, k) in result" :key="k" v-show="k !== 'source'">
            <td class="py-2 pr-4 text-slate-400 font-mono text-xs w-1/3">{{ k }}</td>
            <td class="py-2 font-medium text-slate-700">{{ v }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
