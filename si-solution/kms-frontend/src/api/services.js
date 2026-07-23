import apiClient from './client'

// 공통 헬퍼: ApiResponse.data 추출
const unwrap = (res) => res.data.data

export const authApi = {
  login: (data) => apiClient.post('/api/auth/login', data).then(unwrap),
  logout: () => apiClient.post('/api/auth/logout').then(unwrap),
  me: () => apiClient.get('/api/auth/me').then(unwrap)
}

export const userApi = {
  list: () => apiClient.get('/api/users').then(unwrap),
  create: (data) => apiClient.post('/api/users', data).then(unwrap),
  update: (id, data) => apiClient.put(`/api/users/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/users/${id}`).then(unwrap)
}

export const pagePermissionApi = {
  pageCatalog: () => apiClient.get('/api/page-catalog').then(unwrap),
  list: (username) => apiClient.get('/api/page-permissions', { params: username ? { username } : {} }).then(unwrap),
  upsert: (data) => apiClient.put('/api/page-permissions', data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/page-permissions/${id}`).then(unwrap)
}

export const dashboardApi = {
  get: () => apiClient.get('/api/dashboard').then(unwrap)
}

export const documentsDashboardApi = {
  get: () => apiClient.get('/api/documents-dashboard').then(unwrap)
}

export const projectApi = {
  list: () => apiClient.get('/api/projects').then(unwrap),
  get: (id) => apiClient.get(`/api/projects/${id}`).then(unwrap),
  create: (data) => apiClient.post('/api/projects', data).then(unwrap),
  update: (id, data) => apiClient.put(`/api/projects/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/projects/${id}`).then(unwrap)
}

export const milestoneApi = {
  list: (projectId) => apiClient.get('/api/milestones', { params: projectId ? { projectId } : {} }).then(unwrap),
  get: (id) => apiClient.get(`/api/milestones/${id}`).then(unwrap),
  create: (data) => apiClient.post('/api/milestones', data).then(unwrap),
  update: (id, data) => apiClient.put(`/api/milestones/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/milestones/${id}`).then(unwrap)
}

export const taskApi = {
  list: (milestoneId) => apiClient.get('/api/tasks', { params: milestoneId ? { milestoneId } : {} }).then(unwrap),
  create: (data) => apiClient.post('/api/tasks', data).then(unwrap),
  update: (id, data) => apiClient.put(`/api/tasks/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/tasks/${id}`).then(unwrap)
}

export const devModuleApi = {
  list: () => apiClient.get('/api/dev-modules').then(unwrap),
  create: (data) => apiClient.post('/api/dev-modules', data).then(unwrap),
  update: (id, data) => apiClient.put(`/api/dev-modules/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/dev-modules/${id}`).then(unwrap)
}

export const mappingApi = {
  list: () => apiClient.get('/api/mappings').then(unwrap),
  create: (data) => apiClient.post('/api/mappings', data).then(unwrap),
  update: (id, data) => apiClient.put(`/api/mappings/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/mappings/${id}`).then(unwrap)
}

export const aclApi = {
  list: () => apiClient.get('/api/acl').then(unwrap),
  create: (data) => apiClient.post('/api/acl', data).then(unwrap),
  update: (id, data) => apiClient.put(`/api/acl/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/acl/${id}`).then(unwrap)
}

export const docCategoryApi = {
  list: () => apiClient.get('/api/doc-categories').then(unwrap)
}

export const documentApi = {
  list: (params = {}) => apiClient.get('/api/documents', { params }).then(unwrap),
  get: (id) => apiClient.get(`/api/documents/${id}`).then(unwrap),
  create: (data) => apiClient.post('/api/documents', data).then(unwrap),
  update: (id, data) => apiClient.put(`/api/documents/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/documents/${id}`).then(unwrap),
  uploadFile: (id, formData) => apiClient.post(`/api/documents/${id}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(unwrap),
  downloadFileUrl: (id, fileId) => `${apiClient.defaults.baseURL}/api/documents/${id}/files/${fileId}/content`,
  deleteFile: (id, fileId) => apiClient.delete(`/api/documents/${id}/files/${fileId}`).then(unwrap),
  createSapLink: (id, data) => apiClient.post(`/api/documents/${id}/sap-link`, data).then(unwrap)
}

export const sapLinkApi = {
  list: () => apiClient.get('/api/sap-links').then(unwrap)
}

export const sapLookupApi = {
  lookup: (table, docNum) => apiClient.get('/api/sap/lookup', { params: { table, doc_num: docNum } }).then(unwrap)
}

export const riskApi = {
  list: () => apiClient.get('/api/risks').then(unwrap),
  create: (data) => apiClient.post('/api/risks', data).then(unwrap),
  update: (id, data) => apiClient.put(`/api/risks/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/risks/${id}`).then(unwrap)
}

export const caseStudyApi = {
  list: () => apiClient.get('/api/case-studies').then(unwrap),
  create: (data) => apiClient.post('/api/case-studies', data).then(unwrap),
  update: (id, data) => apiClient.put(`/api/case-studies/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/case-studies/${id}`).then(unwrap)
}

export const certificationApi = {
  list: (partnerCode) => apiClient.get('/api/certifications', { params: partnerCode ? { partnerCode } : {} }).then(unwrap),
  create: (data) => apiClient.post('/api/certifications', data).then(unwrap),
  remove: (id) => apiClient.delete(`/api/certifications/${id}`).then(unwrap)
}
