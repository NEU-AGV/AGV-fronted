import api from '@/utils/request'

// ============================= 用户管理 =============================
/**
 * 获取用户列表 (分页+筛选)
 * @param {object} params
 */
export const getUsers = (params) => {
    return api.get('/system/users', { params })
}

/**
 * 新增用户
 * @param {object} data
 */
export const addUser = (data) => {
    return api.post('/system/users', data)
}

/**
 * 修改用户信息
 * @param {number} userId
 * @param {object} data
 */
export const updateUser = (userId, data) => {
    return api.put(`/system/users/${userId}`, data)
}

/**
 * 批量删除用户
 * @param {Array<number>} userIds
 */
export const deleteUsers = (userIds) => {
    return api.delete('/system/users', { data: userIds })
}

/**
 * 更新用户状态
 * @param {number} userId
 * @param {string} status
 */
export const updateUserStatus = (userId, status) => {
    return api.put(`/system/users/${userId}/status`, { status })
}


// ============================= 角色管理 =============================
/**
 * 获取角色列表
 * @param {object} params
 */
export const getRoles = (params) => {
    return api.get('/system/roles', { params })
}

/**
 * 新增角色
 * @param {object} data
 */
export const addRole = (data) => {
    return api.post('/system/roles', data)
}

/**
 * 修改角色信息
 * @param {number} roleId
 * @param {object} data
 */
export const updateRole = (roleId, data) => {
    return api.put(`/system/roles/${roleId}`, data)
}

/**
 * 删除角色
 * @param {number} roleId
 */
export const deleteRole = (roleId) => {
    return api.delete(`/system/roles/${roleId}`)
}

/**
 * 为角色分配权限
 * @param {number} roleId
 * @param {object} data - { menuIds: [...], dataScope: '...' }
 */
export const updateRolePermissions = (roleId, data) => {
    return api.put(`/system/roles/${roleId}/permissions`, data)
}


// ============================= 菜单管理 =============================
/**
 * 获取菜单树列表
 */
export const getMenus = () => {
    return api.get('/system/menus')
}

/**
 * 新增菜单
 * @param {object} data
 */
export const addMenu = (data) => {
    return api.post('/system/menus', data)
}

/**
 * 修改菜单
 * @param {number} menuId
 * @param {object} data
 */
export const updateMenu = (menuId, data) => {
    return api.put(`/system/menus/${menuId}`, data)
}

/**
 * 删除菜单
 * @param {number} menuId
 */
export const deleteMenu = (menuId) => {
    return api.delete(`/system/menus/${menuId}`)
}


// ============================= 部门管理 =============================
/**
 * 获取部门树列表
 */
export const getDepartments = () => {
    return api.get('/system/departments')
}

/**
 * 新增部门
 * @param {object} data
 */
export const addDepartment = (data) => {
    return api.post('/system/departments', data)
}

/**
 * 修改部门
 * @param {number} deptId
 * @param {object} data
 */
export const updateDepartment = (deptId, data) => {
    return api.put(`/system/departments/${deptId}`, data)
}

/**
 * 删除部门
 * @param {number} deptId
 */
export const deleteDepartment = (deptId) => {
    return api.delete(`/system/departments/${deptId}`)
}