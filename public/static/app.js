// ============================================================
// SAP B1 - Teedy 통합 프로젝트 대시보드 프론트엔드
// ============================================================

const STATUS_LABEL = {
  planned: '계획됨', in_progress: '진행중', completed: '완료', on_hold: '보류', delayed: '지연',
  pending: '대기', blocked: '차단', backlog: '백로그', design: '설계중', testing: '테스트중', done: '완료',
  at_risk: '위험', draft: '초안', reviewed: '검토완료', approved: '승인됨', implemented: '구현완료', applied: '적용완료'
};
const RISK_LABEL = { low: '낮음', medium: '중간', high: '높음', critical: '심각' };
const PRIORITY_LABEL = { low: '낮음', medium: '중간', high: '높음', critical: '긴급' };
const CATEGORY_LABEL = { integration: '통합', validation: '검증', ui: 'UI', ai: 'AI' };

const STATUS_COLORS = {
  planned: '#94a3b8', in_progress: '#2563eb', completed: '#16a34a', on_hold: '#f59e0b', delayed: '#dc2626'
};

let CHARTS = {};

function badge(status, labelMap = STATUS_LABEL) {
  const label = labelMap[status] || status;
  return `<span class="badge badge-${status}">${label}</span>`;
}

function fmtPct(v) {
  return `${Math.round(v || 0)}%`;
}

function el(id) { return document.getElementById(id); }

async function api(path, opts) {
  const res = await axios(`/api${path}`, opts);
  if (!res.data.success) throw new Error(res.data.error || 'API Error');
  return res.data.data;
}

// ------------------------------------------------------------
// APP SHELL
// ------------------------------------------------------------
const TABS = [
  { key: 'dashboard', label: '통합 대시보드', icon: 'fa-gauge-high' },
  { key: 'roadmap', label: '3개월 로드맵', icon: 'fa-calendar-days' },
  { key: 'modules', label: '개발 모듈 백로그', icon: 'fa-diagram-project' },
  { key: 'mapping', label: 'SAP-Teedy 매핑', icon: 'fa-arrows-left-right' },
  { key: 'acl', label: 'ACL 설계', icon: 'fa-shield-halved' }
];

function renderShell() {
  document.getElementById('app').innerHTML = `
    <header class="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white">
            <i class="fas fa-cubes"></i>
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-800 leading-tight">SAP B1 - Teedy 문서관리 통합 프로젝트</h1>
            <p class="text-xs text-slate-500" id="project-subtitle">3개월 로드맵 · 대시보드</p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <i class="fas fa-circle text-green-500 text-[8px]"></i>
          <span id="last-updated">로딩중...</span>
        </div>
      </div>
      <nav class="max-w-7xl mx-auto px-6 flex gap-2 pb-3 overflow-x-auto scrollbar-thin" id="tab-nav"></nav>
    </header>
    <main class="max-w-7xl mx-auto px-6 py-6" id="main-content"></main>
  `;

  const nav = el('tab-nav');
  nav.innerHTML = TABS.map(t => `
    <button class="tab-btn px-4 py-2 rounded-lg text-sm font-medium text-slate-600 whitespace-nowrap" data-tab="${t.key}">
      <i class="fas ${t.icon} mr-1.5"></i>${t.label}
    </button>
  `).join('');
  nav.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function setActiveTab(key) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === key);
  });
}

async function switchTab(key) {
  setActiveTab(key);
  const content = el('main-content');
  content.innerHTML = `<div class="py-24 text-center text-slate-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>`;
  try {
    if (key === 'dashboard') await renderDashboard();
    else if (key === 'roadmap') await renderRoadmap();
    else if (key === 'modules') await renderModules();
    else if (key === 'mapping') await renderMapping();
    else if (key === 'acl') await renderAcl();
  } catch (e) {
    console.error(e);
    content.innerHTML = `<div class="p-6 bg-red-50 text-red-600 rounded-xl"><i class="fas fa-triangle-exclamation mr-2"></i>${e.message}</div>`;
  }
  el('last-updated').textContent = `업데이트: ${dayjs().format('YYYY-MM-DD HH:mm')}`;
}

// ============================================================
// 1) DASHBOARD
// ============================================================
async function renderDashboard() {
  const data = await api('/dashboard');
  const content = el('main-content');

  const { project, risk, mapping, acl } = data;
  const taskStats = project.task_stats || {};
  const moduleStats = risk.module_stats || {};

  content.innerHTML = `
    <div class="fade-in space-y-6">
      <!-- KPI Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${kpiCard('전체 프로젝트 진행률', fmtPct(project.overall_progress), 'fa-chart-line', 'blue',
          `3개 마일스톤 평균 · 태스크 완료 ${taskStats.completed || 0}/${taskStats.total || 0}`)}
        ${kpiCard('위험 모듈', `${(risk.modules || []).length}건`, 'fa-triangle-exclamation', 'red',
          `Critical ${moduleStats.critical || 0} · High ${moduleStats.high || 0}`)}
        ${kpiCard('매핑 완성도', fmtPct(mapping.completeness), 'fa-arrows-left-right', 'purple',
          `구현완료 ${mapping.stats?.implemented || 0}/${mapping.stats?.total || 0}건`)}
        ${kpiCard('ACL 커버리지', fmtPct(acl.coverage), 'fa-shield-halved', 'green',
          `승인/적용 문서유형 ${acl.covered_doc_types || 0}/${acl.total_doc_types || 0}종`)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 3-month progress -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
          <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-calendar-days mr-2 text-blue-600"></i>3개월 로드맵 진행률</h2>
          <div class="space-y-4" id="dash-milestones"></div>
        </section>

        <!-- Risk modules -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-triangle-exclamation mr-2 text-red-600"></i>위험 모듈</h2>
          <div class="space-y-3" id="dash-risk"></div>
        </section>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- mapping completeness -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-arrows-left-right mr-2 text-purple-600"></i>매핑 완성도 (문서유형별)</h2>
          <canvas id="chart-mapping" height="220"></canvas>
        </section>

        <!-- ACL coverage -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-shield-halved mr-2 text-green-600"></i>ACL 커버리지 (그룹별)</h2>
          <canvas id="chart-acl" height="220"></canvas>
        </section>
      </div>

      <!-- module status chart -->
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-diagram-project mr-2 text-indigo-600"></i>개발 모듈 리스크 분포</h2>
        <canvas id="chart-modules" height="120"></canvas>
      </section>
    </div>
  `;

  // Milestones
  el('dash-milestones').innerHTML = project.milestones.map(m => `
    <div>
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-semibold text-slate-700">${m.month_no}개월차: ${m.title.split(':')[1] ? m.title.split(':')[1].trim() : m.title}</span>
        <span class="text-xs font-bold text-slate-500">${fmtPct(m.progress)}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${m.progress}%; background:${STATUS_COLORS[m.status] || '#94a3b8'}"></div>
      </div>
      <div class="flex items-center gap-2 mt-1.5">
        ${badge(m.status)}
        <span class="text-[11px] text-slate-400">${m.start_date} ~ ${m.end_date}</span>
      </div>
    </div>
  `).join('');

  // Risk modules
  const riskModules = risk.modules || [];
  el('dash-risk').innerHTML = riskModules.length
    ? riskModules.map(m => `
        <div class="p-3 rounded-xl border border-slate-100 bg-slate-50">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-slate-700">${m.name}</span>
            ${badge(m.risk_level, RISK_LABEL)}
          </div>
          <p class="text-xs text-slate-500 mt-1">${m.risk_note || ''}</p>
          <div class="flex items-center gap-2 mt-2">
            ${badge(m.status)}
            <span class="text-[11px] text-slate-400">${m.owner || ''}</span>
          </div>
        </div>
      `).join('')
    : `<p class="text-sm text-slate-400">위험 모듈 없음</p>`;

  // Charts
  renderMappingChart(mapping.by_doc_type || []);
  renderAclChart(acl.by_group || []);
  renderModuleRiskChart(moduleStats);
}

function kpiCard(title, value, icon, color, sub) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600', green: 'bg-green-50 text-green-600'
  };
  return `
    <div class="kpi-card bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-medium text-slate-500">${title}</span>
        <div class="w-8 h-8 rounded-lg ${colorMap[color]} flex items-center justify-center">
          <i class="fas ${icon} text-sm"></i>
        </div>
      </div>
      <div class="text-2xl font-extrabold text-slate-800">${value}</div>
      <div class="text-[11px] text-slate-400 mt-1">${sub}</div>
    </div>
  `;
}

function destroyChart(key) {
  if (CHARTS[key]) { CHARTS[key].destroy(); delete CHARTS[key]; }
}

function renderMappingChart(byDocType) {
  destroyChart('mapping');
  const ctx = document.getElementById('chart-mapping');
  if (!ctx) return;
  CHARTS.mapping = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: byDocType.map(d => d.doc_type),
      datasets: [
        { label: '전체 필드', data: byDocType.map(d => d.total), backgroundColor: '#e0e7ff' },
        { label: '구현완료', data: byDocType.map(d => d.implemented), backgroundColor: '#7c3aed' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
      scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderAclChart(byGroup) {
  destroyChart('acl');
  const ctx = document.getElementById('chart-acl');
  if (!ctx) return;
  CHARTS.acl = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: byGroup.map(d => d.group_name),
      datasets: [
        { label: '전체 권한 규칙', data: byGroup.map(d => d.total), backgroundColor: '#dcfce7' },
        { label: '승인/적용', data: byGroup.map(d => d.covered), backgroundColor: '#16a34a' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
      scales: { x: { ticks: { font: { size: 10 } } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function renderModuleRiskChart(stats) {
  destroyChart('modules');
  const ctx = document.getElementById('chart-modules');
  if (!ctx) return;
  CHARTS.modules = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['심각(Critical)', '높음(High)', '중간(Medium)', '낮음(Low)'],
      datasets: [{
        data: [stats.critical || 0, stats.high || 0, stats.medium || 0, stats.low || 0],
        backgroundColor: ['#dc2626', '#ea580c', '#ca8a04', '#16a34a']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } }
    }
  });
}

// ============================================================
// 2) ROADMAP (Milestones + Tasks)
// ============================================================
async function renderRoadmap() {
  const milestones = await api('/milestones');
  const detailed = await Promise.all(milestones.map(m => api(`/milestones/${m.id}`)));
  const content = el('main-content');

  content.innerHTML = `
    <div class="fade-in space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-800"><i class="fas fa-calendar-days mr-2 text-blue-600"></i>3개월 로드맵</h2>
      </div>
      <div class="space-y-6">
        ${detailed.map(m => renderMilestoneCard(m)).join('')}
      </div>
    </div>
  `;

  detailed.forEach(m => {
    document.querySelectorAll(`.task-status[data-milestone="${m.id}"]`).forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const taskId = e.target.dataset.task;
        const task = m.tasks.find(t => t.id == taskId);
        await api(`/tasks/${taskId}`, { method: 'PUT', data: { ...task, status: e.target.value } });
        switchTab('roadmap');
      });
    });
  });
}

function renderMilestoneCard(m) {
  const doneCount = m.tasks.filter(t => t.status === 'completed').length;
  return `
    <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">${m.month_no}</span>
            <h3 class="font-bold text-slate-800">${m.title}</h3>
          </div>
          <p class="text-xs text-slate-500 mt-1 ml-9">${m.description || ''}</p>
        </div>
        <div class="flex items-center gap-2">
          ${badge(m.status)}
          <span class="text-xs text-slate-400">${m.start_date} ~ ${m.end_date}</span>
        </div>
      </div>
      <div class="ml-9 mb-4">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>진행률 · 태스크 ${doneCount}/${m.tasks.length} 완료</span>
          <span class="font-bold">${fmtPct(m.progress)}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${m.progress}%; background:${STATUS_COLORS[m.status] || '#94a3b8'}"></div></div>
      </div>
      <div class="table-wrap border border-slate-100">
        <table class="data-table">
          <thead><tr>
            <th>태스크</th><th>담당자</th><th>우선순위</th><th>기간</th><th>진행률</th><th>상태</th>
          </tr></thead>
          <tbody>
            ${m.tasks.map(t => `
              <tr>
                <td>
                  <div class="font-medium text-slate-700">${t.title}</div>
                  <div class="text-xs text-slate-400">${t.description || ''}</div>
                </td>
                <td>${t.owner || '-'}</td>
                <td>${badge(t.priority, PRIORITY_LABEL)}</td>
                <td class="text-xs text-slate-500 whitespace-nowrap">${t.start_date || '-'} ~ ${t.due_date || '-'}</td>
                <td>
                  <div class="w-24 progress-track"><div class="progress-fill" style="width:${t.progress}%; background:#2563eb"></div></div>
                  <span class="text-[11px] text-slate-400">${fmtPct(t.progress)}</span>
                </td>
                <td>
                  <select class="task-status text-xs border border-slate-200 rounded-lg px-2 py-1" data-milestone="${m.id}" data-task="${t.id}">
                    ${['pending','in_progress','completed','blocked'].map(s => `<option value="${s}" ${t.status===s?'selected':''}>${STATUS_LABEL[s]}</option>`).join('')}
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ============================================================
// 3) DEV MODULES
// ============================================================
async function renderModules() {
  const modules = await api('/dev-modules');
  const content = el('main-content');

  content.innerHTML = `
    <div class="fade-in space-y-6">
      <h2 class="text-lg font-bold text-slate-800"><i class="fas fa-diagram-project mr-2 text-indigo-600"></i>개발 모듈 백로그</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        ${modules.map(m => renderModuleCard(m)).join('')}
      </div>
    </div>
  `;

  modules.forEach(m => {
    const sel = document.querySelector(`.module-status[data-id="${m.id}"]`);
    if (sel) sel.addEventListener('change', async (e) => {
      await api(`/dev-modules/${m.id}`, { method: 'PUT', data: { ...m, status: e.target.value } });
      renderModules();
    });
  });
}

function renderModuleCard(m) {
  const catColor = { integration: 'bg-blue-50 text-blue-600', validation: 'bg-purple-50 text-purple-600', ui: 'bg-teal-50 text-teal-600', ai: 'bg-pink-50 text-pink-600' };
  return `
    <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div class="flex items-start justify-between gap-3 mb-2">
        <div>
          <span class="badge ${catColor[m.category] || 'bg-slate-50 text-slate-600'} mb-2">${CATEGORY_LABEL[m.category] || m.category}</span>
          <h3 class="font-bold text-slate-800">${m.name}</h3>
        </div>
        ${badge(m.risk_level, RISK_LABEL)}
      </div>
      <p class="text-xs text-slate-500 mb-3">${m.description || ''}</p>
      ${m.risk_note ? `<div class="text-xs bg-red-50 text-red-600 rounded-lg p-2 mb-3"><i class="fas fa-triangle-exclamation mr-1"></i>${m.risk_note}</div>` : ''}
      <div class="mb-3">
        <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>진행률</span><span class="font-bold">${fmtPct(m.progress)}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${m.progress}%; background:#4f46e5"></div></div>
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500">
        <span><i class="fas fa-user mr-1"></i>${m.owner || '미배정'} · ${m.planned_month ? m.planned_month+'개월차' : '-'}</span>
        <select class="module-status text-xs border border-slate-200 rounded-lg px-2 py-1" data-id="${m.id}">
          ${['backlog','design','in_progress','testing','done','at_risk'].map(s => `<option value="${s}" ${m.status===s?'selected':''}>${STATUS_LABEL[s]}</option>`).join('')}
        </select>
      </div>
    </section>
  `;
}

// ============================================================
// 4) SAP-TEEDY MAPPING
// ============================================================
async function renderMapping() {
  const mappings = await api('/mappings');
  const content = el('main-content');

  content.innerHTML = `
    <div class="fade-in space-y-6">
      <h2 class="text-lg font-bold text-slate-800"><i class="fas fa-arrows-left-right mr-2 text-purple-600"></i>SAP B1 ↔ Teedy 커스텀 메타데이터 매핑 정의서</h2>
      <div class="table-wrap bg-white rounded-2xl shadow-sm border border-slate-200">
        <table class="data-table">
          <thead><tr>
            <th>SAP 테이블</th><th>SAP 필드</th><th>설명</th><th>Teedy 메타데이터</th><th>타입</th>
            <th>문서유형</th><th>UNC 경로 패턴</th><th>필수</th><th>상태</th>
          </tr></thead>
          <tbody>
            ${mappings.map(m => `
              <tr>
                <td class="font-mono text-xs">${m.sap_table}</td>
                <td class="font-mono text-xs">${m.sap_field}</td>
                <td class="text-xs text-slate-500">${m.sap_field_desc || '-'}</td>
                <td class="font-semibold text-purple-700">${m.teedy_metadata_name}</td>
                <td class="text-xs">${m.teedy_metadata_type}</td>
                <td class="text-xs">${m.doc_type || '-'}</td>
                <td class="font-mono text-[11px] text-slate-500">${m.unc_path_pattern || '-'}</td>
                <td class="text-xs">${m.is_required ? '<i class="fas fa-check text-green-600"></i>' : '<i class="fas fa-minus text-slate-300"></i>'}</td>
                <td>${badge(m.mapping_status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================
// 5) ACL DESIGN
// ============================================================
async function renderAcl() {
  const rows = await api('/acl');
  const content = el('main-content');

  content.innerHTML = `
    <div class="fade-in space-y-6">
      <h2 class="text-lg font-bold text-slate-800"><i class="fas fa-shield-halved mr-2 text-green-600"></i>사용자/그룹/역할별 문서유형 접근 권한(ACL) 설계</h2>
      <div class="table-wrap bg-white rounded-2xl shadow-sm border border-slate-200">
        <table class="data-table">
          <thead><tr>
            <th>그룹</th><th>역할</th><th>문서유형</th>
            <th>읽기</th><th>쓰기</th><th>삭제</th><th>공유</th>
            <th>범위</th><th>상태</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td class="font-semibold">${r.group_name}</td>
                <td class="text-xs">${r.role_name}</td>
                <td class="text-xs">${r.doc_type}</td>
                <td>${permIcon(r.permission_read)}</td>
                <td>${permIcon(r.permission_write)}</td>
                <td>${permIcon(r.permission_delete)}</td>
                <td>${permIcon(r.permission_share)}</td>
                <td class="text-xs text-slate-500">${r.scope_note || '-'}</td>
                <td>${badge(r.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function permIcon(v) {
  return v ? '<i class="fas fa-check text-green-600"></i>' : '<i class="fas fa-xmark text-slate-300"></i>';
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderShell();
  switchTab('dashboard');
});
