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

const LINK_STATUS_LABEL = { linked: '연계완료', missing: '누락', pending_review: '검토대기' };
const CERT_STATUS_LABEL = { active: '유효', expired: '만료', revoked: '철회' };
const FILE_TYPE_ICON = {
  IMAGE: 'fa-file-image text-purple-500', VIDEO: 'fa-file-video text-pink-500',
  DOCUMENT: 'fa-file-pdf text-red-500', OTHERS: 'fa-file text-slate-400'
};

let CHARTS = {};
let DOC_STATE = { categories: [], currentDocId: null };

function badge(status, labelMap = STATUS_LABEL) {
  const label = labelMap[status] || status;
  return `<span class="badge badge-${status}">${label}</span>`;
}

function fmtPct(v) {
  return `${Math.round(v || 0)}%`;
}

function fmtBytes(bytes) {
  bytes = bytes || 0;
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
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
  { key: 'documents', label: '문서관리', icon: 'fa-folder-open' },
  { key: 'sap-lookup', label: 'SAP 연계조회', icon: 'fa-link' },
  { key: 'certifications', label: '인증서관리', icon: 'fa-certificate' },
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
    else if (key === 'documents') await renderDocuments();
    else if (key === 'sap-lookup') await renderSapLookup();
    else if (key === 'certifications') await renderCertifications();
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

  const { project, risk, mapping, acl, documents } = data;
  const taskStats = project.task_stats || {};
  const moduleStats = risk.module_stats || {};
  const docLink = documents?.sap_link_stats || {};

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

      <!-- Document Management KPI Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${kpiCard('문서관리(DMS) 문서수', `${documents?.total_documents || 0}건`, 'fa-folder-open', 'blue',
          `첨부파일 ${documents?.total_files || 0}건 · ${fmtBytes(documents?.total_size_bytes || 0)}`)}
        ${kpiCard('SAP B1 연계율', fmtPct(documents?.sap_link_rate || 0), 'fa-link', 'purple',
          `연계 ${docLink.linked || 0} · 미연계 ${docLink.missing || 0} · 검토대기 ${docLink.pending_review || 0}`)}
        ${kpiCard('미연계(Missing) 문서', `${(documents?.missing_documents || []).length}건`, 'fa-triangle-exclamation', 'red',
          `SAP 전표 매칭 실패 건 · 즉시 확인 필요`)}
        ${kpiCard('만료 예정 인증서', `${(documents?.expiring_certifications || []).length}건`, 'fa-certificate', 'orange',
          `90일 이내 만료 예정`)}
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

      <!-- Document management summary -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-triangle-exclamation mr-2 text-red-600"></i>SAP 미연계(Missing) 문서</h2>
          <div class="space-y-2" id="dash-missing-docs"></div>
        </section>
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 class="font-bold text-slate-800 mb-4"><i class="fas fa-certificate mr-2 text-orange-600"></i>만료 예정 인증서 (90일 이내)</h2>
          <div class="space-y-2" id="dash-expiring-certs"></div>
        </section>
      </div>
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

  // Document management summary lists
  const missingDocs = documents?.missing_documents || [];
  el('dash-missing-docs').innerHTML = missingDocs.length
    ? missingDocs.map(d => `
        <div class="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50">
          <div>
            <span class="text-sm font-semibold text-slate-700">${d.title}</span>
            <p class="text-[11px] text-slate-500 mt-0.5">${d.business_partner_name || '-'} · ${d.sap_table || ''} ${d.sap_doc_num || ''}</p>
          </div>
          ${badge('missing', LINK_STATUS_LABEL)}
        </div>
      `).join('')
    : `<p class="text-sm text-slate-400">미연계 문서 없음</p>`;

  const expCerts = documents?.expiring_certifications || [];
  el('dash-expiring-certs').innerHTML = expCerts.length
    ? expCerts.map(cert => {
        const days = dayjs(cert.expiry_date).diff(dayjs(), 'day');
        return `
        <div class="flex items-center justify-between p-3 rounded-xl border border-orange-100 bg-orange-50">
          <div>
            <span class="text-sm font-semibold text-slate-700">${cert.cert_type}</span>
            <p class="text-[11px] text-slate-500 mt-0.5">${cert.business_partner_name || '-'} · 만료일 ${cert.expiry_date}</p>
          </div>
          <span class="text-xs font-bold ${days <= 0 ? 'text-red-600' : 'text-orange-600'}">${days <= 0 ? '만료됨' : `D-${days}`}</span>
        </div>`;
      }).join('')
    : `<p class="text-sm text-slate-400">만료 예정 인증서 없음</p>`;
}

function kpiCard(title, value, icon, color, sub) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600', green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600'
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
// DOCUMENT MANAGEMENT (문서관리)
// ============================================================
async function renderDocuments() {
  const [dashboard, categories, docs] = await Promise.all([
    api('/documents-dashboard'), api('/doc-categories'), api('/documents')
  ]);
  DOC_STATE.categories = categories;
  const content = el('main-content');

  const sizeGB = (dashboard.total_size_bytes / (1024 * 1024)).toFixed(1);

  content.innerHTML = `
    <div class="fade-in space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <h2 class="text-lg font-bold text-slate-800"><i class="fas fa-folder-open mr-2 text-blue-600"></i>문서관리 (SAP B1 연계)</h2>
        <button id="btn-new-doc" class="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <i class="fas fa-plus mr-1.5"></i>신규 문서 등록
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${kpiCard('전체 문서', `${dashboard.total_documents}건`, 'fa-folder', 'blue', `첨부파일 ${dashboard.total_files}개 · ${sizeGB}MB`)}
        ${kpiCard('SAP 연계완료', `${dashboard.sap_link_stats?.linked || 0}건`, 'fa-link', 'green', `전체 ${dashboard.sap_link_stats?.total || 0}건 중`)}
        ${kpiCard('누락 문서', `${dashboard.missing_documents.length}건`, 'fa-triangle-exclamation', 'red', `SAP 전표 대비 미확인`)}
        ${kpiCard('만료 예정 인증서', `${dashboard.expiring_certifications.length}건`, 'fa-certificate', 'purple', `90일 이내 만료`)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:col-span-1">
          <h3 class="font-bold text-slate-800 mb-3 text-sm"><i class="fas fa-chart-pie mr-2 text-indigo-600"></i>문서유형별 현황</h3>
          <div class="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            ${dashboard.by_category.map(cat => `
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600">${cat.category_name}</span>
                <span class="font-bold text-slate-800">${cat.cnt}건</span>
              </div>
            `).join('')}
          </div>
        </section>
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
          <h3 class="font-bold text-slate-800 mb-3 text-sm"><i class="fas fa-triangle-exclamation mr-2 text-red-600"></i>SAP 전표 누락 문서</h3>
          ${dashboard.missing_documents.length ? `
            <div class="table-wrap border border-slate-100">
              <table class="data-table">
                <thead><tr><th>SAP 테이블</th><th>전표번호</th><th>문서제목</th><th>비고</th></tr></thead>
                <tbody>
                  ${dashboard.missing_documents.map(m => `
                    <tr><td class="font-mono text-xs">${m.sap_table}</td><td>${m.sap_doc_num}</td><td>${m.title}</td><td class="text-xs text-slate-500">${m.notes || ''}</td></tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `<p class="text-sm text-slate-400">누락 문서 없음</p>`}
        </section>
      </div>

      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <select id="doc-filter-category" class="text-sm border border-slate-200 rounded-lg px-3 py-2">
            <option value="">전체 유형</option>
            ${categories.map(cat => `<option value="${cat.category_code}">${cat.category_name}</option>`).join('')}
          </select>
          <input id="doc-filter-keyword" type="text" placeholder="문서명 / File No. / 거래처명 검색" class="text-sm border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[220px]">
          <button id="btn-doc-search" class="bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            <i class="fas fa-search mr-1"></i>검색
          </button>
        </div>
        <div id="doc-list-wrap"></div>
      </section>
    </div>

    <!-- New Document Modal -->
    <div id="doc-modal" class="fixed inset-0 bg-black/40 z-30 hidden items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="font-bold text-slate-800 mb-4">신규 문서 등록</h3>
        <div class="space-y-3 text-sm">
          <div>
            <label class="block text-xs text-slate-500 mb-1">문서 제목 *</label>
            <input id="new-doc-title" class="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="예: 삼성전자(주) 매입 세금계산서 2026-08">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">문서유형 *</label>
            <select id="new-doc-category" class="w-full border border-slate-200 rounded-lg px-3 py-2">
              ${categories.map(cat => `<option value="${cat.category_code}" data-doctype="${cat.category_name}">${cat.category_name}</option>`).join('')}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-500 mb-1">거래처 코드</label>
              <input id="new-doc-partner-code" class="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="V10001">
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">거래처명</label>
              <input id="new-doc-partner-name" class="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="삼성전자(주)">
            </div>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">File No. (Teedy 메타데이터)</label>
            <input id="new-doc-fileno" class="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="AP-100236">
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">비고</label>
            <textarea id="new-doc-remark" class="w-full border border-slate-200 rounded-lg px-3 py-2" rows="2"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button id="btn-doc-cancel" class="px-4 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-100">취소</button>
          <button id="btn-doc-submit" class="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold">등록</button>
        </div>
      </div>
    </div>

    <!-- Document Detail Modal -->
    <div id="doc-detail-modal" class="fixed inset-0 bg-black/40 z-30 hidden items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div id="doc-detail-body"></div>
        <div class="flex justify-end mt-5">
          <button id="btn-doc-detail-close" class="px-4 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-100">닫기</button>
        </div>
      </div>
    </div>
  `;

  await loadDocumentList();

  el('btn-new-doc').addEventListener('click', () => toggleModal('doc-modal', true));
  el('btn-doc-cancel').addEventListener('click', () => toggleModal('doc-modal', false));
  el('btn-doc-detail-close').addEventListener('click', () => toggleModal('doc-detail-modal', false));
  el('btn-doc-search').addEventListener('click', loadDocumentList);
  el('doc-filter-keyword').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadDocumentList(); });

  el('btn-doc-submit').addEventListener('click', async () => {
    const title = el('new-doc-title').value.trim();
    const categorySelect = el('new-doc-category');
    const categoryCode = categorySelect.value;
    const docType = categorySelect.selectedOptions[0].dataset.doctype;
    if (!title) { alert('문서 제목을 입력하세요.'); return; }
    try {
      const result = await api('/documents', { method: 'POST', data: {
        title, category_code: categoryCode, doc_type: docType,
        business_partner_code: el('new-doc-partner-code').value.trim() || null,
        business_partner_name: el('new-doc-partner-name').value.trim() || null,
        file_no: el('new-doc-fileno').value.trim() || null,
        remark: el('new-doc-remark').value.trim() || null,
        post_user_id: 'web_user', post_user_name: '웹 사용자'
      }});
      toggleModal('doc-modal', false);
      await loadDocumentList();
      await openDocumentDetail(result.id);
    } catch (e) {
      alert('등록 실패: ' + e.message);
    }
  });
}

function toggleModal(id, show) {
  const modal = el(id);
  modal.classList.toggle('hidden', !show);
  modal.classList.toggle('flex', show);
}

async function loadDocumentList() {
  const category = el('doc-filter-category')?.value || '';
  const keyword = el('doc-filter-keyword')?.value || '';
  const params = new URLSearchParams();
  if (category) params.set('category_code', category);
  if (keyword) params.set('keyword', keyword);
  const docs = await api(`/documents?${params.toString()}`);
  const wrap = el('doc-list-wrap');
  if (!wrap) return;

  wrap.innerHTML = docs.length ? `
    <div class="table-wrap border border-slate-100">
      <table class="data-table">
        <thead><tr>
          <th>문서제목</th><th>유형</th><th>거래처</th><th>File No.</th><th>SAP 연계</th><th>파일수</th><th>등록일</th><th></th>
        </tr></thead>
        <tbody>
          ${docs.map(d => `
            <tr class="cursor-pointer doc-row" data-id="${d.id}">
              <td class="font-medium text-slate-700">${d.title}</td>
              <td class="text-xs">${d.category_name || d.category_code}</td>
              <td class="text-xs">${d.business_partner_name || '-'}</td>
              <td class="font-mono text-xs text-purple-700">${d.file_no || '-'}</td>
              <td>${d.sap_link_status ? badge(d.sap_link_status, LINK_STATUS_LABEL) : '<span class="text-xs text-slate-300">-</span>'}</td>
              <td class="text-xs text-center">${d.file_count}</td>
              <td class="text-xs text-slate-400 whitespace-nowrap">${(d.post_date || '').substring(0, 10)}</td>
              <td><button class="text-blue-600 text-xs font-semibold doc-open-btn" data-id="${d.id}">상세보기</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : `<p class="text-sm text-slate-400 py-8 text-center">등록된 문서가 없습니다.</p>`;

  wrap.querySelectorAll('.doc-row, .doc-open-btn').forEach(elm => {
    elm.addEventListener('click', (e) => {
      e.stopPropagation();
      openDocumentDetail(elm.dataset.id);
    });
  });
}

async function openDocumentDetail(docId) {
  DOC_STATE.currentDocId = docId;
  const doc = await api(`/documents/${docId}`);
  const body = el('doc-detail-body');

  body.innerHTML = `
    <div class="flex items-start justify-between mb-4">
      <div>
        <h3 class="font-bold text-slate-800 text-lg">${doc.title}</h3>
        <p class="text-xs text-slate-400 mt-1">스토리지ID: ${doc.storage_id} · File No: ${doc.file_no || '-'}</p>
      </div>
      ${doc.sap_links?.length ? badge(doc.sap_links[0].link_status, LINK_STATUS_LABEL) : ''}
    </div>

    <div class="grid grid-cols-2 gap-3 text-sm mb-5 bg-slate-50 rounded-xl p-4">
      <div><span class="text-slate-400">거래처</span><div class="font-medium">${doc.business_partner_name || '-'} (${doc.business_partner_code || '-'})</div></div>
      <div><span class="text-slate-400">등록자</span><div class="font-medium">${doc.post_user_name || '-'}</div></div>
      <div><span class="text-slate-400">등록일</span><div class="font-medium">${(doc.post_date||'').substring(0,19)}</div></div>
      <div><span class="text-slate-400">비고</span><div class="font-medium">${doc.remark || '-'}</div></div>
    </div>

    <div class="mb-5">
      <h4 class="text-sm font-bold text-slate-700 mb-2"><i class="fas fa-paperclip mr-1.5"></i>첨부 파일 (${doc.files.length})</h4>
      <div id="doc-file-list" class="space-y-2 mb-3">
        ${doc.files.map(f => `
          <div class="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
            <div class="flex items-center gap-2 text-sm">
              <i class="fas ${(FILE_TYPE_ICON[f.file_type]||FILE_TYPE_ICON.OTHERS)}"></i>
              <span>${f.original_file_name}</span>
              <span class="text-xs text-slate-400">${(f.file_size/1024).toFixed(0)}KB</span>
            </div>
            <div class="flex items-center gap-3">
              <a href="/api/documents/${doc.id}/files/${f.id}/content" target="_blank" class="text-blue-600 text-xs font-semibold"><i class="fas fa-download mr-1"></i>다운로드</a>
              <button class="text-red-500 text-xs font-semibold doc-file-delete" data-file-id="${f.id}"><i class="fas fa-trash mr-1"></i>삭제</button>
            </div>
          </div>
        `).join('') || '<p class="text-xs text-slate-400">첨부된 파일이 없습니다.</p>'}
      </div>
      <div id="doc-drop-zone" class="doc-drop-zone p-4 text-center text-sm text-slate-400 cursor-pointer">
        <i class="fas fa-cloud-arrow-up text-xl mb-1"></i>
        <p>클릭하여 파일 선택 (PDF, 이미지, 문서 등)</p>
        <input type="file" id="doc-file-input" class="hidden" multiple>
      </div>
    </div>

    <div class="mb-2">
      <h4 class="text-sm font-bold text-slate-700 mb-2"><i class="fas fa-link mr-1.5"></i>SAP 전표 연계</h4>
      ${doc.sap_links?.length ? `
        <div class="space-y-1.5 mb-3">
          ${doc.sap_links.map(sl => `
            <div class="flex items-center justify-between text-xs bg-slate-50 rounded-lg p-2">
              <span class="font-mono">${sl.sap_table} / ${sl.sap_doc_num} (${sl.sap_card_code||'-'})</span>
              ${badge(sl.link_status, LINK_STATUS_LABEL)}
            </div>
          `).join('')}
        </div>
      ` : '<p class="text-xs text-slate-400 mb-3">SAP 연계 정보가 없습니다.</p>'}
      <div class="flex gap-2">
        <input id="sap-link-table" placeholder="테이블(OPCH 등)" class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 w-28">
        <input id="sap-link-docnum" placeholder="전표번호" class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 flex-1">
        <button id="btn-sap-link-add" class="text-xs bg-slate-700 text-white rounded-lg px-3 py-1.5 font-semibold">연계추가</button>
      </div>
    </div>
  `;

  toggleModal('doc-detail-modal', true);

  el('doc-drop-zone').addEventListener('click', () => el('doc-file-input').click());
  el('doc-file-input').addEventListener('change', async (e) => {
    await uploadDocFiles(docId, e.target.files);
  });
  body.querySelectorAll('.doc-file-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('파일을 삭제하시겠습니까?')) return;
      await api(`/documents/${docId}/files/${btn.dataset.fileId}`, { method: 'DELETE' });
      await openDocumentDetail(docId);
    });
  });
  el('btn-sap-link-add').addEventListener('click', async () => {
    const table = el('sap-link-table').value.trim();
    const docNum = el('sap-link-docnum').value.trim();
    if (!table || !docNum) { alert('테이블과 전표번호를 입력하세요.'); return; }
    await api(`/documents/${docId}/sap-link`, { method: 'POST', data: { sap_table: table, sap_doc_num: docNum, link_status: 'linked', linked_by: 'web_user' } });
    await openDocumentDetail(docId);
  });
}

async function uploadDocFiles(docId, fileListObj) {
  if (!fileListObj.length) return;
  const formData = new FormData();
  for (const f of fileListObj) formData.append('file', f);
  try {
    await axios.post(`/api/documents/${docId}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    await openDocumentDetail(docId);
    await loadDocumentList();
  } catch (e) {
    alert('업로드 실패: ' + (e.response?.data?.error || e.message));
  }
}

// ============================================================
// SAP 연계조회 (SAP B1 Service Layer 조회 시뮬레이션)
// ============================================================
async function renderSapLookup() {
  const links = await api('/sap-links');
  const content = el('main-content');

  content.innerHTML = `
    <div class="fade-in space-y-6">
      <h2 class="text-lg font-bold text-slate-800"><i class="fas fa-link mr-2 text-blue-600"></i>SAP B1 연계조회</h2>

      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 class="font-bold text-slate-800 mb-3 text-sm">SAP B1 전표 직접 조회 (Service Layer)</h3>
        <p class="text-xs text-slate-400 mb-3">
          <i class="fas fa-circle-info mr-1"></i>
          현재는 SAP Service Layer 연동 대기 상태로 mock 데이터를 반환합니다. 운영 환경에서는 서버 <code class="bg-slate-100 px-1 rounded">/api/sap/lookup</code>
          가 실제 SAP B1 Service Layer(Login → GET {table})를 호출하도록 교체하면 됩니다.
        </p>
        <div class="flex flex-wrap gap-2 mb-4">
          <select id="sap-lookup-table" class="text-sm border border-slate-200 rounded-lg px-3 py-2">
            <option value="OPCH">OPCH (매입 세금계산서)</option>
            <option value="OINV">OINV (매출 세금계산서)</option>
            <option value="OPOR">OPOR (발주서)</option>
            <option value="ORDR">ORDR (수주서)</option>
            <option value="OPDN">OPDN (입고증/GRPO)</option>
          </select>
          <input id="sap-lookup-docnum" placeholder="전표번호 입력 (예: 100234)" class="text-sm border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <button id="btn-sap-lookup" class="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            <i class="fas fa-magnifying-glass mr-1"></i>조회
          </button>
        </div>
        <div id="sap-lookup-result"></div>
      </section>

      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 class="font-bold text-slate-800 mb-3 text-sm">문서-SAP 전표 연계 현황 전체</h3>
        <div class="table-wrap border border-slate-100">
          <table class="data-table">
            <thead><tr><th>문서제목</th><th>File No.</th><th>SAP 테이블</th><th>전표번호</th><th>거래처</th><th>상태</th><th>연계일시</th></tr></thead>
            <tbody>
              ${links.map(l => `
                <tr>
                  <td>${l.title}</td>
                  <td class="font-mono text-xs text-purple-700">${l.file_no || '-'}</td>
                  <td class="font-mono text-xs">${l.sap_table}</td>
                  <td>${l.sap_doc_num}</td>
                  <td class="text-xs">${l.sap_card_code || '-'}</td>
                  <td>${badge(l.link_status, LINK_STATUS_LABEL)}</td>
                  <td class="text-xs text-slate-400">${l.linked_at ? l.linked_at.substring(0,19) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  el('btn-sap-lookup').addEventListener('click', async () => {
    const table = el('sap-lookup-table').value;
    const docNum = el('sap-lookup-docnum').value.trim();
    if (!docNum) { alert('전표번호를 입력하세요.'); return; }
    const resultDiv = el('sap-lookup-result');
    resultDiv.innerHTML = `<div class="text-center py-6 text-slate-400"><i class="fas fa-spinner fa-spin"></i></div>`;
    try {
      const data = await api(`/sap/lookup?table=${table}&doc_num=${encodeURIComponent(docNum)}`);
      resultDiv.innerHTML = `
        <div class="bg-slate-50 rounded-xl p-4 text-sm">
          <div class="text-xs text-amber-600 mb-2"><i class="fas fa-flask mr-1"></i>${data.source}</div>
          <div class="grid grid-cols-2 gap-2">
            <div><span class="text-slate-400">DocEntry</span><div class="font-medium">${data.DocEntry}</div></div>
            <div><span class="text-slate-400">DocNum</span><div class="font-medium">${data.DocNum}</div></div>
            <div><span class="text-slate-400">CardCode</span><div class="font-medium">${data.CardCode}</div></div>
            <div><span class="text-slate-400">CardName</span><div class="font-medium">${data.CardName}</div></div>
            <div><span class="text-slate-400">DocDate</span><div class="font-medium">${data.DocDate}</div></div>
            <div><span class="text-slate-400">DocTotal</span><div class="font-medium">${Number(data.DocTotal).toLocaleString()}</div></div>
          </div>
        </div>
      `;
    } catch (e) {
      resultDiv.innerHTML = `<div class="text-sm text-red-500">${e.message}</div>`;
    }
  });
}

// ============================================================
// 인증서관리 (협력사 인증서 - scm_solution CertModule 계승)
// ============================================================
async function renderCertifications() {
  const certs = await api('/certifications');
  const content = el('main-content');

  const today = dayjs();
  content.innerHTML = `
    <div class="fade-in space-y-6">
      <h2 class="text-lg font-bold text-slate-800"><i class="fas fa-certificate mr-2 text-purple-600"></i>인증서관리 (협력사)</h2>
      <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div class="table-wrap border border-slate-100">
          <table class="data-table">
            <thead><tr>
              <th>거래처</th><th>인증서 종류</th><th>발행일</th><th>만료일</th><th>D-day</th><th>비고</th><th>상태</th>
            </tr></thead>
            <tbody>
              ${certs.map(c => {
                let dday = '-';
                let ddayClass = 'text-slate-400';
                if (c.expiry_date) {
                  const diff = dayjs(c.expiry_date).diff(today, 'day');
                  dday = diff >= 0 ? `D-${diff}` : `만료 ${Math.abs(diff)}일 경과`;
                  ddayClass = diff < 0 ? 'text-red-600 font-bold' : diff <= 90 ? 'text-orange-500 font-bold' : 'text-slate-500';
                }
                return `
                  <tr>
                    <td class="font-medium">${c.business_partner_name || c.business_partner_code}</td>
                    <td class="text-xs">${c.cert_type}</td>
                    <td class="text-xs">${c.issue_date || '-'}</td>
                    <td class="text-xs">${c.expiry_date || '-'}</td>
                    <td class="text-xs ${ddayClass}">${dday}</td>
                    <td class="text-xs text-slate-500">${c.remark || '-'}</td>
                    <td>${badge(c.status, CERT_STATUS_LABEL)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
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
