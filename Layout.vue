<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="tech-aside">
      <div class="sidebar-logo">
        <span class="logo-text">AGV 巡线平台</span>
        <div class="logo-line"></div>
      </div>
      <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
          background-color="#0a0f2e"
          text-color="#a7b1d4"
          active-text-color="#4db8ff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>主页大屏</span>
          <div class="menu-item-line"></div>
        </el-menu-item>
        <el-menu-item index="/analysis">
          <el-icon><Odometer /></el-icon>
          <span>智能识别</span>
          <div class="menu-item-line"></div>
        </el-menu-item>
        <el-menu-item index="/ai-insights">
          <el-icon><MagicStick /></el-icon>
          <span>AI数据洞察</span>
          <div class="menu-item-line"></div>
        </el-menu-item>
        <el-menu-item index="/tasks">
          <el-icon><List /></el-icon>
          <span>任务管理</span>
          <div class="menu-item-line"></div>
        </el-menu-item>
        <el-menu-item index="/defects">
          <el-icon><Warning /></el-icon>
          <span>缺陷管理</span>
          <div class="menu-item-line"></div>
        </el-menu-item>
        <el-sub-menu index="/system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <template #title-extra>
            <div class="menu-item-line"></div>
          </template>
          <el-menu-item index="/system/user">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
            <div class="menu-item-line"></div>
          </el-menu-item>
          <el-menu-item index="/system/role">
            <el-icon><Avatar /></el-icon>
            <span>角色管理</span>
            <div class="menu-item-line"></div>
          </el-menu-item>
          <el-menu-item index="/system/menu">
            <el-icon><Menu /></el-icon>
            <span>菜单管理</span>
            <div class="menu-item-line"></div>
          </el-menu-item>
          <el-menu-item index="/system/department">
            <el-icon><OfficeBuilding /></el-icon>
            <span>部门管理</span>
            <div class="menu-item-line"></div>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container class="tech-main-container">
      <el-header class="layout-header tech-header">
        <div class="header-title">
          <el-icon class="title-icon">
            <component :is="getRouteIcon(route.path)" />
          </el-icon>
          <span>{{ route.meta.title }}</span>
        </div>
        <div class="user-info-container">
          <div class="user-info">
            <el-dropdown>
              <span class="el-dropdown-link">
                <span class="welcome-text">欢迎您，</span>
                <span class="username">Admin</span>
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu class="tech-dropdown">
                  <el-dropdown-item @click="goToProfile" class="tech-dropdown-item">
                    <el-icon><User /></el-icon>
                    <span>个人中心</span>
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="logout" class="tech-dropdown-item">
                    <el-icon><SwitchButton /></el-icon>
                    <span>退出登录</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-main class="layout-main tech-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
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
import { 
  DataLine, List, Warning, ArrowDown, Odometer, 
  MagicStick, Setting, User, Avatar, Menu, 
  OfficeBuilding, SwitchButton 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const getRouteIcon = (path) => {
  const iconMap = {
    '/dashboard': DataLine,
    '/analysis': Odometer,
    '/ai-insights': MagicStick,
    '/tasks': List,
    '/defects': Warning,
    '/system': Setting,
    '/system/user': User,
    '/system/role': Avatar,
    '/system/menu': Menu,
    '/system/department': OfficeBuilding
  }
  
  const sortedPaths = Object.keys(iconMap).sort((a, b) => b.length - a.length);
  const matchedPath = sortedPaths.find(key => path.startsWith(key));
  return iconMap[matchedPath] || DataLine;
}

const activeMenu = computed(() => {
  return route.path
})

const goToProfile = () => {
  router.push('/profile/center')
}

const logout = () => {
  authStore.clearAuth()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background-color: #0d1226;
}

/* 侧边栏科技感样式 */
.tech-aside {
  background: linear-gradient(135deg, #070b1d 0%, #121731 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.4);
  transition: all 0.3s;
}

.tech-aside:hover {
  box-shadow: 4px 0 20px rgba(77, 184, 255, 0.4);
}

.tech-aside::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 1px;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    rgba(77, 184, 255, 0.5) 50%, 
    transparent 100%);
}

.sidebar-logo {
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  position: relative;
  padding: 0 20px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(90deg, #4db8ff 0%, #6a5acd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}

.logo-line {
  height: 2px;
  width: 80%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(77, 184, 255, 0.8) 50%, 
    transparent 100%);
}

.sidebar-menu {
  flex-grow: 1;
  border-right: none;
  padding: 10px 0;
}

.sidebar-menu .el-menu-item,
.sidebar-menu .el-sub-menu__title {
  height: 50px;
  line-height: 50px;
  margin: 5px 10px;
  border-radius: 4px;
  transition: all 0.3s;
  position: relative;
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-sub-menu__title:hover {
  background-color: rgba(77, 184, 255, 0.15) !important;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: rgba(77, 184, 255, 0.25) !important;
  box-shadow: 0 0 12px rgba(77, 184, 255, 0.4);
}

.menu-item-line {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #4db8ff, #6a5acd);
  transition: width 0.3s;
}

.sidebar-menu .el-menu-item:hover .menu-item-line,
.sidebar-menu .el-menu-item.is-active .menu-item-line,
.sidebar-menu .el-sub-menu__title:hover .menu-item-line {
  width: 100%;
}

/* 头部科技感样式 */
.tech-header {
  background: linear-gradient(90deg, #070b1d 0%, #121731 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 5;
  border-bottom: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
}

.tech-header::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(77, 184, 255, 0.8) 50%, 
    transparent 100%);
}

.header-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
}

.title-icon {
  margin-right: 12px;
  font-size: 20px;
  color: #4db8ff;
}

.user-info-container {
  display: flex;
  justify-content: flex-end;
  flex: 1;
}

.user-info {
  position: relative;
  padding: 5px 15px;
  border-radius: 20px;
  background: rgba(77, 184, 255, 0.15);
  border: 1px solid rgba(77, 184, 255, 0.3);
  transition: all 0.3s;
}

.user-info:hover {
  background: rgba(77, 184, 255, 0.25);
  box-shadow: 0 0 12px rgba(77, 184, 255, 0.3);
}

.el-dropdown-link {
  color: #fff;
  display: flex;
  align-items: center;
  font-size: 14px;
  cursor: pointer;
}

.welcome-text {
  color: #b8c2e0;
  margin-right: 5px;
}

.username {
  font-weight: 500;
  color: #4db8ff;
}

.el-icon--right {
  margin-left: 5px;
  color: #4db8ff;
  transition: transform 0.3s;
}

.el-dropdown:hover .el-icon--right {
  transform: rotate(180deg);
}

/* 主内容区科技感样式 */
.tech-main {
  background: linear-gradient(135deg, #0f142a 0%, #161b38 100%);
  padding: 20px;
  position: relative;
  overflow: auto;
}

.tech-main::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 10px;
  background: linear-gradient(to bottom, 
    rgba(77, 184, 255, 0.3) 0%, 
    transparent 100%);
}

 /* 下拉菜单科技感样式 - 重点优化部分 */
 .tech-dropdown {
    background: #121731;
    border: 1px solid rgba(77, 184, 255, 0.4);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    border-radius: 6px;
    padding: 5px 0;
    min-width: 150px;
    overflow: hidden;
    position: relative;
  }

  .tech-dropdown::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #4db8ff, #6a5acd);
  }

  .tech-dropdown-item {
    color: #c5cbe5;
    padding: 10px 20px;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    margin: 0 5px;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    border: 1px solid transparent; /* 预留边框位置 */
  }

  /* 悬停效果 - 改为发光边框和位移 */
  .tech-dropdown-item:not(.is-disabled):hover {
    border-color: rgba(77, 184, 255, 0.8) !important; /* 蓝色边框 */
    box-shadow: 0 0 10px rgba(77, 184, 255, 0.5) !important; /* 发光效果 */
    transform: translateX(3px) !important; /* 右移效果 */
    color: #4db8ff !important; /* 文字变亮蓝色 */
  }

  /* 选中状态 - 仅文字变色，移除背景色 */
  .tech-dropdown-item.is-selected,
  .tech-dropdown-item.is-selected:hover {
    border-color: rgba(77, 184, 255, 0.8) !important;
    box-shadow: 0 0 15px rgba(77, 184, 255, 0.7) !important;
    transform: translateX(3px) !important;
    color: #4db8ff !important;
    font-weight: 500 !important;
    background: transparent !important; /* 移除背景色 */
  }

  /* 点击效果 - 添加内阴影高亮 */
  .tech-dropdown-item:active {
    box-shadow: inset 0 0 10px rgba(77, 184, 255, 0.6) !important;
    transform: translateX(2px) !important;
  }

  .tech-dropdown-item .el-icon {
    margin-right: 10px;
    font-size: 16px;
  }

  .tech-dropdown-item.divided {
    border-top: 1px solid rgba(77, 184, 255, 0.2);
  }
  
/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateY(-15px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateY(15px);
}
</style>