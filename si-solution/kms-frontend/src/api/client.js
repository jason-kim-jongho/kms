import axios from 'axios'

// Spring Boot 백엔드 API base URL
// 개발 환경: 로컬 스프링부트(8080), 운영 환경에서는 배포 서버 주소로 교체
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const AUTH_STORAGE_KEY = 'miraejigi_auth'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터: 로그인 토큰을 Authorization 헤더에 첨부
// (Pinia store를 직접 import하면 초기화 순서 문제가 생길 수 있어 localStorage를 직접 참조)
apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    const auth = raw ? JSON.parse(raw) : null
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`
    }
  } catch {
    // ignore
  }
  return config
})

// 응답 인터셉터: ApiResponse{success,data,message} 언랩 + 401 처리(로그인 페이지 이동)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error?.response?.data || error.message)
    if (error?.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      if (!window.location.pathname.startsWith('/login')) {
        const next = encodeURIComponent(window.location.pathname)
        window.location.href = `/login?next=${next}`
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
export { API_BASE_URL }
