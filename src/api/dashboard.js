import api from '@/utils/request'

/**
 * 获取主页大屏的所有统计数据
 */
export const getDashboardStats = () => {
    return api.get('/dashboard/stats')
}