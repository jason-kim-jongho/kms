<script setup>
import { computed } from 'vue'

const props = defineProps({
  meta: { type: Object, required: true },
  search: { type: String, default: '' },
  filterStatus: { type: String, default: 'all' },
  sortKey: { type: String, default: '' },
  sortDir: { type: String, default: 'asc' },
  groupBy: { type: Boolean, default: false },
  showGroupToggle: { type: Boolean, default: true }
})
const emit = defineEmits(['update:search', 'update:filterStatus', 'update:sortKey', 'update:sortDir', 'update:groupBy'])

const sortableFields = computed(() =>
  props.meta.fields.filter(f => ['text', 'date', 'integer', 'timestamp'].includes(f.type))
)
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap px-1">
    <!-- 필터 -->
    <div class="relative">
      <select
        :value="filterStatus"
        @change="$emit('update:filterStatus', $event.target.value)"
        class="pl-7 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 focus:outline-none appearance-none cursor-pointer"
      >
        <option value="all">필터: 전체</option>
        <option v-for="o in meta.statusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <i class="fas fa-filter absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
    </div>

    <!-- 정렬 -->
    <div class="relative">
      <select
        :value="sortKey"
        @change="$emit('update:sortKey', $event.target.value)"
        class="pl-7 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 focus:outline-none appearance-none cursor-pointer"
      >
        <option value="">정렬: 없음</option>
        <option v-for="f in sortableFields" :key="f.key" :value="f.key">{{ f.label }}</option>
      </select>
      <i class="fas fa-arrow-down-a-z absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
    </div>
    <button
      v-if="sortKey"
      @click="$emit('update:sortDir', sortDir === 'asc' ? 'desc' : 'asc')"
      class="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-500 hover:bg-slate-50"
      :title="sortDir === 'asc' ? '오름차순' : '내림차순'"
    >
      <i :class="['fas', sortDir === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down']"></i>
    </button>

    <!-- 그룹 -->
    <button
      v-if="showGroupToggle"
      @click="$emit('update:groupBy', !groupBy)"
      class="px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors"
      :class="groupBy ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
    >
      <i class="fas fa-layer-group mr-1"></i>그룹
    </button>

    <!-- 검색 -->
    <div class="relative ml-auto">
      <i class="fas fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
      <input
        :value="search"
        @input="$emit('update:search', $event.target.value)"
        type="text"
        placeholder="검색..."
        class="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-40 focus:ring-2 focus:ring-blue-300 focus:outline-none"
      />
    </div>
  </div>
</template>
