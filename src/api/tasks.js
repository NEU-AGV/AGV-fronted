import api from '@/utils/request'

/**
 * 获取任务列表 (支持分页和筛选)
 * 也可用于获取指定月份的日历数据
 * @param {object} params - 包含分页和所有筛选条件的参数对象
 * e.g., { page: 1, pageSize: 10, taskName: '巡检', status: '进行中' }
 * e.g., { month: '2025-06' } for calendar view
 */
export const getTasks = (params) => {
    return api.get('/tasks', { params })
}

/**
 * 删除一个任务
 * @param {string} taskId - 任务的ID
 */
export const deleteTask = (taskId) => {
    return api.delete(`/tasks/${taskId}`)
}

/**
 * 导出任务数据
 * @param {object} params - 包含所有筛选条件的参数对象
 */
export const exportTasks = (params) => {
    return api.get('/tasks/export', { params, responseType: 'blob' })
}