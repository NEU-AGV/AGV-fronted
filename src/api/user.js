import api from '@/utils/request'

/**
 * 登录接口
 * @param {object} data - 包含用户名、密码、验证码、UUID 的对象
 */
export const login = (data) => {
    return api.post('/login', data)
}

/**
 * 获取图形验证码
 * @returns {Promise<object>} - 包含验证码图片 (Base64) 和 UUID
 */
export const getCaptcha = () => {
    return api.get('/captcha')
}

/**
 * 注册接口
 * @param {object} data - 包含注册信息的对象
 */
export const register = (data) => {
    return api.post('/register', data)
}

/**
 * 发送邮箱验证码 (用于注册或找回密码)
 * @param {string} email - 目标邮箱地址
 */
export const sendEmailCode = (email) => {
    return api.post('/send-email-code', { email })
}


/**
 * 获取当前登录用户的信息
 * (登录成功后调用)
 */
export const getUserInfo = () => {
    return api.get('/user/profile')
}