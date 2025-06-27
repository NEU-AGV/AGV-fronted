import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义一个名为 'auth' 的 store
export const useAuthStore = defineStore('auth', () => {
    // --- State ---
    // token, 从本地存储中获取初始值
    const token = ref(localStorage.getItem('token') || '')
    // 用户信息, 初始为空对象
    const userInfo = ref({})

    // --- Getters ---
    // 计算属性，判断用户是否已登录
    const isLoggedIn = computed(() => !!token.value)
    // 计算属性，获取用户角色
    const userRole = computed(() => userInfo.value?.role || null)

    // --- Actions ---
    // 设置 token 并存入本地存储
    const setToken = (newToken) => {
        token.value = newToken
        localStorage.setItem('token', newToken)
    }

    // 设置用户信息
    const setUserInfo = (newUserInfo) => {
        userInfo.value = newUserInfo
    }

    // 清除认证信息 (用于退出登录)
    const clearAuth = () => {
        token.value = ''
        userInfo.value = {}
        localStorage.removeItem('token')
    }

    return {
        token,
        userInfo,
        isLoggedIn,
        userRole,
        setToken,
        setUserInfo,
        clearAuth
    }
}, {
    // 开启数据持久化
    // 注意：您之前的 main.js 中使用了 pinia-plugin-persistedstate，
    // 这种方式更简洁，但如果您没安装该插件，上面的 localStorage 写法也能工作。
    // 如果安装了，可以简化为：
    persist: true,
})