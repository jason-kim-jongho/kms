import axios from 'axios'

// Spring Boot 백엔드 API base URL
// 개발 환경: 로컬 스프링부트(8080), 운영 환경에서는 배포 서버 주소로 교체
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 응답 인터셉터: ApiResponse{success,data,message} 언랩
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error?.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default apiClient
export { API_BASE_URL }
