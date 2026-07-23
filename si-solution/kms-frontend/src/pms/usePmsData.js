// ============================================================
// PMS 전역 데이터 캐시. 8개 테이블(projects/milestones/.../case_studies)의
// 레코드를 로드하고, linked_record 필드(예: milestones.projectId → projects)의
// 라벨을 조회할 수 있도록 캐시를 제공한다.
// ============================================================
import { reactive } from 'vue'
import { TABLES, getTableMeta } from './tableMeta'

const cache = reactive({
  records: {},   // { projects: [...], milestones: [...], ... }
  loading: {},   // { projects: false, ... }
  loaded: {}     // { projects: true, ... }
})

export function usePmsData() {
  async function load(tableKey, force = false) {
    if (cache.loaded[tableKey] && !force) return cache.records[tableKey]
    const meta = getTableMeta(tableKey)
    if (!meta) return []
    cache.loading[tableKey] = true
    try {
      const data = await meta.api.list()
      cache.records[tableKey] = Array.isArray(data) ? data : []
      cache.loaded[tableKey] = true
      return cache.records[tableKey]
    } finally {
      cache.loading[tableKey] = false
    }
  }

  async function loadAll(force = false) {
    await Promise.all(Object.keys(TABLES).map(k => load(k, force)))
  }

  function recordsOf(tableKey) {
    return cache.records[tableKey] || []
  }

  function isLoading(tableKey) {
    return !!cache.loading[tableKey]
  }

  // linked_record 필드 라벨 조회: 예) linkedLabel('projects', 1) -> "SAP B1 연계..."
  function linkedLabel(tableKey, id) {
    if (id === null || id === undefined) return null
    const meta = getTableMeta(tableKey)
    if (!meta) return String(id)
    const list = cache.records[tableKey] || []
    const found = list.find(r => String(r.id) === String(id))
    if (!found) return `#${id}`
    return found[meta.titleField] || found.name || found.title || `#${id}`
  }

  function linkedOptions(tableKey) {
    const meta = getTableMeta(tableKey)
    if (!meta) return []
    const list = cache.records[tableKey] || []
    return list.map(r => ({ value: r.id, label: r[meta.titleField] || r.name || r.title || `#${r.id}` }))
  }

  async function createRecord(tableKey, payload) {
    const meta = getTableMeta(tableKey)
    const saved = await meta.api.create(payload)
    await load(tableKey, true)
    return saved
  }

  async function updateRecord(tableKey, id, payload) {
    const meta = getTableMeta(tableKey)
    const saved = await meta.api.update(id, payload)
    await load(tableKey, true)
    return saved
  }

  async function removeRecord(tableKey, id) {
    const meta = getTableMeta(tableKey)
    await meta.api.remove(id)
    await load(tableKey, true)
  }

  return {
    cache,
    load,
    loadAll,
    recordsOf,
    isLoading,
    linkedLabel,
    linkedOptions,
    createRecord,
    updateRecord,
    removeRecord
  }
}
