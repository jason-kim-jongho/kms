<script setup>
import { computed } from 'vue'
import FieldBadge from '../FieldBadge.vue'

const props = defineProps({
  meta: { type: Object, required: true },
  records: { type: Array, required: true }
})
const emit = defineEmits(['edit', 'create-in-status'])

const priorityField = computed(() => props.meta.fields.find(f => f.key === 'priority' || f.key === 'severity'))

const columns = computed(() => {
  const opts = props.meta.statusOptions || []
  return opts.map(o => ({
    ...o,
    items: props.records.filter(r => r[props.meta.statusField] === o.value)
  }))
})
</script>

<template>
  <div class="flex gap-4 overflow-x-auto pb-2">
    <div v-for="col in columns" :key="col.value" class="w-72 flex-shrink-0">
      <div class="flex items-center gap-2 mb-3 px-1">
        <i class="fas fa-chevron-down text-[10px] text-slate-400"></i>
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
          :style="{ backgroundColor: col.color + '1a', color: col.color }"
        >{{ col.label }}</span>
        <span class="text-xs text-slate-400">{{ col.items.length }}</span>
      </div>

      <div class="space-y-2 min-h-[40px]">
        <div
          v-for="rec in col.items"
          :key="rec.id"
          @click="emit('edit', rec)"
          class="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
        >
          <p class="text-sm font-semibold text-slate-800 mb-1 line-clamp-2">{{ rec[meta.titleField] }}</p>
          <p v-if="rec[meta.subtitleField]" class="text-xs text-slate-400 mb-2 line-clamp-2">{{ rec[meta.subtitleField] }}</p>
          <FieldBadge v-if="priorityField && rec[priorityField.key]" :value="rec[priorityField.key]" :options="priorityField.options" />
        </div>

        <button
          @click="emit('create-in-status', col.value)"
          class="w-full text-left text-xs text-slate-400 hover:text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <i class="fas fa-plus mr-1"></i>카드 추가
        </button>
      </div>
    </div>

    <div class="w-40 flex-shrink-0">
      <button class="text-xs text-slate-400 hover:text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
        <i class="fas fa-plus mr-1"></i>새 그룹
      </button>
    </div>
  </div>
</template>
