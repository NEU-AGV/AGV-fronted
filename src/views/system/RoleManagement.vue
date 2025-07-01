<template>
  <div>
    <div class="defect-management-container"></div>
  <div class="content-pane">
    <el-form :model="searchForm" inline class="search-form">
      <el-form-item label="角色名称"><el-input v-model="searchForm.roleName" placeholder="请输入角色名称" clearable /></el-form-item>
      <el-form-item label="角色编码"><el-input v-model="searchForm.roleCode" placeholder="请输入角色编码" clearable /></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search">搜索</el-button><el-button type="primary":icon="Refresh">重置</el-button></el-form-item>
    </el-form>

    <div class="toolbar"><el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button></div>

    <el-table :data="tableData" border stripe v-loading="loading" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="roleId" label="角色ID" align="center" />
      <el-table-column prop="roleName" label="角色名称" />
      <el-table-column prop="roleCode" label="角色编码" />
      <el-table-column prop="status" label="状态" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.status" active-value="启用" inactive-value="禁用" :disabled="row.isSystem" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="240" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="blue" :icon="EditPen" @click="handleEdit(row)">修改</el-button>
          <el-button link type="danger" :icon="Delete" :disabled="row.isSystem" @click="handleDelete(row)">删除</el-button>
          <el-button link type="warning" :icon="Check" @click="handlePermission(row)">权限分配</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 在 el-pagination 标签中修改 layout 属性 -->
 <el-pagination 
  class="pagination-container"
  layout="total, prev, pager, next, jumper"
  :total="total" 
  :page-size="pageSize" 
  :current-page="currentPage"
  @current-change="handleCurrentChange"
/>
  </div>

  <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px">
    <el-form ref="roleFormRef" :model="roleForm" :rules="roleFormRules" label-width="80px">
      <el-form-item label="角色名称" prop="roleName"><el-input v-model="roleForm.roleName" placeholder="请输入角色名称" /></el-form-item>
      <el-form-item label="角色编码" prop="roleCode"><el-input v-model="roleForm.roleCode" placeholder="请输入角色编码" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-radio-group v-model="roleForm.status"><el-radio label="启用">启用</el-radio><el-radio label="禁用">禁用</el-radio></el-radio-group></el-form-item>
      <el-form-item label="描述"><el-input v-model="roleForm.description" type="textarea" placeholder="请输入描述" /></el-form-item>
    </el-form>
    <template #footer><el-button type="primary" @click="dialog.visible = false">取 消</el-button><el-button type="primary" @click="handleSubmit">确 定</el-button></template>
  </el-dialog>

  <el-dialog v-model="permissionDialog.visible" title="权限分配" width="500px">
    <el-form label-width="80px" class="permission-form">
      <el-form-item label="功能权限">
        <div class="form-control flex-container">
        <el-tree
            ref="permissionTreeRef"
            :data="mockPermissionTreeData"
            show-checkbox
            node-key="id"
            :props="{ label: 'label', children: 'children' }"
            class="tree-component"
        />
        </div>
      </el-form-item>
      <el-form-item label="数据权限">
        <div class="form-control flex-container">
        <el-select v-model="permissionDialog.dataScope" placeholder="请选择数据权限范围" class="select-component">
          <el-option label="全部数据" value="全部" />
          <el-option label="本部门数据" value="本部门" />
          <el-option label="仅本人数据" value="仅本人" />
        </el-select>
        </div>  
      </el-form-item>
    </el-form>
    <template #footer><el-button type="primary" @click="permissionDialog.visible = false">取 消</el-button><el-button type="primary" @click="handlePermissionSubmit">确 定</el-button></template>
  </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, EditPen, Delete, Check } from '@element-plus/icons-vue';
import { getRoles, addRole, updateRole, deleteRole, updateRolePermissions } from '@/api/system.js';

const USE_REAL_API = false;

const loading = ref(false);
const searchForm = reactive({ roleName: '', roleCode: '' });
const tableData = ref([]);

const roleFormRef = ref(null);
const dialog = reactive({ visible: false, title: '' });
const roleForm = reactive({ roleId: null, roleName: '', roleCode: '', status: '启用', description: '' });
const roleFormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
};

// 权限分配弹窗
const permissionTreeRef = ref(null);
const permissionDialog = reactive({ visible: false, roleId: null, dataScope: '仅本人' });
const mockPermissionTreeData = [
  { id: 'system', label: '系统管理', children: [
      { id: 'system:user', label: '用户管理', children: [{ id: 'system:user:add', label: '新增' }, { id: 'system:user:edit', label: '修改' }] },
      { id: 'system:role', label: '角色管理', children: [{ id: 'system:role:add', label: '新增' }, { id: 'system:role:edit', label: '修改' }] },
    ]},
  { id: 'task', label: '任务管理', children: [{id: 'task:list', label: '查看列表'}, {id: 'task:export', label: '导出'}] },
];

const mockRoleDataSource = [
  { roleId: 1, roleName: '超级管理员', roleCode: 'admin', status: '启用', createTime: '2024-01-01 10:00:00', isSystem: true, permissionIds: ['system', 'task'], dataScope: '全部' },
  { roleId: 2, roleName: '巡检管理员', roleCode: 'inspector', status: '启用', createTime: '2024-01-01 10:00:00', isSystem: false, permissionIds: ['task'], dataScope: '本部门' },
];

const currentPage = ref(1); // 当前页码
const pageSize = ref(10);   // 每页显示条数
const total = ref(2);       // 总数据量（示例值，需根据实际API返回调整）

// 重新获取数据时传入分页参数
const fetchRoles = async () => {
  loading.value = true;
  if (USE_REAL_API) {
    try {
      // 假设API支持分页参数，需根据实际接口调整
      const res = await getRoles({
        ...searchForm,
        pageNum: currentPage.value,
        pageSize: pageSize.value
      });
      tableData.value = res.records || [];
      total.value = res.total || 0;
    } catch (error) { console.error(error); } finally { loading.value = false; }
  } else {
    // 模拟数据过滤和分页
    const startIdx = (currentPage.value - 1) * pageSize.value;
    const endIdx = startIdx + pageSize.value;
    tableData.value = mockRoleDataSource
      .filter(item => 
        item.roleName.includes(searchForm.roleName) && 
        item.roleCode.includes(searchForm.roleCode)
      )
      .slice(startIdx, endIdx);
    total.value = mockRoleDataSource.length;
    loading.value = false;
  }
};

onMounted(() => { fetchRoles(); });

const handleAdd = () => {
  // 重置表单
  Object.keys(roleForm).forEach(key => roleForm[key] = null);
  roleForm.status = '启用';
  dialog.title = '新增角色';
  dialog.visible = true;
};

const handleEdit = (row) => {
  dialog.title = '编辑角色';
  dialog.visible = true;
  nextTick(() => Object.assign(roleForm, row));
};

const handleSubmit = async () => {
  await roleFormRef.value.validate();
  if (USE_REAL_API) {
    try {
      if (roleForm.roleId) {
        await updateRole(roleForm.roleId, roleForm);
        ElMessage.success('修改成功！');
      } else {
        await addRole(roleForm);
        ElMessage.success('新增成功！');
      }
      dialog.visible = false;
      fetchRoles();
    } catch(error) { /* ... */ }
  } else {
    ElMessage.success('保存成功（模拟）');
    dialog.visible = false;
  }
};

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除角色 "${row.roleName}"?`, '提示', { type: 'warning' });
  if (USE_REAL_API) {
    try {
      await deleteRole(row.roleId);
      ElMessage.success('删除成功！');
      fetchRoles();
    } catch(error) { /* ... */ }
  } else {
    ElMessage.success('删除成功（模拟）');
  }
};

const handlePermission = (row) => {
  permissionDialog.roleId = row.roleId;
  permissionDialog.dataScope = row.dataScope;
  permissionDialog.visible = true;
  // 模拟回显已有的权限
  nextTick(() => {
    permissionTreeRef.value.setCheckedKeys(row.permissionIds, false);
  });
};

const handlePermissionSubmit = async () => {
  const allKeys = permissionTreeRef.value.getCheckedKeys(false).concat(permissionTreeRef.value.getHalfCheckedKeys());
  if (USE_REAL_API) {
    try {
      const data = { menuIds: allKeys, dataScope: permissionDialog.dataScope };
      await updateRolePermissions(permissionDialog.roleId, data);
      ElMessage.success('权限分配成功！');
      permissionDialog.visible = false;
    } catch(error) { /* ... */ }
  } else {
    console.log('分配的功能权限ID:', allKeys);
    console.log('分配的数据权限:', permissionDialog.dataScope);
    ElMessage.success('权限分配成功（模拟）');
    permissionDialog.visible = false;
  }
};

</script>

<style scoped>

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

/* 分页容器样式 */
.pagination-container{
  margin-top:20px;  /* 顶部外边距 */
  display:flex;  /* 弹性布局 */
  justify-content:flex-end  /* 右对齐 */
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

/* 红箭头：表单标签、表格表头*/
::v-deep .el-form-item__label {
  color: #00d4ff !important; 
}
::v-deep .el-table__header th {
  color: #00d4ff !important; 
}

/* 黄框：表格单元格内容 颜色*/
::v-deep .el-table__body td {
  color: #ccc !important; 
}

/* 新增样式，放置在原有样式文件中 */

/* 1. 强制统一宽度并提升优先级 */
:deep(.tree-component),
:deep(.select-component) {
  width: 100% !important; /* 强制100%宽度 */
  box-sizing: border-box;
}

/* 2. 父容器Flex布局确保等宽 */
:deep(.flex-container) {
  display: flex;
  flex-direction: column;
  width: 100%;
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

/* 按钮样式 */
::v-deep .el-button--info {
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

/* --- 1. 美化搜索区域的输入框和选择框 --- */
:deep(.search-form .el-input__wrapper),
:deep(.search-form .el-date-editor .el-range-input),
:deep(.search-form .el-select__wrapper) {
  background-color: #0f1419 !important; /* 设置为页面的主背景色 */
  box-shadow: none !important; /* 移除 Element Plus 自带的阴影 */
  border: 1px solid rgba(0, 212, 255, 0.3) !important; /* 使用主题边框色 */
  color: #c1f0ff; /* 设置输入文字的颜色 */
}

/* 修复日期选择器在深色背景下的文字颜色 */
:deep(.search-form .el-range-input) {
  color: #c1f0ff !important;
}

/* 修复下拉框箭头的颜色 */
:deep(.search-form .el-select .el-select__caret) {
  color: #00d4ff;
}


/* --- 2. 美化分页组件 --- */
.pagination-container {
  /* 确保分页组件的背景透明，以显示父容器的颜色 */
  background-color: transparent !important;
  padding: 10px 5px;
  border-radius: 4px;
}

:deep(.el-pagination) {
  /* 设置分页组件的整体文字颜色 */
  --el-pagination-text-color: #c1f0ff;
  /* 设置按钮的颜色 */
  --el-pagination-button-color: #c1f0ff;
  /* 设置禁用状态下按钮的背景色 */
  --el-pagination-button-disabled-bg-color: rgba(0, 212, 255, 0.1);
  /* 设置按钮的背景色 */
  --el-pagination-bg-color: transparent;
}

/* 页码按钮样式 */
:deep(.el-pager li) {
  background-color: rgba(0, 212, 255, 0.1) !important;
  color: #c1f0ff !important;
  border-radius: 4px;
  margin: 0 4px;
  border: 1px solid transparent;
  transition: all 0.3s;
}

/* 当前激活的页码按钮 */
:deep(.el-pager li.is-active) {
  background-color: #00d4ff !important;
  color: #0f1419 !important; /* 深色文字以形成对比 */
  font-weight: bold;
  border-color: #00d4ff;
}

/* 页码按钮悬停效果 */
:deep(.el-pager li:hover) {
  color: #33e0ff !important;
  border-color: #33e0ff;
}

/* "上一页" 和 "下一页" 按钮的样式 */
:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background-color: rgba(0, 212, 255, 0.1) !important;
  border-radius: 4px;
}

/* "跳转到" 输入框的样式 */
:deep(.el-pagination__jump .el-input__wrapper) {
  background-color: #0f1419 !important;
  border: 1px solid rgba(0, 212, 255, 0.3) !important;
  box-shadow: none !important;
}

:deep(.el-pagination__jump .el-input__inner) {
  color: #c1f0ff !important;
}

/* --- 1. 修改分页栏 “条/页” 选择框的背景色 --- */
:deep(.el-pagination__sizes .el-input__wrapper) {
  background-color: #0f1419 !important; /* 使用您现有的深色背景 */
  box-shadow: none !important;
}
</style>

<style lang="scss">
/*
  这个 style 块是全局的，没有 "scoped" 属性。
  这是因为 Element Plus 的弹出框（如日期选择、下拉菜单）是直接挂载在 <body> 下的，
  而不是在我们的组件内部，所以需要用全局样式来覆盖。
  我们通过 .theme-tunnel-popper 这个自定义类名来确保只影响我们想要的弹出框。
*/

/* 基础面板样式 - 针对所有我们自定义的弹出框 */
.el-popper.theme-tunnel-popper {
  background: #1b2735 !important;
  border: 1px solid rgba(0, 229, 255, 0.3) !important;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);

  /* 弹出框的小箭头 */
  .el-popper__arrow::before {
    background: #1b2735 !important;
    border-color: rgba(0, 229, 255, 0.3) !important;
  }
}

/* (1) 下拉选择菜单 (el-select) 的样式 */
.theme-tunnel-popper.el-select-dropdown {
  .el-select-dropdown__item.is-selected {
    color: #00e5ff !important;
    font-weight: bold;
  }
  .el-select-dropdown__item.hover,
  .el-select-dropdown__item:hover {
    background-color: rgba(0, 229, 255, 0.2);
  }
  .el-select-dropdown__item {
    color: #e0e0e0;
  }
}


</style>