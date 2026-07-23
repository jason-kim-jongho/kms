<script setup>
import FieldBadge from '../FieldBadge.vue'

const props = defineProps({
  meta: { type: Object, required: true },
  records: { type: Array, required: true },
  linkedLabel: { type: Function, required: true }
})
const emit = defineEmits(['edit'])

const linkedFields = props.meta.fields.filter(f => f.type === 'linked_record')

// status/날짜 필드를 우선적으로 노출하고, 남는 슬롯은 필드 순서대로 채운다
// (참조 이미지 패턴: name, #linked, target_date, status, notes)
const priorityKeys = [props.meta.dateField, props.meta.statusField].filter(Boolean)
const candidateFields = props.meta.fields.filter(f =>
  !['textarea', 'timestamp'].includes(f.type) && f.key !== props.meta.titleField && f.type !== 'linked_record'
)
const priorityFields = priorityKeys
  .map(k => candidateFields.find(f => f.key === k))
  .filter(Boolean)
const restFields = candidateFields.filter(f => !priorityKeys.includes(f.key))
const otherFields = [...priorityFields, ...restFields].slice(0, 3)

const noteField = props.meta.fields.find(f => f.key === 'notes' || f.key === 'description')
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-50">
    <div class="flex items-center gap-4 px-4 py-2.5 text-xs text-slate-400 uppercase font-medium">
      <input type="checkbox" class="rounded" />
      <span class="flex-1">name</span>
      <span v-for="f in linkedFields" :key="f.key" class="w-40">{{ f.label }}</span>
      <span v-for="f in otherFields" :key="f.key" class="w-28">{{ f.label }}</span>
      <span v-if="noteField" class="w-40">{{ noteField.label }}</span>
    </div>

    <div
      v-for="rec in records"
      :key="rec.id"
      @click="emit('edit', rec)"
      class="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 cursor-pointer"
    >
      <input type="checkbox" class="rounded" @click.stop />
      <span class="flex-1 text-sm font-medium text-slate-700 truncate">{{ rec[meta.titleField] }}</span>

      <span v-for="f in linkedFields" :key="f.key" class="w-40 truncate">
        <span v-if="rec[f.key]" class="inline-flex items-center gap-1 text-xs text-blue-600">
          <i class="fas fa-arrow-up-right-from-square text-[10px]"></i>
          {{ linkedLabel(f.linkedTable, rec[f.key]) }}
        </span>
        <span v-else class="text-xs text-slate-300">-</span>
      </span>

      <span v-for="f in otherFields" :key="f.key" class="w-28 text-xs">
        <FieldBadge v-if="f.type === 'select'" :value="rec[f.key]" :options="f.options" />
        <span v-else class="text-slate-500">{{ rec[f.key] ?? '-' }}</span>
      </span>

      <span v-if="noteField" class="w-40 text-xs text-slate-400 truncate">{{ rec[noteField.key] || '-' }}</span>
    </div>

    <p v-if="!records.length" class="px-4 py-10 text-center text-sm text-slate-400">레코드가 없습니다.</p>
  </div>
</template>
