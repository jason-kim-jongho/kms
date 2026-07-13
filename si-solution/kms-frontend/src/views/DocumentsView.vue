<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { documentApi, docCategoryApi } from '../api/services'
import StatusBadge from '../components/StatusBadge.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const router = useRouter()
const loading = ref(true)
const error = ref(null)
const documents = ref([])
const categories = ref([])

const filters = ref({ categoryCode: '', partnerCode: '', keyword: '' })
const showCreateModal = ref(false)
const newDoc = ref({ title: '', categoryCode: '', docType: '', businessPartnerCode: '', businessPartnerName: '', fileNo: '', remark: '' })
const creating = ref(false)

async function loadCategories() {
  categories.value = await docCategoryApi.list()
}

async function loadDocs() {
  loading.value = true
  error.value = null
  try {
    const params = {}
    if (filters.value.categoryCode) params.categoryCode = filters.value.categoryCode
    if (filters.value.partnerCode) params.partnerCode = filters.value.partnerCode
    if (filters.value.keyword) params.keyword = filters.value.keyword
    documents.value = await documentApi.list(params)
  } catch (e) {
    error.value = e?.response?.data?.message || e.message
  } finally {
    loading.value = false
  }
}

function goDetail(id) {
  router.push(`/documents/${id}`)
}

async function submitCreate() {
  if (!newDoc.value.title || !newDoc.value.categoryCode) {
    alert('제목과 카테고리는 필수입니다.')
    return
  }
  creating.value = true
  try {
    const result = await documentApi.create(newDoc.value)
    showCreateModal.value = false
    newDoc.value = { title: '', categoryCode: '', docType: '', businessPartnerCode: '', businessPartnerName: '', fileNo: '', remark: '' }
    await loadDocs()
    if (result?.id) goDetail(result.id)
  } catch (e) {
    alert('생성 실패: ' + (e?.response?.data?.message || e.message))
  } finally {
    creating.value = false
  }
}

let debounceTimer = null
watch(filters, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadDocs, 300)
}, { deep: true })

onMounted(() => {
  loadCategories()
  loadDocs()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <select v-model="filters.categoryCode" class="border border-slate-200 rounded-lg px-3 py-2 text-sm">
        <option value="">전체 카테고리</option>
        <option v-for="c in categories" :key="c.categoryCode" :value="c.categoryCode">{{ c.categoryName }}</option>
      </select>
      <input v-model="filters.partnerCode" placeholder="거래처 코드" class="border border-slate-200 rounded-lg px-3 py-2 text-sm w-40" />
      <input v-model="filters.keyword" placeholder="제목/File No. 검색" class="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]" />
      <button @click="showCreateModal = true" class="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
        <i class="fas fa-plus mr-1"></i>새 문서 등록
      </button>
    </div>

    <LoadingSpinner v-if="loading" />
    <div v-else-if="error" class="p-6 bg-red-50 text-red-600 rounded-xl">{{ error }}</div>
    <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th class="text-left px-4 py-3">제목</th>
            <th class="text-left px-4 py-3">문서유형</th>
            <th class="text-left px-4 py-3">거래처</th>
            <th class="text-left px-4 py-3">File No.</th>
            <th class="text-center px-4 py-3">첨부</th>
            <th class="text-center px-4 py-3">SAP 연계</th>
            <th class="text-center px-4 py-3">상태</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="d in documents" :key="d.id" class="hover:bg-slate-50 cursor-pointer" @click="goDetail(d.id)">
            <td class="px-4 py-3">
              <span class="font-semibold text-slate-700">{{ d.title }}</span>
              <p class="text-[11px] text-slate-400 mt-0.5 font-mono">{{ d.storage_id }}</p>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ d.doc_type }}</td>
            <td class="px-4 py-3 text-slate-600">{{ d.business_partner_name || '-' }}</td>
            <td class="px-4 py-3 text-slate-500">{{ d.file_no || '-' }}</td>
            <td class="px-4 py-3 text-center text-slate-500">{{ d.file_count }}</td>
            <td class="px-4 py-3 text-center">
              <StatusBadge v-if="d.sap_link_status" :status="d.sap_link_status" :label-map="{ linked: '연계', missing: '미연계', pending_review: '검토대기' }" />
              <span v-else class="text-slate-300 text-xs">-</span>
            </td>
            <td class="px-4 py-3 text-center"><StatusBadge :status="d.status" /></td>
          </tr>
          <tr v-if="!documents.length">
            <td colspan="7" class="text-center py-10 text-slate-400">문서가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showCreateModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h3 class="font-bold text-lg text-slate-800 mb-4">새 문서 등록</h3>
        <div class="space-y-3">
          <input v-model="newDoc.title" placeholder="제목 *" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <select v-model="newDoc.categoryCode" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="">카테고리 선택 *</option>
            <option v-for="c in categories" :key="c.categoryCode" :value="c.categoryCode">{{ c.categoryName }}</option>
          </select>
          <input v-model="newDoc.docType" placeholder="문서유형 (예: 세금계산서(매입))" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <div class="grid grid-cols-2 gap-3">
            <input v-model="newDoc.businessPartnerCode" placeholder="거래처 코드" class="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <input v-model="newDoc.businessPartnerName" placeholder="거래처명" class="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <input v-model="newDoc.fileNo" placeholder="File No." class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <textarea v-model="newDoc.remark" placeholder="비고" rows="2" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button @click="showCreateModal = false" class="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">취소</button>
          <button @click="submitCreate" :disabled="creating" class="px-4 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {{ creating ? '등록 중...' : '등록' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
