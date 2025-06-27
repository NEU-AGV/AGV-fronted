<template>
  <div>
    <div class="content-pane">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="用户状态" clearable style="width: 100px;">
            <el-option label="正常" value="正常" />
            <el-option label="禁用" value="禁用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchUsers">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
        <el-button type="danger" :icon="Delete" @click="handleDeleteMulti" :disabled="selectedUsers.length === 0">批量删除</el-button>
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
            <el-button link type="primary" :icon="EditPen" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)" :disabled="row.username === 'admin'">删除</el-button>
            <el-button link type="info" :icon="Key" @click="handleResetPwd(row)">重置密码</el-button>
            <el-button link type="warning" :icon="View" @click="handleViewLog(row)">登录日志</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
          class="pagination-container"
          :current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
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
        <el-button @click="dialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, EditPen, Delete, Key, View } from '@element-plus/icons-vue';

// --- 数据模型 ---
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

// 关键改动：重写 fetchUsers 函数以支持筛选和分页
const fetchUsers = () => {
  loading.value = true;
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
};

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

const handleSelectionChange = (selection) => { selectedUsers.value = selection; };
const handleAdd = () => { dialog.mode = 'add'; dialog.title = '新增用户'; dialog.visible = true; };
const handleEdit = (row) => { dialog.mode = 'edit'; dialog.title = '编辑用户'; dialog.visible = true; nextTick(() => { Object.assign(userForm, row); }); };
const handleDialogClose = () => { userFormRef.value?.resetFields(); Object.keys(userForm).forEach(key => { if (key === 'roleIds') userForm[key] = []; else if (key === 'status') userForm[key] = '正常'; else userForm[key] = null; }) };
const handleSubmit = () => { userFormRef.value.validate((valid) => { if (valid) { ElMessage.success('操作成功（模拟）'); dialog.visible = false; fetchUsers(); } }); };
const handleStatusChange = (row) => { ElMessage.success(`用户 [${row.realName}] 的状态已更新为: ${row.status}`); };
const handleDelete = (row) => { ElMessageBox.confirm(`确定删除用户 "${row.realName}"?`, '提示', { type: 'warning' }).then(() => ElMessage.success('删除成功')); };
const handleDeleteMulti = () => { ElMessageBox.confirm('确定删除选中的用户?', '提示', { type: 'warning' }).then(() => ElMessage.success('批量删除成功')); };
const handleResetPwd = (row) => { ElMessage.info(`重置 ${row.username} 的密码`); };
const handleViewLog = (row) => { ElMessage.info(`查看 ${row.username} 的登录日志`); };
const handleSizeChange = (val) => { pagination.pageSize = val; fetchUsers(); };
const handleCurrentChange = (val) => { pagination.currentPage = val; fetchUsers(); };
</script>

<style scoped>
.content-pane{padding:20px;box-sizing:border-box}.search-form{background-color:#f5f7fa;padding:20px 20px 0;border-radius:4px;margin-bottom:20px}.toolbar{margin-bottom:15px}.pagination-container{margin-top:20px;display:flex;justify-content:flex-end}
</style>