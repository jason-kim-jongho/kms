<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { certificationApi } from '../api/services'
import StatusBadge from '../components/StatusBadge.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const loading = ref(true)
const error = ref(null)
const certs = ref([])
const partnerCode = ref('')

const showModal = ref(false)
const creating = ref(false)
const newCert = ref({ certType: '', businessPartnerCode: '', businessPartnerName: '', issueDate: '', expiryDate: '', remark: '' })

function daysUntil(dateStr) {
  return dayjs(dateStr).diff(dayjs(), 'day')
}

async function load() {
  loading.value = true
  error.value = null
  try {
    certs.value = await certificationApi.list(partnerCode.value || undefined)
  } catch (e) {
    error.value = e?.response?.data?.message || e.message
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  if (!newCert.value.certType || !newCert.value.expiryDate) {
    alert('인증서 종류와 만료일은 필수입니다.')
    return
  }
  creating.value = true
  try {
    await certificationApi.create(newCert.value)
    showModal.value = false
    newCert.value = { certType: '', businessPartnerCode: '', businessPartnerName: '', issueDate: '', expiryDate: '', remark: '' }
    await load()
  } catch (e) {
    alert('등록 실패: ' + (e?.response?.data?.message || e.message))
  } finally {
    creating.value = false
  }
}

async function revoke(id) {
  if (!confirm('이 인증서를 폐기(revoke) 처리하시겠습니까?')) return
  try {
    await certificationApi.remove(id)
    await load()
  } catch (e) {
    alert('처리 실패: ' + (e?.response?.data?.message || e.message))
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <input v-model="partnerCode" placeholder="거래처 코드로 필터" class="border border-slate-200 rounded-lg px-3 py-2 text-sm w-48" @keyup.enter="load" />
      <button @click="load" class="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">필터</button>
      <button @click="showModal = true" class="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
        <i class="fas fa-plus mr-1"></i>인증서 등록
      </button>
    </div>

    <LoadingSpinner v-if="loading" />
    <div v-else-if="error" class="p-6 bg-red-50 text-red-600 rounded-xl">{{ error }}</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="c in certs" :key="c.id" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-bold text-slate-800">{{ c.certType }}</h3>
          <StatusBadge :status="c.status" />
        </div>
        <p class="text-sm text-slate-600">{{ c.businessPartnerName || '-' }}</p>
        <p class="text-xs text-slate-400 mt-1">발급 {{ c.issueDate }} ~ 만료 {{ c.expiryDate }}</p>
        <p v-if="c.remark" class="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2">{{ c.remark }}</p>
        <div class="flex items-center justify-between mt-3">
          <span :class="['text-xs font-bold', daysUntil(c.expiryDate) <= 0 ? 'text-red-600' : daysUntil(c.expiryDate) <= 90 ? 'text-orange-600' : 'text-slate-400']">
            {{ daysUntil(c.expiryDate) <= 0 ? '만료됨' : `D-${daysUntil(c.expiryDate)}` }}
          </span>
          <button v-if="c.status === 'active'" @click="revoke(c.id)" class="text-xs text-red-500 hover:text-red-600">
            <i class="fas fa-ban mr-1"></i>폐기
          </button>
        </div>
      </div>
      <p v-if="!certs.length" class="text-sm text-slate-400 col-span-full text-center py-10">등록된 인증서가 없습니다.</p>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h3 class="font-bold text-lg text-slate-800 mb-4">인증서 등록</h3>
        <div class="space-y-3">
          <input v-model="newCert.certType" placeholder="인증서 종류 (예: ISO9001) *" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <div class="grid grid-cols-2 gap-3">
            <input v-model="newCert.businessPartnerCode" placeholder="거래처 코드" class="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input v-model="newCert.businessPartnerName" placeholder="거래처명" class="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-400">발급일</label>
              <input v-model="newCert.issueDate" type="date" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="text-xs text-slate-400">만료일 *</label>
              <input v-model="newCert.expiryDate" type="date" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <textarea v-model="newCert.remark" placeholder="비고" rows="2" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button @click="showModal = false" class="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">취소</button>
          <button @click="submitCreate" :disabled="creating" class="px-4 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {{ creating ? '등록 중...' : '등록' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
