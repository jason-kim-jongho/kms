<script setup>
import { ref, onMounted, nextTick } from 'vue'
import dayjs from 'dayjs'
import { dashboardApi } from '../api/services'
import KpiCard from '../components/KpiCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { fmtPct, fmtBytes } from '../utils/format'
import ChartJS from '../utils/chart-setup'

const loading = ref(true)
const error = ref(null)
const data = ref(null)

let mappingChart = null
let aclChart = null
let moduleChart = null

const mappingCanvas = ref(null)
const aclCanvas = ref(null)
const moduleCanvas = ref(null)

function daysUntil(dateStr) {
  return dayjs(dateStr).diff(dayjs(), 'day')
}

function renderCharts() {
  const { mapping, acl, risk } = data.value

  if (mappingChart) mappingChart.destroy()
  if (mappingCanvas.value) {
    const byDocType = mapping.by_doc_type || []
    mappingChart = new ChartJS(mappingCanvas.value, {
      type: 'bar',
      data: {
        labels: byDocType.map(d => d.doc_type),
        datasets: [
          { label: '전체', data: byDocType.map(d => d.total), backgroundColor: '#c7d2fe' },
          { label: '구현완료', data: byDocType.map(d => d.implemented), backgroundColor: '#6366f1' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    })
  }

  if (aclChart) aclChart.destroy()
  if (aclCanvas.value) {
    const byGroup = acl.by_group || []
    aclChart = new ChartJS(aclCanvas.value, {
      type: 'bar',
      data: {
        labels: byGroup.map(g => g.group_name),
        datasets: [
          { label: '전체', data: byGroup.map(g => g.total), backgroundColor: '#bbf7d0' },
          { label: '커버', data: byGroup.map(g => g.covered), backgroundColor: '#22c55e' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    })
  }

  if (moduleChart) moduleChart.destroy()
  if (moduleCanvas.value) {
    const stats = risk.module_stats || {}
    moduleChart = new ChartJS(moduleCanvas.value, {
      type: 'bar',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          label: '모듈 수',
          data: [stats.critical || 0, stats.high || 0, stats.medium || 0, stats.low || 0],
          backgroundColor: ['#ef4444', '#f97316', '#eab308', '#94a3b8']
        }]
      },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { beginAtZero: true } } }
    })
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await dashboardApi.get()
    // loading을 먼저 false로 바꿔 캔버스가 실제로 DOM에 마운트되도록 한 뒤 차트를 그린다.
    loading.value = false
    await nextTick()
    renderCharts()
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || '대시보드 로딩 실패'
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <LoadingSpinner v-if="loading" />
  <div v-else-if="error" class="p-6 bg-red-50 text-red-600 rounded-xl">{{ error }}</div>
  <div v-else-if="data" class="space-y-6">
    <!-- KPI Row 1: Project -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard title="전체 프로젝트 진행률" :value="fmtPct(data.project.overall_progress)" icon="fa-chart-line" color="blue"
        :sub="`3개 마일스톤 평균 · 태스크 완료 ${data.project.task_stats?.completed || 0}/${data.project.task_stats?.total || 0}`" />
      <KpiCard title="위험 모듈" :value="`${(data.risk.modules || []).length}건`" icon="fa-triangle-exclamation" color="red"
        :sub="`Critical ${data.risk.module_stats?.critical || 0} · High ${data.risk.module_stats?.high || 0}`" />
      <KpiCard title="매핑 완성도" :value="fmtPct(data.mapping.completeness)" icon="fa-arrows-left-right" color="purple"
        :sub="`구현완료 ${data.mapping.stats?.implemented || 0}/${data.mapping.stats?.total || 0}건`" />
      <KpiCard title="ACL 커버리지" :value="fmtPct(data.acl.coverage)" icon="fa-shield-halved" color="green"
        :sub="`승인/적용 문서유형 ${data.acl.covered_doc_types || 0}/${data.acl.total_doc_types || 0}종`" />
    </div>

    <!-- KPI Row 2: DMS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard title="문서관리(DMS) 문서수" :value="`${data.documents?.total_documents || 0}건`" icon="fa-folder-open" color="blue"
        :sub="`첨부파일 ${data.documents?.total_files || 0}건 · ${fmtBytes(data.documents?.total_size_bytes || 0)}`" />
      <KpiCard title="SAP B1 연계율" :value="fmtPct(data.documents?.sap_link_rate || 0)" icon="fa-link" color="purple"
        :sub="`연계 ${data.documents?.sap_link_stats?.linked || 0} · 미연계 ${data.documents?.sap_link_stats?.missing || 0} · 검토대기 ${data.documents?.sap_link_stats?.pending_review || 0}`" />
      <KpiCard title="미연계(Missing) 문서" :value="`${(data.documents?.missing_documents || []).length}건`" icon="fa-triangle-exclamation" color="red"
        sub="SAP 전표 매칭 실패 건 · 즉시 확인 필요" />
      <KpiCard title="만료 예정 인증서" :value="`${(data.documents?.expiring_certifications || []).length}건`" icon="fa-certificate" color="orange"
        sub="90일 이내 만료 예정" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
        <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-calendar-days mr-2 text-blue-600"></i>3개월 로드맵 진행률</h2>
        <div class="space-y-4">
          <div v-for="m in data.project.milestones" :key="m.id">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-sm font-semibold text-slate-700 truncate min-w-0">{{ m.monthNo }}개월차: {{ m.title.split(':')[1]?.trim() || m.title }}</span>
              <span class="text-xs font-bold text-slate-500 shrink-0">{{ fmtPct(m.progress) }}</span>
            </div>
            <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full rounded-full" :style="{ width: `${m.progress}%`, background: m.status === 'completed' ? '#22c55e' : m.status === 'in_progress' ? '#3b82f6' : '#94a3b8' }"></div>
            </div>
            <div class="flex items-center gap-2 mt-1.5 flex-wrap">
              <StatusBadge :status="m.status" />
              <span class="text-[11px] text-slate-400">{{ m.startDate }} ~ {{ m.endDate }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-triangle-exclamation mr-2 text-red-600"></i>위험 모듈</h2>
        <div v-if="(data.risk.modules || []).length" class="space-y-3">
          <div v-for="m in data.risk.modules" :key="m.id" class="p-3 rounded-xl border border-slate-100 bg-slate-50">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-semibold text-slate-700 truncate min-w-0">{{ m.name }}</span>
              <StatusBadge :status="m.riskLevel" />
            </div>
            <p class="text-xs text-slate-500 mt-1">{{ m.riskNote || '' }}</p>
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge :status="m.status" />
              <span class="text-[11px] text-slate-400">{{ m.owner || '' }}</span>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-400">위험 모듈 없음</p>
      </section>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-arrows-left-right mr-2 text-purple-600"></i>매핑 완성도 (문서유형별)</h2>
        <div class="relative h-[180px] sm:h-[220px]"><canvas ref="mappingCanvas"></canvas></div>
      </section>
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-shield-halved mr-2 text-green-600"></i>ACL 커버리지 (그룹별)</h2>
        <div class="relative h-[180px] sm:h-[220px]"><canvas ref="aclCanvas"></canvas></div>
      </section>
    </div>

    <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
      <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-diagram-project mr-2 text-indigo-600"></i>개발 모듈 리스크 분포</h2>
      <div class="relative h-[140px] sm:h-[160px]"><canvas ref="moduleCanvas"></canvas></div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-triangle-exclamation mr-2 text-red-600"></i>SAP 미연계(Missing) 문서</h2>
        <div v-if="(data.documents?.missing_documents || []).length" class="space-y-2">
          <div v-for="d in data.documents.missing_documents" :key="d.id" class="flex items-center justify-between gap-2 p-3 rounded-xl border border-red-100 bg-red-50">
            <div class="min-w-0">
              <span class="text-sm font-semibold text-slate-700 break-words">{{ d.title }}</span>
              <p class="text-[11px] text-slate-500 mt-0.5">{{ d.business_partner_name || '-' }} · {{ d.sap_table || '' }} {{ d.sap_doc_num || '' }}</p>
            </div>
            <StatusBadge status="missing" />
          </div>
        </div>
        <p v-else class="text-sm text-slate-400">미연계 문서 없음</p>
      </section>
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-certificate mr-2 text-orange-600"></i>만료 예정 인증서 (90일 이내)</h2>
        <div v-if="(data.documents?.expiring_certifications || []).length" class="space-y-2">
          <div v-for="c in data.documents.expiring_certifications" :key="c.id" class="flex items-center justify-between gap-2 p-3 rounded-xl border border-orange-100 bg-orange-50">
            <div class="min-w-0">
              <span class="text-sm font-semibold text-slate-700 break-words">{{ c.cert_type }}</span>
              <p class="text-[11px] text-slate-500 mt-0.5">{{ c.business_partner_name || '-' }} · 만료일 {{ c.expiry_date }}</p>
            </div>
            <span :class="['text-xs font-bold shrink-0', daysUntil(c.expiry_date) <= 0 ? 'text-red-600' : 'text-orange-600']">
              {{ daysUntil(c.expiry_date) <= 0 ? '만료됨' : `D-${daysUntil(c.expiry_date)}` }}
            </span>
          </div>
        </div>
        <p v-else class="text-sm text-slate-400">만료 예정 인증서 없음</p>
      </section>
    </div>
  </div>
</template>
