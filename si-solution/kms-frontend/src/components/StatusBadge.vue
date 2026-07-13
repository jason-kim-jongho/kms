<script setup>
import { computed } from 'vue'
import { badgeClass, labelOf, STATUS_LABEL } from '../utils/format'

const props = defineProps({
  status: { type: String, default: '' },
  labelMap: { type: Object, default: () => STATUS_LABEL }
})

const cls = computed(() => badgeClass(props.status))
const label = computed(() => labelOf(props.labelMap, props.status))
</script>

<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', cls]">
    {{ label }}
  </span>
</template>
