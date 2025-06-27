import api from '@/utils/request'

// 获取任务列表
export const getTaskList = (params) => {
    return api.get('/tasks', { params })
}

// 可以在这里添加获取任务详情、导出任务等接口...