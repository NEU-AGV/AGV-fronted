import api from '@/utils/request'

// 获取缺陷列表
export const getDefectList = (params) => {
    return api.get('/defects', { params })
}

// 可以在这里添加获取缺陷详情、更新状态等接口...