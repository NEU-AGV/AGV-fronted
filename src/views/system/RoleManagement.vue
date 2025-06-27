<template>
  <div>
  <div class="content-pane">
    <el-form :model="searchForm" inline class="search-form">
      <el-form-item label="角色名称"><el-input v-model="searchForm.roleName" placeholder="请输入角色名称" clearable /></el-form-item>
      <el-form-item label="角色编码"><el-input v-model="searchForm.roleCode" placeholder="请输入角色编码" clearable /></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search">搜索</el-button><el-button :icon="Refresh">重置</el-button></el-form-item>
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
          <el-button link type="primary" :icon="EditPen" @click="handleEdit(row)">修改</el-button>
          <el-button link type="danger" :icon="Delete" :disabled="row.isSystem" @click="handleDelete(row)">删除</el-button>
          <el-button link type="warning" :icon="Check" @click="handlePermission(row)">权限分配</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pagination-container" layout="total, sizes, prev, pager, next, jumper" :total="2" />
  </div>

  <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px">
    <el-form ref="roleFormRef" :model="roleForm" :rules="roleFormRules" label-width="80px">
      <el-form-item label="角色名称" prop="roleName"><el-input v-model="roleForm.roleName" placeholder="请输入角色名称" /></el-form-item>
      <el-form-item label="角色编码" prop="roleCode"><el-input v-model="roleForm.roleCode" placeholder="请输入角色编码" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-radio-group v-model="roleForm.status"><el-radio label="启用">启用</el-radio><el-radio label="禁用">禁用</el-radio></el-radio-group></el-form-item>
      <el-form-item label="描述"><el-input v-model="roleForm.description" type="textarea" placeholder="请输入描述" /></el-form-item>
    </el-form>
    <template #footer><el-button @click="dialog.visible = false">取 消</el-button><el-button type="primary" @click="handleSubmit">确 定</el-button></template>
  </el-dialog>

  <el-dialog v-model="permissionDialog.visible" title="权限分配" width="500px">
    <el-form label-width="80px">
      <el-form-item label="功能权限">
        <el-tree
            ref="permissionTreeRef"
            :data="mockPermissionTreeData"
            show-checkbox
            node-key="id"
            :props="{ label: 'label', children: 'children' }"
        />
      </el-form-item>
      <el-form-item label="数据权限">
        <el-select v-model="permissionDialog.dataScope" placeholder="请选择数据权限范围">
          <el-option label="全部数据" value="全部" />
          <el-option label="本部门数据" value="本部门" />
          <el-option label="仅本人数据" value="仅本人" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer><el-button @click="permissionDialog.visible = false">取 消</el-button><el-button type="primary" @click="handlePermissionSubmit">确 定</el-button></template>
  </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, EditPen, Delete, Check } from '@element-plus/icons-vue';

// --- 状态与数据 ---
const loading = ref(false);
const searchForm = reactive({ roleName: '', roleCode: '' });
const tableData = ref([]);

// 角色表单弹窗
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

// --- 方法 ---
onMounted(() => {
  tableData.value = mockRoleDataSource;
});

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

const handleSubmit = () => {
  roleFormRef.value.validate(valid => {
    if (valid) {
      ElMessage.success('保存成功（模拟）');
      dialog.visible = false;
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除角色 "${row.roleName}"?`, '提示', { type: 'warning' })
      .then(() => ElMessage.success('删除成功（模拟）'));
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

const handlePermissionSubmit = () => {
  const checkedKeys = permissionTreeRef.value.getCheckedKeys(false); // false表示不包含半选的父节点
  const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys();
  const allKeys = [...checkedKeys, ...halfCheckedKeys];

  console.log('分配的功能权限ID:', allKeys);
  console.log('分配的数据权限:', permissionDialog.dataScope);
  ElMessage.success('权限分配成功（模拟）');
  permissionDialog.visible = false;
};
</script>

<style scoped>
.content-pane{padding:0 20px}.search-form{background-color:#f5f7fa;padding:20px 20px 0;border-radius:4px;margin-bottom:20px}.toolbar{margin-bottom:15px}.pagination-container{margin-top:20px;display:flex;justify-content:flex-end}
</style>