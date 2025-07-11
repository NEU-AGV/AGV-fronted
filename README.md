> **状态说明**  
> 本仓库保存的是 **AGV 平台的早期前端实现**。  
> 代码已完成主要功能，但目前项目主线迭代已迁移到新的仓库 **AGV-frontend2**；因此，本仓库不再更新，仅作归档与参考之用。

---

# AGV Tunnel Platform - frontend

一个使用 **Vue 3 + Vite** 搭建的单页应用（SPA），配合后端服务实现以下能力：

- 巡检任务管理  
- 缺陷登记与流转  
- 数据大屏可视化  
- AI 分析结果展示  
- 用户资料与权限管理

所有业务页面、路由、权限指令均由本仓库独立实现。

---

## 技术栈

| 领域        | 主要依赖                | 说明 |
|-------------|-------------------------|------|
| 核心框架    | Vue 3 `<script setup>`  | Composition API |
| 路由        | Vue Router 4           | Hash 模式 |
| 状态管理    | Pinia 2                | 用户信息、Token、主题等 |
| UI 组件库   | Element Plus 2.6       | 表单、表格、弹窗 |
| 网络请求    | Axios 1.x              | 请求 / 响应拦截器 |
| 图表        | Apache ECharts 5       | 折线、柱状、饼图、大屏轮播 |
| 构建工具    | Vite 5                 | 开发热更新、生产构建 |
| 样式        | SCSS + PostCSS         | 响应式布局与主题变量 |

---

## 目录结构

```text
agv-frontend
├─ public/
│ └─ index.html
├─ src/
│ ├─ api/ # Axios 封装与接口模块
│ ├─ assets/ # 静态资源与全局样式
│ ├─ components/ # 通用 Vue 组件
│ ├─ directives/ # 自定义指令（如 v-permission）
│ ├─ router/ # 路由表与守卫
│ ├─ stores/ # Pinia 模块
│ ├─ utils/ # 工具函数
│ ├─ views/ # 业务页面
│ │ ├─ Dashboard.vue
│ │ ├─ Tasks.vue
│ │ ├─ Defects.vue
│ │ ├─ Ai.vue
│ │ └─ Profile.vue
│ └─ main.ts # 应用入口
├─ vite.config.ts
└─ package.json
```


---

## 本地启动

```bash
# 安装依赖
pnpm install       # 或使用 npm / yarn

# 开发模式（默认端口 5173）
pnpm dev

# 生产构建（输出 dist/）
pnpm build
```

将 `dist/` 目录部署至 Nginx 或其他静态文件服务器即可。

## 路由与权限

| 路径            | 页面            | meta.permission |
|-----------------|-----------------|-----------------|
| `/dashboard`    | 数据大屏        | `user` |
| `/tasks`        | 任务管理        | `admin`      |
| `/defects`      | 缺陷管理        | `user`    |
| `/ai`           | AI 分析         | `user`         |
| `/profile`      | 个人中心        | 登录后可访问     |
| `/login`        | 登录页面        | 公共             |

- 登录成功后，后端返回的菜单和按钮权限会写入 Pinia。  


## 已知差异

1. 权限校验仅在前端进行，未与后端数据级权限联动。  
2. 样式基于 Element Plus 默认主题，暗色 / 自定义主题需自行扩展。   
3. i18n 仅提供中文，如需多语言需自行补充。

## 许可证

本仓库代码基于 **Apache License 2.0** 释出。  
欢迎学习与参考；若不要用于生产。



