<script setup>
import FieldBadge from '../FieldBadge.vue'

const props = defineProps({
  meta: { type: Object, required: true },
  records: { type: Array, required: true }
})
const emit = defineEmits(['edit', 'create'])

function priorityFieldOf(meta) {
  return meta.fields.find(f => f.key === 'priority' || f.key === 'severity')
}
</script>

<template>
  <div>
    <p class="text-xs text-slate-400 mb-3">{{ records.length }}개 레코드</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="(rec, idx) in records"
        :key="rec.id"
        @click="emit('edit', rec)"
        class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
      >
        <p class="text-xs text-slate-300 font-mono mb-2">{{ idx + 1 }}</p>
        <p class="text-sm font-bold text-slate-800 mb-1">{{ rec[meta.titleField] }}</p>
        <p v-if="rec[meta.subtitleField]" class="text-xs text-slate-500 mb-3 line-clamp-2">{{ rec[meta.subtitleField] }}</p>
        <div class="flex items-center gap-2">
          <FieldBadge v-if="meta.statusField" :value="rec[meta.statusField]" :options="meta.statusOptions" />
          <FieldBadge
            v-if="priorityFieldOf(meta) && rec[priorityFieldOf(meta).key]"
            :value="rec[priorityFieldOf(meta).key]"
            :options="priorityFieldOf(meta).options"
          />
        </div>
      </div>

      <button
        @click="emit('create')"
        class="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors py-10"
      >
        <i class="fas fa-plus text-lg mb-1"></i>
        <span class="text-xs">새 레코드</span>
      </button>
    </div>
  </div>
</template>
