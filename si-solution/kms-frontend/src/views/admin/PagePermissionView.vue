<script setup>
import { ref, onMounted, computed } from 'vue'
import { userApi, pagePermissionApi } from '../../api/services'

const users = ref([])
const pageCatalog = ref({}) // { pageKey: label }
const permissions = ref([]) // [{id, username, pageKey, allowed}]
const loading = ref(true)
const error = ref(null)
const savingKey = ref(null) // `${username}:${pageKey}` 저장 중 표시용

const pageKeys = computed(() => Object.keys(pageCatalog.value))
const normalUsers = computed(() => users.value.filter((u) => u.role !== 'ADMIN'))

// permMap[username][pageKey] = { id, allowed } | undefined
const permMap = computed(() => {
  const map = {}
  for (const p of permissions.value) {
    if (!map[p.username]) map[p.username] = {}
    map[p.username][p.pageKey] = { id: p.id, allowed: p.allowed }
  }
  return map
})

function isAllowed(username, pageKey) {
  return !!permMap.value[username]?.[pageKey]?.allowed
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [u, catalog, perms] = await Promise.all([
      userApi.list(),
      pagePermissionApi.pageCatalog(),
      pagePermissionApi.list()
    ])
    users.value = u
    pageCatalog.value = catalog
    permissions.value = perms
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || '권한 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function toggle(username, pageKey) {
  const key = `${username}:${pageKey}`
  savingKey.value = key
  const current = isAllowed(username, pageKey)
  try {
    await pagePermissionApi.upsert({ username, pageKey, allowed: !current })
    await load()
  } catch (e) {
    alert(e?.response?.data?.message || e.message || '권한 변경에 실패했습니다.')
  } finally {
    savingKey.value = null
  }
}

onMounted(load)
</script>

<template>
  <div id="page-permission-view" class="max-w-6xl mx-auto space-y-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-800">페이지별 접근권한(ACL) 관리</h2>
      <p class="text-sm text-slate-500">
        사용자 아이디별로 각 페이지에 대한 접근 허용/차단을 설정합니다.
        <span class="font-medium text-blue-600">관리자(ADMIN)</span> 역할 계정은 이 설정과 무관하게 항상 전체 페이지에 접근할 수 있습니다.
      </p>
    </div>

    <div v-if="loading" class="text-center py-10 text-slate-400"><i class="fas fa-spinner fa-spin mr-2"></i>로딩 중...</div>
    <div v-else-if="error" class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{{ error }}</div>

    <div v-else-if="normalUsers.length === 0" class="bg-amber-50 text-amber-700 text-sm rounded-lg px-4 py-3">
      일반 사용자(USER) 계정이 없습니다. 먼저 <router-link to="/admin/users" class="underline font-medium">사용자 계정 관리</router-link>에서 계정을 생성해 주세요.
    </div>

    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <table class="w-full text-sm min-w-[720px]">
        <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-2.5 text-left sticky left-0 bg-slate-50 z-10">사용자 아이디</th>
            <th v-for="key in pageKeys" :key="key" class="px-3 py-2.5 text-center whitespace-nowrap">
              {{ pageCatalog[key] }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="u in normalUsers" :key="u.username" class="hover:bg-slate-50">
            <td class="px-4 py-2.5 font-medium text-slate-700 sticky left-0 bg-white z-10 whitespace-nowrap">
              {{ u.username }}
              <span class="text-slate-400 text-xs ml-1">({{ u.displayName }})</span>
            </td>
            <td v-for="key in pageKeys" :key="key" class="px-3 py-2 text-center">
              <button
                :data-testid="`perm-toggle-${u.username}-${key}`"
                :disabled="savingKey === `${u.username}:${key}`"
                @click="toggle(u.username, key)"
                class="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                :class="isAllowed(u.username, key) ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'"
                :title="isAllowed(u.username, key) ? '허용됨 (클릭하여 차단)' : '차단됨 (클릭하여 허용)'"
              >
                <i v-if="savingKey === `${u.username}:${key}`" class="fas fa-spinner fa-spin text-xs"></i>
                <i v-else :class="isAllowed(u.username, key) ? 'fa-check' : 'fa-xmark'" class="fas text-sm"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs text-slate-400">
      <i class="fas fa-circle-info mr-1"></i>
      셀을 클릭하면 즉시 저장됩니다. 초록색 체크는 접근 허용, 회색 X는 접근 차단 상태입니다.
    </p>
  </div>
</template>
