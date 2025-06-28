import api from '@/utils/request'

/**
 * 获取缺陷列表 (支持分页和筛选)
 * @param {object} params - 包含分页和所有筛选条件的参数对象
 */
export const getDefects = (params) => {
    return api.get('/defects', { params })
}
/**
 * 新增：创建一条新的缺陷记录
 * @param {object} data - 完整的缺陷数据对象
 */
export const addDefect = (data) => {
    return api.post('/defects', data)
}
/**
 * 更新缺陷状态（例如：标记为已整改）
 * @param {string} defectId - 缺陷的ID
 * @param {object} data - 需要更新的数据，例如 { status: '已整改' }
 */
export const updateDefectStatus = (defectId, data) => {
    return api.put(`/defects/${defectId}/status`, data)
}

// 未来可以扩展其他接口
// export const getDefectDetail = (defectId) => api.get(`/defects/${defectId}`);
// export const deleteDefect = (defectId) => api.delete(`/defects/${defectId}`);