<template>
  <div>
    <div class="defect-management-container"></div>
    <div class="content-pane">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="handleAdd()">新增菜单</el-button>
      </div>

      <el-table
          :data="tableData"
          style="width: 100%"
          v-loading="loading"
          row-key="menuId"
          border
          default-expand-all
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="menuName" label="菜单名称" width="220" />
        <el-table-column prop="icon" label="图标" align="center" width="80">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" align="center" width="80" />
        <el-table-column prop="perms" label="权限标识" width="180" show-overflow-tooltip />
        <el-table-column prop="component" label="组件路径" width="250" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="blue" :icon="EditPen" @click="handleEdit(row)">修改</el-button>
            <el-button v-if="row.menuType !== 'F'" link type="blue" :icon="Plus" @click="handleAdd(row)">新增</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="700px">
      <el-form ref="menuFormRef" :model="menuForm" :rules="menuFormRules" label-width="100px">
        <el-form-item label="上级菜单">
          <el-tree-select
              v-model="menuForm.parentId"
              :data="menuOptions"
              :props="{ label: 'menuName', value: 'menuId' }"
              value-key="menuId"
              check-strictly
              placeholder="选择上级菜单"
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="menuForm.menuType">
            <el-radio label="M">目录</el-radio>
            <el-radio label="C">菜单</el-radio>
            <el-radio label="F">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="menuForm.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item v-if="menuForm.menuType !== 'F'" label="菜单图标">
          <el-select v-model="menuForm.icon" placeholder="请选择图标" clearable >
            <el-option v-for="item in iconOptions" :key="item.name" :label="item.name" :value="item.component">
              <el-icon><component :is="item.component" /></el-icon>
              <span style="margin-left: 8px">{{ item.name }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="menuForm.menuType !== 'F'" label="路由地址" prop="path">
          <el-input v-model="menuForm.path" placeholder="请输入路由地址" />
        </el-form-item>
        <el-form-item v-if="menuForm.menuType === 'C'" label="组件路径" prop="component">
          <el-input v-model="menuForm.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item v-if="menuForm.menuType !== 'M'" label="权限标识" prop="perms">
          <el-input v-model="menuForm.perms" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item label="显示排序" prop="orderNum">
          <el-input-number v-model="menuForm.orderNum" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="菜单状态">
          <el-radio-group v-model="menuForm.status">
            <el-radio label="正常">正常</el-radio>
            <el-radio label="停用">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary"@click="dialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, markRaw } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, EditPen, Delete, User, Avatar, Menu, OfficeBuilding, Key } from '@element-plus/icons-vue';
import { getMenus, addMenu, updateMenu, deleteMenu } from '@/api/system.js';

const USE_REAL_API = false;

const loading = ref(false);
const tableData = ref([]);
const menuOptions = ref([]);

const dialog = reactive({ visible: false, title: '' });
const menuFormRef = ref(null);
const menuForm = reactive({
  menuId: null, parentId: 0, menuType: 'M', menuName: '', icon: null, path: '',
  component: '', perms: '', orderNum: 0, status: '正常',
});
const menuFormRules = { /* ... */ };

// 2. 在使用图标组件对象前，用 markRaw 包裹
const iconOptions = [
  { name: 'User', component: markRaw(User) }, { name: 'Avatar', component: markRaw(Avatar) },
  { name: 'Menu', component: markRaw(Menu) }, { name: 'OfficeBuilding', component: markRaw(OfficeBuilding) },
  { name: 'Key', component: markRaw(Key) }
];

// 3. 在 mock 数据中也使用 markRaw
const mockMenuDataSource = [
  { menuId: 1, menuName: '系统管理', parentId: 0, menuType: 'M', path: '/system', icon: markRaw(User), orderNum: 1, perms: '', component: '', status: '正常', createTime: '2024-01-01 10:00:00', children: [
      { menuId: 11, menuName: '用户管理', parentId: 1, menuType: 'C', path: 'user', icon: markRaw(Avatar), orderNum: 1, perms: 'system:user:list', component: 'system/user/index', status: '正常', createTime: '2024-01-01 10:00:00' },
      { menuId: 12, menuName: '角色管理', parentId: 1, menuType: 'C', path: 'role', icon: markRaw(Key), orderNum: 2, perms: 'system:role:list', component: 'system/role/index', status: '正常', createTime: '2024-01-01 10:00:00', children: [
          { menuId: 121, menuName: '新增角色', parentId: 12, menuType: 'F', path: '', icon: null, orderNum: 1, perms: 'system:role:add', component: '', status: '正常', createTime: '2024-01-01 10:00:00' }
        ]},
    ]},
  { menuId: 2, menuName: '任务管理', parentId: 0, menuType: 'C', path: '/tasks', icon: markRaw(Menu), orderNum: 2, perms: 'task:list', component: 'tasks/index', status: '正常', createTime: '2024-01-01 10:00:00' },
];

const fetchMenus = async () => {
  loading.value = true;
  if (USE_REAL_API) {
    try {
      const menus = await getMenus();
      tableData.value = menus;
      menuOptions.value = [{ menuId: 0, menuName: '主类目', children: menus }];
    } catch(error) { console.error(error); } finally { loading.value = false; }
  } else {
    tableData.value = mockMenuDataSource;
    menuOptions.value = [{ menuId: 0, menuName: '主类目', children: mockMenuDataSource }];
    loading.value = false;
  }
};

onMounted(() => { fetchMenus(); });

const handleAdd = (row) => {
  // 重置表单
  Object.keys(menuForm).forEach(key => menuForm[key] = key === 'orderNum' ? 0 : (key === 'parentId' ? 0 : null));
  menuForm.menuType = 'M';
  menuForm.status = '正常';

  if (row && row.menuId) {
    menuForm.parentId = row.menuId;
    dialog.title = '新增子菜单';
  } else {
    dialog.title = '新增菜单';
  }
  dialog.visible = true;
};

const handleEdit = (row) => {
  dialog.title = '编辑菜单';
  dialog.visible = true;
  nextTick(() => Object.assign(menuForm, row));
};

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`是否确认删除名称为"${row.menuName}"的数据项? 同时会删除其所有子项。`, '提示', { type: 'warning' });
  if (USE_REAL_API) {
    try {
      await deleteMenu(row.menuId);
      ElMessage.success('删除成功！');
      fetchMenus();
    } catch(error) { /* ... */ }
  } else {
    ElMessage.success('删除成功（模拟）');
  }
};

const handleSubmit = async () => {
  await menuFormRef.value.validate();
  if (USE_REAL_API) {
    try {
      if (menuForm.menuId) {
        await updateMenu(menuForm.menuId, menuForm);
        ElMessage.success('修改成功！');
      } else {
        await addMenu(menuForm);
        ElMessage.success('新增成功！');
      }
      dialog.visible = false;
      fetchMenus();
    } catch(error) { /* ... */ }
  } else {
    ElMessage.success('保存成功（模拟）');
    dialog.visible = false;
  }
};
</script>

<style scoped>
.content-pane{padding:0 20px}.toolbar{margin-bottom:15px}
.content-pane {
  background-color: #0f1419;
  color: #fff;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: calc(100vh - 30px);
}

.search-form,
.el-table,
.el-pagination {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
}


/*表单标签、表格表头 颜色*/
::v-deep .el-form-item__label {
  color: #00d4ff !important; 
}
::v-deep .el-table__header th {
  color: #00d4ff !important; 
}

/* 表格单元格内容 颜色*/
::v-deep .el-table__body td {
  color: #ccc !important; 
}


::v-deep .toolbar .el-button--primary {
  border-radius: 20px; 
  padding: 8px 20px;  
  transition: all 0.3s ease; 
  background-color: #00d4ff; 
  border: none;             
  color: #0f1419;           
}
::v-deep .toolbar .el-button--primary:hover {
  background-color: #33e0ff; 
}

::v-deep .el-tag {
  /* 背景透明且带模糊，模拟玻璃质感 */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px); /* 兼容 Safari */
  border: 1px solid rgba(255, 255, 255, 0.2); /* 浅色边框增强效果 */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* 阴影增加层次感 */
  color: #37c271; /* 文字颜色 */
}

/* 针对 success 类型（正常状态）的 tag 可单独微调，比如加深边框等，也可省略 */
::v-deep .el-tag--success {
  border-color: rgba(103, 194, 58, 0.4); 
}


/* 主要按钮样式 */
::v-deep .el-button--primary {
  background-color: #00d4ff;  /* 蓝色背景 */
  border: none;  /* 无边框 */
  color: #0f1419;  /* 深色文字 */
  border-radius: 20px;  /* 圆形按钮 */
  padding: 8px 20px;  /* 内边距 */
  transition: all 0.3s ease;  /* 过渡动画 */
}
::v-deep .el-button--primary:hover {
  background-color: #33e0ff;  /* 悬停时更亮的蓝色 */
}

/* 按钮样式 */
::v-deep .el-button--blue {
  color: #fff;  /* 白色文字 */
}

/* 按钮图标样式 */
::v-deep .el-button .el-icon {
  margin-right: 6px;  /* 图标右边距 */
}



/* 页面底部地铁巡线车装饰 */
.defect-management-container::before {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  height: 80px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 80' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%23002b33'/%3E%3Cstop offset='100%25' stop-color='%23004d5a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0,60 Q300,30 600,60 T1200,60' fill='none' stroke='%2300d4ff' stroke-width='2' stroke-opacity='0.6'/%3E%3Cpath d='M0,65 Q300,35 600,65 T1200,65' fill='none' stroke='%2300d4ff' stroke-width='1' stroke-opacity='0.4'/%3E%3C!-- 地铁轨道 --%3E%3Crect x='0' y='70' width='1200' height='5' fill='url(%23grad)'/%3E%3C!-- 巡线车 --%3E%3Cg transform='translate(100,45)'%3E%3Crect x='0' y='0' width='60' height='15' rx='3' fill='%23005566' stroke='%2300d4ff' stroke-width='1'/%3E%3Crect x='10' y='-5' width='40' height='5' fill='%23007788'/%3E%3Ccircle cx='15' cy='15' r='5' fill='%23003344'/%3E%3Ccircle cx='45' cy='15' r='5' fill='%23003344'/%3E%3Cpath d='M20,5 Q30,-5 40,5' fill='none' stroke='%2300d4ff' stroke-width='1'/%3E%3Cline x1='25' y1='0' x2='35' y2='0' stroke='%2300d4ff' stroke-width='1'/%3E%3C/g%3E%3C!-- 信号灯 --%3E%3Ccircle cx='900' cy='40' r='4' fill='%2300ff00' filter='url(%23glow)'/%3E%3Ccircle cx='950' cy='35' r='3' fill='%23ff6600' filter='url(%23glow)'/%3E%3Cdefs%3E%3Cfilter id='glow' x='-30%25' y='-30%25' width='160%25' height='160%25'%3E%3CfeGaussianBlur stdDeviation='2' result='blur'/%3E%3CfeComposite in='SourceGraphic' in2='blur' operator='over'/%3E%3C/filter%3E%3C/defs%3E%3C/svg%3E");
  background-size: 1200px 80px;
  z-index: 0;
  opacity: 0.8;
}

@keyframes trainMove {
  0% { background-position: 0 0; }
  100% { background-position: -1200px 0; }
}
.defect-management-container::before {
  animation: trainMove 30s linear infinite;
}

/* 表格样式优化 */
:deep(.el-table) {
  --el-table-text-color: #c1f0ff;
  --el-table-header-text-color: #00d4ff;
  --el-table-row-hover-bg-color: rgba(0, 212, 255, 0.1);
  --el-table-border-color: rgba(0, 212, 255, 0.3);
  --el-table-bg-color: rgba(0, 30, 40, 0.7);
}

:deep(.el-table th) {
  background-color: rgba(0, 50, 60, 0.7);
  font-weight: 600;
}

:deep(.el-table tr) {
  background-color: var(--el-table-bg-color);
}

:deep(.el-table td) {
  background-color: var(--el-table-bg-color);
  border-bottom-color: rgba(0, 212, 255, 0.2);
}

:deep(.el-table .cell) {
  line-height: 1.6;
}
/* 表格样式优化 - 完全覆盖斑马纹 */
:deep(.el-table) {
  --el-table-tr-bg-color: transparent; /* 覆盖斑马纹背景色 */
  --el-table-row-hover-bg-color: rgba(0, 212, 255, 0.1);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped) {
  background: transparent !important; /* 完全禁用斑马纹 */
}

:deep(.el-table th),
:deep(.el-table tr),
:deep(.el-table td) {
  background-color: rgba(0, 30, 40, 0.7) !important; /* 统一背景色 */
  border-bottom-color: rgba(0, 212, 255, 0.3) !important;
}

/* 表格样式优化 */
:deep(.el-table) {
  --el-table-text-color: #c1f0ff;
  --el-table-header-text-color: #00d4ff;
  --el-table-row-hover-bg-color: rgba(0, 232, 255, 0.15); /* 悬停颜色变亮 */
  --el-table-border-color: rgba(0, 212, 255, 0.3);
  --el-table-bg-color: rgba(0, 30, 40, 0.7);
}

/* 行悬停效果增强 */
:deep(.el-table__body tr:hover>td) {
  background-color: rgba(0, 232, 255, 0.15) !important; /* 使用更亮的蓝色 */
  box-shadow: inset 0 0 10px rgba(0, 212, 255, 0.2); /* 添加内发光效果 */
}

/* 操作按钮悬停效果 */
:deep(.el-table .action-btn:hover) {
  color: #ff7d7d !important; /* 更亮的红色 */
  background-color: rgba(245, 108, 108, 0.15) !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
}

/* 链接悬停效果 */
:deep(.el-link:hover) {
  --el-link-hover-text-color: #55f0ff !important; /* 更亮的蓝绿色 */
  text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
}

/* 操作按钮统一样式 */
:deep(.el-table .action-btn) {
  color: #f56c6c;
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
  transition: all 0.3s;
}

:deep(.el-table .action-btn:hover) {
  color: #f78989;
  background-color: rgba(245, 108, 108, 0.1);
  transform: translateY(-1px);
}

:deep(.el-table .action-btn:active) {
  transform: translateY(0);
}

/* 链接样式 */
:deep(.el-link) {
  --el-link-text-color: #00e5ff;
  --el-link-hover-text-color: #33eeff;
}

/* 分页控件样式 */
.pagination-card .pagination-container {
  margin-top: 0;
  justify-content: flex-end;
}

.pagination-card .el-pagination {
  background: transparent;
  border: none;
  padding: 0;
}

.pagination-card .el-pagination.is-background .el-pager li {
  background-color: transparent;
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #fff;
  margin: 0 5px;
  border-radius: 4px;
}

.pagination-card .el-pagination.is-background .el-pager li.active {
  background-color: #00d4ff;
  color: #0f1419;
  border-color: #00d4ff;
}

.pagination-card .el-pagination .btn-next, 
.pagination-card .el-pagination .btn-prev {
  background-color: transparent;
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #fff;
  border-radius: 4px;
}

.pagination-card .el-pagination .btn-next:hover, 
.pagination-card .el-pagination .btn-prev:hover {
  background-color: rgba(0, 212, 255, 0.2);
}

.pagination-card .el-pagination__total {
  color: #ccc;
  margin-right: 10px;
}

/* 行高亮效果 */
:deep(.highlighted-row) {
  background-color: rgba(253, 246, 236, 0.1);
}

:deep(.highlighted-row:hover > td) {
  background-color: rgba(253, 246, 236, 0.2);
}


/* --- 弹窗整体样式优化 --- */
:deep(.el-dialog) {
  background-color: #0f1419 !important; /* 使用页面主背景色 */
  border: 1px solid rgba(0, 212, 255, 0.3) !important; /* 使用主题边框色 */
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.1) !important;
}

:deep(.el-dialog__header) {
  background-color: rgba(0, 30, 40, 0.7) !important; /* 稍深的背景色 */
  border-bottom: 1px solid rgba(0, 212, 255, 0.2) !important;
  padding: 15px 20px;
}

:deep(.el-dialog__title) {
  color: #c1f0ff !important; /* 使用主题文字颜色 */
  font-weight: 500;
}

:deep(.el-dialog__body) {
  background-color: rgba(0, 212, 255, 0.05) !important; /* 轻微的主题色背景 */
  padding: 20px;
}

:deep(.el-dialog__footer) {
  background-color: rgba(0, 30, 40, 0.7) !important;
  border-top: 1px solid rgba(0, 212, 255, 0.2) !important;
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}


</style>