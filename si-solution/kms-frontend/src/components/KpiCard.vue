<script setup>
defineProps({
  title: String,
  value: [String, Number],
  icon: String,
  color: { type: String, default: 'blue' },
  sub: String
})

const colorMap = {
  blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600', green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600'
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
    <div class="flex items-center justify-between">
      <p class="text-sm text-slate-500">{{ title }}</p>
      <div :class="['w-9 h-9 rounded-xl flex items-center justify-center', colorMap[color] || colorMap.blue]">
        <i :class="['fas', icon]"></i>
      </div>
    </div>
    <p class="text-2xl font-bold text-slate-800 mt-2">{{ value }}</p>
    <p v-if="sub" class="text-xs text-slate-400 mt-1">{{ sub }}</p>
  </div>
</template>
