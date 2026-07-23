<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { documentApi } from '../api/services'
import StatusBadge from '../components/StatusBadge.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { fmtBytes } from '../utils/format'

const route = useRoute()
const router = useRouter()
const docId = route.params.id

const loading = ref(true)
const error = ref(null)
const detail = ref(null)
const uploading = ref(false)
const fileInput = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await documentApi.get(docId)
  } catch (e) {
    error.value = e?.response?.data?.message || e.message
  } finally {
    loading.value = false
  }
}

function triggerUpload() {
  fileInput.value?.click()
}

async function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    await documentApi.uploadFile(docId, formData)
    await load()
  } catch (err) {
    alert('업로드 실패: ' + (err?.response?.data?.message || err.message))
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

function downloadFile(fileId) {
  const url = documentApi.downloadFileUrl(docId, fileId)
  window.open(url, '_blank')
}

async function removeFile(fileId) {
  if (!confirm('이 파일을 삭제하시겠습니까?')) return
  try {
    await documentApi.deleteFile(docId, fileId)
    await load()
  } catch (err) {
    alert('삭제 실패: ' + (err?.response?.data?.message || err.message))
  }
}

onMounted(load)
</script>

<template>
  <div>
    <button @click="router.push('/documents')" class="text-sm text-slate-500 hover:text-slate-700 mb-4">
      <i class="fas fa-arrow-left mr-1"></i>목록으로
    </button>

    <LoadingSpinner v-if="loading" />
    <div v-else-if="error" class="p-6 bg-red-50 text-red-600 rounded-xl">{{ error }}</div>
    <div v-else-if="detail" class="space-y-6">
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
          <div class="min-w-0">
            <h2 class="text-xl font-bold text-slate-800 break-words">{{ detail.document.title }}</h2>
            <p class="text-xs text-slate-400 font-mono mt-1 break-all">{{ detail.document.storageId }}</p>
          </div>
          <StatusBadge :status="detail.document.status" />
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p class="text-xs text-slate-400">문서유형</p>
            <p class="text-slate-700 font-medium mt-0.5">{{ detail.document.docType || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">거래처</p>
            <p class="text-slate-700 font-medium mt-0.5">{{ detail.document.businessPartnerName || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">File No.</p>
            <p class="text-slate-700 font-medium mt-0.5">{{ detail.document.fileNo || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">등록자</p>
            <p class="text-slate-700 font-medium mt-0.5">{{ detail.document.postUserName || '-' }}</p>
          </div>
        </div>
        <p v-if="detail.document.remark" class="text-sm text-slate-500 mt-4 bg-slate-50 rounded-lg p-3">{{ detail.document.remark }}</p>
      </section>

      <!-- Files -->
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 class="font-bold text-slate-800"><i class="fas fa-paperclip mr-2 text-blue-600"></i>첨부파일 ({{ detail.files.length }})</h3>
          <button @click="triggerUpload" :disabled="uploading" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 self-start sm:self-auto">
            <i class="fas fa-upload mr-1"></i>{{ uploading ? '업로드 중...' : '파일 업로드' }}
          </button>
          <input ref="fileInput" type="file" class="hidden" @change="onFileSelected" />
        </div>
        <div v-if="detail.files.length" class="space-y-2">
          <div v-for="f in detail.files" :key="f.id" class="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50">
            <div class="flex items-center gap-3 min-w-0">
              <i class="fas fa-file text-slate-400 shrink-0"></i>
              <div class="min-w-0">
                <span class="text-sm font-medium text-slate-700 break-all">{{ f.originalFileName }}</span>
                <p class="text-[11px] text-slate-400 mt-0.5">{{ f.fileType }} · {{ fmtBytes(f.fileSize) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button @click="downloadFile(f.id)" class="text-blue-600 hover:text-blue-700 text-sm px-2 py-1">
                <i class="fas fa-download"></i>
              </button>
              <button @click="removeFile(f.id)" class="text-red-500 hover:text-red-600 text-sm px-2 py-1">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-400">첨부된 파일이 없습니다.</p>
      </section>

      <!-- SAP Links -->
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <h3 class="font-bold text-slate-800 mb-4"><i class="fas fa-link mr-2 text-purple-600"></i>SAP 전표 연계</h3>
        <div v-if="detail.sap_links.length" class="space-y-2">
          <div v-for="l in detail.sap_links" :key="l.id" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50">
            <div class="min-w-0">
              <span class="font-mono text-sm font-semibold text-slate-700">{{ l.sapTable }} #{{ l.sapDocNum }}</span>
              <p class="text-[11px] text-slate-400 mt-0.5">거래처 {{ l.sapCardCode || '-' }} · 연계자 {{ l.linkedBy || '-' }}</p>
            </div>
            <StatusBadge :status="l.linkStatus" :label-map="{ linked: '연계완료', missing: '미연계', pending_review: '검토대기' }" />
          </div>
        </div>
        <p v-else class="text-sm text-slate-400">연계된 SAP 전표가 없습니다.</p>
      </section>

      <!-- Certifications -->
      <section v-if="detail.certifications.length" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <h3 class="font-bold text-slate-800 mb-4"><i class="fas fa-certificate mr-2 text-orange-600"></i>연결된 인증서</h3>
        <div class="space-y-2">
          <div v-for="c in detail.certifications" :key="c.id" class="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50">
            <div class="min-w-0">
              <span class="text-sm font-semibold text-slate-700">{{ c.certType }}</span>
              <p class="text-[11px] text-slate-400 mt-0.5">만료일 {{ c.expiryDate }}</p>
            </div>
            <StatusBadge :status="c.status" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
