<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  meta: { type: Object, required: true },
  records: { type: Array, required: true }
})
const emit = defineEmits(['edit'])

const cursor = ref(dayjs())

const weekLabels = ['일', '월', '화', '수', '목', '금', '토']

const dateFieldKey = computed(() => props.meta.dateField || 'createdAt')

const eventsByDate = computed(() => {
  const map = {}
  for (const rec of props.records) {
    const d = rec[dateFieldKey.value]
    if (!d) continue
    const key = dayjs(d).format('YYYY-MM-DD')
    if (!map[key]) map[key] = []
    map[key].push(rec)
  }
  return map
})

const calendarCells = computed(() => {
  const startOfMonth = cursor.value.startOf('month')
  const endOfMonth = cursor.value.endOf('month')
  const startDate = startOfMonth.startOf('week')
  const endDate = endOfMonth.endOf('week')

  const cells = []
  let d = startDate
  while (d.isBefore(endDate) || d.isSame(endDate, 'day')) {
    const key = d.format('YYYY-MM-DD')
    cells.push({
      date: d,
      key,
      inMonth: d.month() === cursor.value.month(),
      isToday: d.isSame(dayjs(), 'day'),
      events: eventsByDate.value[key] || []
    })
    d = d.add(1, 'day')
  }
  return cells
})

function prevMonth() { cursor.value = cursor.value.subtract(1, 'month') }
function nextMonth() { cursor.value = cursor.value.add(1, 'month') }
function goToday() { cursor.value = dayjs() }
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <button @click="prevMonth" class="text-slate-400 hover:text-slate-600 px-1"><i class="fas fa-chevron-left"></i></button>
        <button @click="goToday" class="text-xs px-2 py-1 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">오늘</button>
        <button @click="nextMonth" class="text-slate-400 hover:text-slate-600 px-1"><i class="fas fa-chevron-right"></i></button>
      </div>
      <p class="font-bold text-slate-800">{{ cursor.format('YYYY년 M월') }}</p>
      <p class="text-xs text-slate-400">기준: {{ meta.fields.find(f => f.key === dateFieldKey)?.label || dateFieldKey }}</p>
    </div>

    <div class="grid grid-cols-7 border-b border-slate-100">
      <div v-for="w in weekLabels" :key="w" class="px-2 py-2 text-center text-xs font-semibold text-slate-400">{{ w }}</div>
    </div>

    <div class="grid grid-cols-7">
      <div
        v-for="cell in calendarCells"
        :key="cell.key"
        class="min-h-[92px] border-b border-r border-slate-50 p-1.5"
        :class="!cell.inMonth ? 'bg-slate-50/50' : ''"
      >
        <span
          class="inline-flex items-center justify-center w-6 h-6 text-xs rounded-full"
          :class="[
            cell.isToday ? 'bg-slate-900 text-white font-bold' : (cell.inMonth ? 'text-slate-600' : 'text-slate-300')
          ]"
        >{{ cell.date.date() }}</span>
        <div class="mt-1 space-y-1">
          <div
            v-for="ev in cell.events.slice(0, 3)"
            :key="ev.id"
            @click="emit('edit', ev)"
            class="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 truncate cursor-pointer hover:bg-blue-100"
          >
            {{ ev[meta.titleField] }}
          </div>
          <p v-if="cell.events.length > 3" class="text-[10px] text-slate-400">+{{ cell.events.length - 3 }}건 더보기</p>
        </div>
      </div>
    </div>
  </div>
</template>
