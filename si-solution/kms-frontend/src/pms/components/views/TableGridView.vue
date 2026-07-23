<script setup>
import FieldBadge from '../FieldBadge.vue'

const props = defineProps({
  meta: { type: Object, required: true },
  records: { type: Array, required: true },
  linkedLabel: { type: Function, required: true }
})
const emit = defineEmits(['edit'])

function displayValue(rec, field) {
  const v = rec[field.key]
  if (field.type === 'linked_record') {
    return v ? props.linkedLabel(field.linkedTable, v) : '-'
  }
  if (field.type === 'boolean') return v ? '예' : '아니오'
  if (field.type === 'timestamp' && v) return new Date(v).toLocaleString('ko-KR')
  if (v === null || v === undefined || v === '') return '-'
  return v
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-100 text-left text-xs text-slate-400 uppercase">
          <th class="px-4 py-3 w-6"><input type="checkbox" class="rounded" /></th>
          <th v-for="f in meta.fields" :key="f.key" class="px-4 py-3 whitespace-nowrap font-medium">{{ f.label }}</th>
          <th class="px-4 py-3 w-8"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="rec in records"
          :key="rec.id"
          class="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
          @click="emit('edit', rec)"
        >
          <td class="px-4 py-3"><input type="checkbox" class="rounded" @click.stop /></td>
          <td v-for="f in meta.fields" :key="f.key" class="px-4 py-3 whitespace-nowrap max-w-xs truncate">
            <FieldBadge v-if="f.type === 'select'" :value="rec[f.key]" :options="f.options" />
            <span v-else class="text-slate-600">{{ displayValue(rec, f) }}</span>
          </td>
          <td class="px-4 py-3 text-slate-300"><i class="fas fa-ellipsis"></i></td>
        </tr>
        <tr v-if="!records.length">
          <td :colspan="meta.fields.length + 2" class="px-4 py-10 text-center text-slate-400">레코드가 없습니다.</td>
        </tr>
      </tbody>
    </table>
    <div class="px-4 py-3 text-xs text-slate-400 border-t border-slate-50">{{ records.length }}개 레코드</div>
  </div>
</template>
