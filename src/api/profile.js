import api from '@/utils/request'

/**
 * 获取当前登录用户的个人资料
 */
export const getProfile = () => {
    return api.get('/user/profile')
}

/**
 * 更新用户基本资料
 * @param {object} data - 包含 realName, phone, email, deptId 的对象
 */
export const updateProfile = (data) => {
    return api.put('/user/profile', data)
}

/**
 * 用户修改自己的密码
 * @param {object} data - 包含 oldPassword, newPassword 的对象
 */
export const updatePassword = (data) => {
    return api.put('/user/password', data)
}

/**
 * 用户上传新头像
 * @param {FormData} formData
 */
export const uploadAvatar = (formData) => {
    return api.post('/user/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}