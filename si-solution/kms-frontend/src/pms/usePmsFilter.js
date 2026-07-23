// 공통 필터/정렬 로직 (테이블/칸반/갤러리/캘린더/리스트 뷰에서 공용으로 사용)
import { computed } from 'vue'

export function usePmsFilter(records, meta, opts) {
  const { search, filterStatus, sortKey, sortDir } = opts

  const filtered = computed(() => {
    let list = records.value || []

    if (filterStatus.value && filterStatus.value !== 'all' && meta.statusField) {
      list = list.filter(r => r[meta.statusField] === filterStatus.value)
    }

    if (search.value) {
      const q = search.value.toLowerCase()
      list = list.filter(r => {
        const title = (r[meta.titleField] || '').toString().toLowerCase()
        const sub = (r[meta.subtitleField] || '').toString().toLowerCase()
        return title.includes(q) || sub.includes(q)
      })
    }

    if (sortKey.value) {
      list = [...list].sort((a, b) => {
        const av = a[sortKey.value]
        const bv = b[sortKey.value]
        if (av === bv) return 0
        const cmp = (av ?? '') > (bv ?? '') ? 1 : -1
        return sortDir.value === 'desc' ? -cmp : cmp
      })
    }

    return list
  })

  return { filtered }
}
