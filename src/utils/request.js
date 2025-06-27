// src/utils/request.js
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

// 创建 axios 实例
const api = axios.create({
    baseURL: '/api',
    timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
    config => {
        const authStore = useAuthStore()

        // 如果存在 token，则为每个请求附带上 Authorization 请求头
        if (authStore.token) {
            config.headers.Authorization = `${authStore.token}`
        }

        // 关于 mailStore 的逻辑已全部移除

        return config
    },
    error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
    response => {
        const { code, data, message } = response.data

        if (code === 200) {
            // 如果 code 是 200，直接返回核心数据 data
            return data
        }

        if (code === 401) {
            // 处理 401 未授权错误
            handleUnauthorized(message)
            return Promise.reject(response.data)
        }

        // 其他业务错误，弹出消息提示
        ElMessage.error(message || '服务器开小差了~')
        return Promise.reject(response.data)
    },
    error => {
        // 处理网络错误或 401 状态码
        if (error.response?.status === 401) {
            handleUnauthorized(error.response.data?.message)
        } else {
            ElMessage.error(error.message || '网络异常')
        }
        return Promise.reject(error)
    }
)

// 统一处理未授权跳转
function handleUnauthorized(msg) {
    const authStore = useAuthStore()
    authStore.clearAuth()
    ElMessage.warning(msg || '登录已失效，请重新登录')
    if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
    }
}

export default api