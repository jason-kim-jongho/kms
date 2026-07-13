export const STATUS_LABEL = {
  planned: '계획', in_progress: '진행중', completed: '완료', blocked: '차단',
  backlog: '백로그', active: '활성', pending: '대기', done: '완료',
  draft: '초안', reviewed: '검토완료', approved: '승인', implemented: '구현완료', applied: '적용완료'
}

export const RISK_LABEL = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low'
}

export const LINK_STATUS_LABEL = {
  linked: '연계완료', missing: '미연계', pending_review: '검토대기'
}

export const STATUS_COLORS = {
  planned: '#94a3b8', in_progress: '#3b82f6', completed: '#22c55e', blocked: '#ef4444',
  backlog: '#94a3b8', active: '#3b82f6', done: '#22c55e'
}

export const BADGE_COLORS = {
  planned: 'bg-slate-100 text-slate-600', in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700', blocked: 'bg-red-100 text-red-700',
  backlog: 'bg-slate-100 text-slate-600', active: 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700',
  draft: 'bg-slate-100 text-slate-600', reviewed: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-purple-100 text-purple-700', implemented: 'bg-green-100 text-green-700',
  applied: 'bg-green-100 text-green-700',
  critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700', low: 'bg-slate-100 text-slate-600',
  linked: 'bg-green-100 text-green-700', missing: 'bg-red-100 text-red-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  revoked: 'bg-red-100 text-red-700', expired: 'bg-slate-100 text-slate-500'
}

export function fmtPct(v) {
  if (v === null || v === undefined) return '-'
  return `${Math.round(v)}%`
}

export function fmtBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(1)} ${units[i]}`
}

export function labelOf(map, key) {
  return map[key] || key || '-'
}

export function badgeClass(key) {
  return BADGE_COLORS[key] || 'bg-slate-100 text-slate-600'
}
