<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="sidebar-logo">
        AGV 巡线平台
      </div>
      <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
          background-color="#001529"
          text-color="rgba(255, 255, 255, 0.65)"
          active-text-color="#fff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>主页大屏</span>
        </el-menu-item>
        <el-menu-item index="/analysis">
          <el-icon><Odometer /></el-icon>
          <span>智能识别</span>
        </el-menu-item>
        <el-menu-item index="/ai-insights">
          <el-icon><MagicStick /></el-icon>
          <span>AI数据洞察</span>
        </el-menu-item>
        <el-menu-item index="/tasks">
          <el-icon><List /></el-icon>
          <span>任务管理</span>
        </el-menu-item>
        <el-menu-item index="/defects">
          <el-icon><Warning /></el-icon>
          <span>缺陷管理</span>
        </el-menu-item>
        <el-sub-menu index="/system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/user">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/system/role">
            <el-icon><Avatar /></el-icon>
            <span>角色管理</span>
          </el-menu-item>
          <el-menu-item index="/system/menu">
            <el-icon><Menu /></el-icon>
            <span>菜单管理</span>
          </el-menu-item>
          <el-menu-item index="/system/department">
            <el-icon><OfficeBuilding /></el-icon>
            <span>部门管理</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div>{{ route.meta.title }}</div>
        <div class="user-info">
          <el-dropdown>
      <span class="el-dropdown-link">
        欢迎您，Admin
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToProfile">个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { DataLine, List, Warning,ArrowDown,Odometer,MagicStick, Setting, User, Avatar, Menu, OfficeBuilding} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 计算属性，用于获取当前路由的路径，以高亮对应的菜单项
const activeMenu = computed(() => {
  return route.path
})
const goToProfile = () => {
  router.push('/profile/center');
}
// 退出登录方法
const logout = () => {
  authStore.clearAuth()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-aside {
  background-color: #001529;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  background-color: #002140;
}

.sidebar-menu {
  flex-grow: 1;
  border-right: none; /* 移除 el-menu 的默认右边框 */
}

.layout-header {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  background-color: #fff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
}

/* 页面切换动画 */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease-out;
}
</style>