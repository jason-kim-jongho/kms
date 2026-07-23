<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { usePmsData } from '../usePmsData'
import { emptyRecord } from '../tableMeta'

const props = defineProps({
  meta: { type: Object, required: true },
  record: { type: Object, default: null }, // null = 신규 생성
  initialValues: { type: Object, default: null } // 신규 생성 시 미리 채울 값(예: 칸반 컬럼의 status)
})
const emit = defineEmits(['close', 'saved', 'deleted'])

const { linkedOptions, createRecord, updateRecord, removeRecord, load } = usePmsData()

const form = reactive({})
const saving = ref(false)
const error = ref(null)

function resetForm() {
  const base = props.record ? { ...props.record } : { ...emptyRecord(props.meta), ...(props.initialValues || {}) }
  Object.keys(form).forEach(k => delete form[k])
  Object.assign(form, base)
}

watch(() => [props.record, props.initialValues], resetForm, { immediate: true })

// linked_record 필드가 참조하는 테이블들을 미리 로드
props.meta.fields
  .filter(f => f.type === 'linked_record')
  .forEach(f => load(f.linkedTable))

function optionsFor(field) {
  if (field.type === 'select') return field.options
  if (field.type === 'linked_record') return linkedOptions(field.linkedTable)
  return []
}

const isEdit = computed(() => !!props.record?.id)

async function submit() {
  saving.value = true
  error.value = null
  try {
    const payload = { ...form }
    delete payload.createdAt
    delete payload.updatedAt
    if (isEdit.value) {
      await updateRecord(props.meta.key, props.record.id, payload)
    } else {
      await createRecord(props.meta.key, payload)
    }
    emit('saved')
  } catch (e) {
    error.value = e?.response?.data?.message || e.message
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!isEdit.value) return
  if (!confirm('이 레코드를 삭제하시겠습니까?')) return
  saving.value = true
  try {
    await removeRecord(props.meta.key, props.record.id)
    emit('deleted')
  } catch (e) {
    error.value = e?.response?.data?.message || e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
        <div>
          <h3 class="font-bold text-slate-800">{{ meta.label }}</h3>
          <p class="text-xs text-slate-400">{{ isEdit ? '레코드 수정' : '새 레코드 추가' }}</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600">
          <i class="fas fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="p-6 space-y-4">
        <div v-if="error" class="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{{ error }}</div>

        <div v-for="f in meta.fields" :key="f.key">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            {{ f.label }} <span v-if="f.required" class="text-red-500">*</span>
            <span class="text-[10px] text-slate-400 font-normal ml-1">{{ f.type }}</span>
          </label>

          <template v-if="f.readOnly">
            <div class="text-sm text-slate-400 italic px-3 py-2 bg-slate-50 rounded-lg">
              {{ form[f.key] ? new Date(form[f.key]).toLocaleString('ko-KR') : '자동 생성' }}
            </div>
          </template>

          <textarea
            v-else-if="f.type === 'textarea'"
            v-model="form[f.key]"
            rows="3"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="선택 사항"
          ></textarea>

          <select
            v-else-if="f.type === 'select' || f.type === 'linked_record'"
            v-model="form[f.key]"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option :value="null">— 없음 —</option>
            <option v-for="o in optionsFor(f)" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>

          <input
            v-else-if="f.type === 'date'"
            v-model="form[f.key]"
            type="date"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />

          <input
            v-else-if="f.type === 'integer'"
            v-model.number="form[f.key]"
            type="number"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="0"
          />

          <label v-else-if="f.type === 'boolean'" class="inline-flex items-center gap-2">
            <input v-model="form[f.key]" type="checkbox" class="w-4 h-4 rounded" />
            <span class="text-sm text-slate-500">{{ form[f.key] ? '예' : '아니오' }}</span>
          </label>

          <input
            v-else
            v-model="form[f.key]"
            type="text"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="선택 사항"
          />
        </div>
      </div>

      <div class="flex items-center justify-between px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
        <button
          v-if="isEdit"
          @click="handleDelete"
          :disabled="saving"
          class="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          지우기
        </button>
        <div v-else></div>
        <div class="flex items-center gap-2">
          <button @click="$emit('close')" class="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            취소
          </button>
          <button
            @click="submit"
            :disabled="saving"
            class="px-5 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <i v-if="saving" class="fas fa-circle-notch fa-spin mr-1"></i>
            제출
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
