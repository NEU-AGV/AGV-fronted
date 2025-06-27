import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 使用懒加载导入所有页面组件
const Login = () => import('@/views/Login.vue')
const Layout = () => import('@/views/Layout.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const TaskManagement = () => import('@/views/TaskManagement.vue')
const DefectManagement = () => import('@/views/DefectManagement.vue')
const PersonalCenter = () => import('@/views/profile/PersonalCenter.vue')
const IntelligentAnalysis = () => import('@/views/analysis/IntelligentAnalysis.vue'); // 1. 导入新组件
const AIInsights = () => import('@/views/ai/AIInsights.vue');
import UserManagement from '@/views/system/UserManagement.vue';
import RoleManagement from '@/views/system/RoleManagement.vue';
import MenuManagement from '@/views/system/MenuManagement.vue';
import DepartmentManagement from '@/views/system/DepartmentManagement.vue';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { title: '登录' }
    },
    {
        path: '/',
        component: Layout, // 使用主布局
        redirect: '/dashboard',
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard,
                meta: {
                    title: '主页大屏',
                    requiresAuth: true, // 需要登录才能访问
                    // 两种角色都可以访问
                    roles: ['Super Administrator', 'Inspection Administrator']
                }
            },
            {
                path: 'tasks',
                name: 'TaskManagement',
                component: TaskManagement,
                meta: {
                    title: '任务管理',
                    requiresAuth: true,
                    roles: ['Super Administrator', 'Inspection Administrator']
                }
            },
            {
                path: 'defects',
                name: 'DefectManagement',
                component: DefectManagement,
                meta: {
                    title: '缺陷管理',
                    requiresAuth: true,
                    roles: ['Super Administrator', 'Inspection Administrator']
                }
            },
            {
                path: '/system',
                redirect: '/system/user', // 默认重定向到用户管理
                meta: { title: '系统管理', requiresAuth: true, roles: ['Super Administrator'] },
                children: [
                    {
                        path: 'user',
                        name: 'SystemUser',
                        component: UserManagement,
                        meta: { title: '用户管理', requiresAuth: true, roles: ['Super Administrator'] }
                    },
                    {
                        path: 'role',
                        name: 'SystemRole',
                        component: RoleManagement,
                        meta: { title: '角色管理', requiresAuth: true, roles: ['Super Administrator'] }
                    },
                    {
                        path: 'menu',
                        name: 'SystemMenu',
                        component: MenuManagement,
                        meta: { title: '菜单管理', requiresAuth: true, roles: ['Super Administrator'] }
                    },
                    {
                        path: 'department',
                        name: 'SystemDepartment',
                        component: DepartmentManagement,
                        meta: { title: '部门管理', requiresAuth: true, roles: ['Super Administrator'] }
                    }
                ]
            },
            {
                path: 'profile/center',
                name: 'PersonalCenter',
                component: PersonalCenter,
                meta: {
                    title: '个人中心',
                    requiresAuth: true
                }
            },
            {
                path: 'ai-insights', // 2. 加入新路由
                name: 'AIInsights',
                component: AIInsights,
                meta: { title: 'AI数据洞察', requiresAuth: true }
            },
            {
                path: 'analysis', // 2. 加入新路由
                name: 'IntelligentAnalysis',
                component: IntelligentAnalysis,
                meta: { title: '智能识别', requiresAuth: true }
            },
        ]
    },
    // 匹配所有未定义的路由，并重定向到主页大屏
    {
        path: '/:pathMatch(.*)*',
        redirect: '/dashboard'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 全局前置守卫 (核心权限控制)
router.beforeEach((to, from, next) => {
    // 设置页面标题
    document.title = `${to.meta.title} - 地铁隧道巡线平台`

    /*
    // --- 开发期间暂时禁用以下权限代码 ---
    const auth = useAuthStore()

    // 1. 判断页面是否需要登录
    if (to.meta.requiresAuth) {
        // 2. 如果需要登录，但用户未登录
        if (!auth.isLoggedIn) {
            // 跳转到登录页，并携带目标路径，以便登录后跳回
            return next({ path: '/login', query: { redirect: to.fullPath } })
        }

        // 3. 如果用户已登录，判断角色权限
        const requiredRoles = to.meta.roles
        // 如果页面需要特定角色，并且当前用户的角色不在所需角色列表中
        if (requiredRoles && !requiredRoles.includes(auth.userRole)) {
            // 没有权限，跳转到主页大屏 (或一个专门的 403 页面)
            return next('/dashboard')
        }
    }
    // --- 开发期间暂时禁用以上权限代码 ---
    */

    // 在开发时，直接放行所有路由
    next()
})

export default router