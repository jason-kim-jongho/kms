<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TABLES, TABLE_ORDER, getTableMeta } from './tableMeta'
import { usePmsData } from './usePmsData'
import { usePmsFilter } from './usePmsFilter'
import PmsToolbar from './components/PmsToolbar.vue'
import RecordFormModal from './components/RecordFormModal.vue'
import TableGridView from './components/views/TableGridView.vue'
import KanbanBoardView from './components/views/KanbanBoardView.vue'
import GalleryView from './components/views/GalleryView.vue'
import CalendarView from './components/views/CalendarView.vue'
import ListView from './components/views/ListView.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const { load, loadAll, recordsOf, isLoading, linkedLabel } = usePmsData()

const activeTable = computed(() => route.params.table || 'projects')
const meta = computed(() => getTableMeta(activeTable.value))

const VIEW_TYPES = [
  { key: 'table', label: '테이블', icon: 'fa-table-cells' },
  { key: 'kanban', label: '보드', icon: 'fa-clone' },
  { key: 'gallery', label: '갤러리', icon: 'fa-images' },
  { key: 'calendar', label: '캘린더', icon: 'fa-calendar-days' },
  { key: 'list', label: '리스트', icon: 'fa-bars' }
]
const activeView = ref('table')

const search = ref('')
const filterStatus = ref('all')
const sortKey = ref('')
const sortDir = ref('asc')
const groupBy = ref(false)

const showModal = ref(false)
const editingRecord = ref(null)
const presetStatus = ref(null)

const records = computed(() => recordsOf(activeTable.value))
const { filtered } = usePmsFilter(records, meta, { search, filterStatus, sortKey, sortDir })

function resetFilters() {
  search.value = ''
  filterStatus.value = 'all'
  sortKey.value = ''
  sortDir.value = 'asc'
  activeView.value = 'table'
}

watch(activeTable, () => {
  resetFilters()
  load(activeTable.value)
})

onMounted(() => {
  loadAll()
})

function openCreate(status = null) {
  editingRecord.value = null
  presetStatus.value = status
  showModal.value = true
}

function openEdit(rec) {
  editingRecord.value = rec
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingRecord.value = null
  presetStatus.value = null
}

function onSaved() {
  closeModal()
}

function goTable(key) {
  router.push(`/pms/${key}`)
}

// 신규 레코드 생성 시 칸반 컬럼의 상태값을 폼에 미리 채워준다.
const initialValuesForModal = computed(() => {
  if (editingRecord.value) return null
  if (presetStatus.value && meta.value.statusField) {
    return { [meta.value.statusField]: presetStatus.value }
  }
  return null
})
</script>

<template>
  <div class="flex flex-col md:flex-row gap-4 md:gap-5 h-full">
    <!-- 좌측 테이블 목록 사이드바 (데스크탑 전용) -->
    <aside class="w-56 flex-shrink-0 hidden md:block">
      <div class="bg-white rounded-2xl border border-slate-200 p-3 sticky top-6">
        <p class="text-xs font-semibold text-slate-400 uppercase px-2 mb-2">대시보드</p>
        <router-link
          to="/dashboard"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 mb-1"
        >
          <i class="fas fa-gauge-high w-4 text-center text-emerald-500"></i>
          Teedy 도입 통합 대시보드
        </router-link>
        <router-link
          to="/pms/projects"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 mb-3"
        >
          <i class="fas fa-list-ul w-4 text-center text-emerald-500"></i>
          Project Overview
        </router-link>

        <p class="text-xs font-semibold text-slate-400 uppercase px-2 mb-2">테이블</p>
        <nav class="space-y-0.5">
          <button
            v-for="key in TABLE_ORDER"
            :key="key"
            @click="goTable(key)"
            class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            :class="activeTable === key ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'"
          >
            <span class="flex items-center gap-2 truncate">
              <i :class="['fas', TABLES[key].icon, 'w-4 text-center text-slate-400']"></i>
              {{ TABLES[key].label }}
            </span>
            <span class="text-[11px] text-slate-400">{{ recordsOf(key).length || '' }}</span>
          </button>
        </nav>
      </div>
    </aside>

    <!-- 메인 콘텐츠 -->
    <div class="flex-1 min-w-0 space-y-4">
      <!-- 모바일 전용: 테이블 선택 드롭다운 (좌측 사이드바 대체) -->
      <div class="md:hidden">
        <select
          :value="activeTable"
          @change="goTable($event.target.value)"
          data-testid="pms-mobile-table-select"
          class="w-full px-3 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option v-for="key in TABLE_ORDER" :key="key" :value="key">
            {{ TABLES[key].label }} ({{ recordsOf(key).length || 0 }})
          </option>
        </select>
      </div>

      <!-- 뷰 전환 탭 -->
      <div class="flex items-center gap-2 flex-wrap justify-between">
        <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto max-w-full">
          <button
            v-for="v in VIEW_TYPES"
            :key="v.key"
            :data-testid="`pms-view-tab-${v.key}`"
            @click="activeView = v.key"
            class="px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            :class="activeView === v.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'"
          >
            <i :class="['fas', v.icon]"></i>
            <span class="hidden sm:inline">{{ v.label }}</span>
          </button>
        </div>

        <button
          @click="openCreate()"
          class="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 shrink-0"
        >
          <i class="fas fa-plus"></i> <span class="hidden xs:inline sm:inline">새 레코드</span>
        </button>
      </div>

      <!-- 툴바 -->
      <PmsToolbar
        :meta="meta"
        v-model:search="search"
        v-model:filter-status="filterStatus"
        v-model:sort-key="sortKey"
        v-model:sort-dir="sortDir"
        v-model:group-by="groupBy"
        :show-group-toggle="activeView === 'table'"
      />

      <!-- 뷰 콘텐츠 -->
      <LoadingSpinner v-if="isLoading(activeTable)" />
      <template v-else>
        <TableGridView
          v-if="activeView === 'table'"
          :meta="meta"
          :records="filtered"
          :linked-label="linkedLabel"
          @edit="openEdit"
        />
        <KanbanBoardView
          v-else-if="activeView === 'kanban'"
          :meta="meta"
          :records="filtered"
          @edit="openEdit"
          @create-in-status="openCreate"
        />
        <GalleryView
          v-else-if="activeView === 'gallery'"
          :meta="meta"
          :records="filtered"
          @edit="openEdit"
          @create="openCreate()"
        />
        <CalendarView
          v-else-if="activeView === 'calendar'"
          :meta="meta"
          :records="filtered"
          @edit="openEdit"
        />
        <ListView
          v-else-if="activeView === 'list'"
          :meta="meta"
          :records="filtered"
          :linked-label="linkedLabel"
          @edit="openEdit"
        />
      </template>
    </div>

    <RecordFormModal
      v-if="showModal"
      :meta="meta"
      :record="editingRecord"
      :initial-values="initialValuesForModal"
      @close="closeModal"
      @saved="onSaved"
      @deleted="closeModal"
    />
  </div>
</template>
