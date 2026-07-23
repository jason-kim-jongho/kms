<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: String, default: '' },
  options: { type: Array, default: () => [] }
})

const opt = computed(() => props.options.find(o => o.value === props.value))
const color = computed(() => opt.value?.color || '#94a3b8')
const label = computed(() => opt.value?.label || props.value || '-')
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
    :style="{ backgroundColor: color + '1a', color }"
  >
    {{ label }}
  </span>
</template>
