<template>
  <div>
    <div class="defect-management-container"></div>
    <div class="content-pane">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="用户状态" clearable style="width: 100px;"popper-class="theme-tunnel-popper">
            <el-option label="正常" value="正常" />
            <el-option label="禁用" value="禁用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchUsers">搜索</el-button>
          <el-button type="primary" :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
        <el-button type="dangermax" :icon="Delete" @click="handleDeleteMulti" :disabled="selectedUsers.length === 0">批量删除</el-button>
      </div>

      <el-table :data="userTableData" border stripe v-loading="loading" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="userId" label="用户ID" align="center" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="realName" label="姓名" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="departmentName" label="部门" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="status" label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-switch
                v-model="row.status"
                active-value="正常"
                inactive-value="禁用"
                :disabled="row.username === 'admin'"
                @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录时间" width="160" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="blue" :icon="EditPen" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)" :disabled="row.username === 'admin'">删除</el-button>
            <el-button link type="info" :icon="Key" @click="handleResetPwd(row)">重置密码</el-button>
            <el-button link type="warning" :icon="View" @click="handleViewLog(row)">登录日志</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
          class="pagination-container"
          :current-page="pagination.currentPage"
          :page-size="10" layout="total, prev, pager, next, jumper" :total="pagination.total"
          @current-change="handleCurrentChange"
          :popper-class="'theme-tunnel-popper'"
      />
    </div>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="600px" @close="handleDialogClose">
      <el-form ref="userFormRef" :model="userForm" :rules="userFormRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="dialog.mode === 'edit'" />
        </el-form-item>
        <el-form-item v-if="dialog.mode === 'add'" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请输入用户姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="部门" prop="deptId">
          <el-tree-select
              v-model="userForm.deptId"
              :data="mockDepartments"
              :props="{ label: 'deptName', value: 'deptId' }"
              check-strictly
              placeholder="请选择所属部门"
          />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="userForm.roleIds" multiple placeholder="请分配角色" style="width: 100%">
            <el-option v-for="role in mockRoles" :key="role.roleId" :label="role.roleName" :value="role.roleId" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="正常">正常</el-radio>
            <el-radio label="禁用">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="dialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, EditPen, Delete, Key, View } from '@element-plus/icons-vue';
// 1. 引入所有需要用到的API函数
import { getUsers, updateUserStatus, addUser, updateUser, deleteUsers } from '@/api/system.js';

// --- 开关：设置为 true 时将调用真实API ---
const USE_REAL_API = false;

const loading = ref(false);
const searchForm = reactive({ username: '', phone: '', status: '' });
const userTableData = ref([]);
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 0 });
const selectedUsers = ref([]);
const userFormRef = ref(null);

const dialog = reactive({ visible: false, title: '', mode: 'add' });
const userForm = reactive({ userId: null, username: '', password: '', realName: '', email: '', phone: '', deptId: null, roleIds: [], status: '正常' });

const userFormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码长度至少6位', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  deptId: [{ required: true, message: '请选择部门', trigger: 'change' }],
  roleIds: [{ required: true, type: 'array', message: '请至少分配一个角色', trigger: 'change' }],
};

const mockRoles = [ { roleId: 1, roleName: '超级管理员' }, { roleId: 2, roleName: '巡检管理员' }, { roleId: 3, roleName: '普通用户' }];
const mockDepartments = [ { deptId: 100, deptName: '集团总部', children: [ { deptId: 101, deptName: '研发部' }, { deptId: 102, deptName: '运维部' } ] }, { deptId: 200, deptName: '分公司' }];
const mockUserDataSource = [
  { userId: 1, username: 'admin', realName: '管理员', email: 'admin@example.com', deptId: 101, departmentName: '研发部', roleIds: [1], phone: '15888888888', status: '正常', createTime: '2024-01-01 10:00:00', lastLoginTime: '2025-06-26 10:00:00' },
  { userId: 2, username: 'zhangsan', realName: '张三', email: 'zhangsan@example.com', deptId: 102, departmentName: '运维部', roleIds: [2], phone: '13666666666', status: '禁用', createTime: '2024-02-15 11:30:00', lastLoginTime: '2025-06-25 11:30:00' },
  { userId: 3, username: 'lisi', realName: '李四', email: 'lisi@example.com', deptId: 101, departmentName: '研发部', roleIds: [3], phone: '13777777777', status: '正常', createTime: '2024-04-10 09:00:00', lastLoginTime: '2025-06-24 18:00:00' },
];

// --- 方法 ---

onMounted(() => {
  fetchUsers();
});

const fetchUsers = async () => {
  loading.value = true;
  if (USE_REAL_API) {
    try {
      const params = { page: pagination.currentPage, pageSize: pagination.pageSize, ...searchForm };
      const res = await getUsers(params);
      userTableData.value = res.list;
      pagination.total = res.total;
    } catch (error) { console.error(error); } finally { loading.value = false; }
  } else {
  setTimeout(() => {
    // 模拟筛选逻辑
    const filteredData = mockUserDataSource.filter(item => {
      const searchUsername = searchForm.username.toLowerCase();
      const searchPhone = searchForm.phone;
      const searchStatus = searchForm.status;

      const usernameMatch = item.username.toLowerCase().includes(searchUsername);
      const phoneMatch = item.phone.includes(searchPhone);
      const statusMatch = !searchStatus || item.status === searchStatus;

      return usernameMatch && phoneMatch && statusMatch;
    });

    // 模拟分页逻辑
    pagination.total = filteredData.length;
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    userTableData.value = filteredData.slice(start, end);

    loading.value = false;
  }, 300);
}}

// 关键改动：修复 handleSearch 函数
const handleSearch = () => {
  pagination.currentPage = 1; // 每次搜索都应该回到第一页
  fetchUsers();
};

const handleReset = () => {
  searchForm.username = '';
  searchForm.phone = '';
  searchForm.status = '';
  handleSearch(); // 调用修复后的搜索方法
};

const handleStatusChange = async (row) => {
  if (USE_REAL_API) {
    try {
      await updateUserStatus(row.userId, row.status);
      ElMessage.success(`状态更新成功！`);
    } catch(error) {
      // 失败时状态回滚
      row.status = row.status === '正常' ? '禁用' : '正常';
    }
  } else {
    ElMessage.success(`用户 [${row.realName}] 的状态已更新为: ${row.status}`);
  }
};
const handleSubmit = async () => {
  await userFormRef.value.validate();
  if (USE_REAL_API) {
    try {
      if (dialog.mode === 'add') {
        await addUser(userForm);
        ElMessage.success('新增用户成功！');
      } else {
        await updateUser(userForm.userId, userForm);
        ElMessage.success('编辑用户成功！');
      }
      dialog.visible = false;
      fetchUsers(); // 成功后刷新列表
    } catch (error) { /* ElMessage is handled in interceptor */ }
  } else {
    ElMessage.success('操作成功（模拟）');
    dialog.visible = false;
  }
};

// 3. 改造“删除”方法
const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除用户 "${row.realName}"?`, '提示', { type: 'warning' });
  if (USE_REAL_API) {
    try {
      await deleteUsers([row.userId]); // 后端接口接收ID数组
      ElMessage.success('删除成功！');
      fetchUsers();
    } catch (error) { /* Interceptor handles message */ }
  } else {
    ElMessage.success('删除成功（模拟）');
  }
};

// 4. 改造“批量删除”方法
const handleDeleteMulti = async () => {
  await ElMessageBox.confirm(`确定删除选中的 ${selectedUsers.value.length} 个用户?`, '提示', { type: 'warning' });
  if (USE_REAL_API) {
    try {
      const ids = selectedUsers.value.map(user => user.userId);
      await deleteUsers(ids);
      ElMessage.success('批量删除成功！');
      fetchUsers();
    } catch (error) { /* Interceptor handles message */ }
  } else {
    ElMessage.success('批量删除成功（模拟）');
  }
};
const handleSelectionChange = (selection) => { selectedUsers.value = selection; };
const handleAdd = () => { dialog.mode = 'add'; dialog.title = '新增用户'; dialog.visible = true; };
const handleEdit = (row) => { dialog.mode = 'edit'; dialog.title = '编辑用户'; dialog.visible = true; nextTick(() => { Object.assign(userForm, row); }); };
const handleDialogClose = () => { userFormRef.value?.resetFields(); Object.keys(userForm).forEach(key => { if (key === 'roleIds') userForm[key] = []; else if (key === 'status') userForm[key] = '正常'; else userForm[key] = null; }) };
const handleResetPwd = (row) => { ElMessage.info(`重置 ${row.username} 的密码`); };
const handleViewLog = (row) => { ElMessage.info(`查看 ${row.username} 的登录日志`); };
const handleSizeChange = (val) => { pagination.pageSize = val; fetchUsers(); };
const handleCurrentChange = (val) => { pagination.currentPage = val; fetchUsers(); };
</script>

<style scoped>
/* 主要内容区域样式 - 设置深色背景、白色文字、内边距和布局 */
.content-pane{
  background-color: #0f1419;  /* 深色背景 */
  color: #fff;  /* 白色文字 */
  padding: 20px;  /* 内边距 */
  height: 100%;  /* 高度100% */
  display: flex;  /* 弹性布局 */
  flex-direction: column;  /* 垂直排列 */
  gap: 20px;  /* 子元素间距 */
  min-height: calc(100vh - 30px);  /* 最小高度为视口高度减30px */
}

/* 搜索表单样式 */
.search-form{
  background-color:#0f1419;  /* 背景色 */
  padding:20px 20px 0;  /* 内边距 */
  border-radius:4px;  /* 圆角 */
  margin-bottom:20px  /* 底部外边距 */
}

/* 工具栏样式 */
.toolbar{margin-bottom:15px}  /* 底部外边距 */

/* 分页容器样式 */
.pagination-container{
  margin-top:20px;  /* 顶部外边距 */
  display:flex;  /* 弹性布局 */
  justify-content:flex-end  /* 右对齐 */
}

/* 搜索表单、表格和分页组件的统一样式 */
.search-form,
.el-table,
.el-pagination {
  background: rgba(0, 212, 255, 0.1);  /* 半透明蓝色背景 */
  border: 1px solid rgba(0, 212, 255, 0.3);  /* 蓝色边框 */
  padding: 15px;  /* 内边距 */
  border-radius: 4px;  /* 圆角 */
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




/* 表单标签和表格表头样式 */
::v-deep .el-form-item__label {
  color: #00d4ff !important;  /* 蓝色文字 */
}
::v-deep .el-table__header th {
  color: #00d4ff !important;  /* 蓝色文字 */
}

/* 表格单元格文字颜色 */
::v-deep .el-table__body td {
  color: #ccc !important;  /* 浅灰色文字 */
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

::v-deep .el-button--dangermax {
  background-color: #f56c6c;  /* 蓝色背景 */
  border: none;  /* 无边框 */
  color: #fff;  ;  /* 深色文字 */
  border-radius: 20px;  /* 圆形按钮 */
  padding: 8px 20px;  /* 内边距 */
  transition: all 0.3s ease;  /* 过渡动画 */
}
::v-deep .el-button--dangermax:hover {
  background-color: #f78989;  /* 悬停时更亮的蓝色 */
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


/* 应用地铁动画 */
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
</style>