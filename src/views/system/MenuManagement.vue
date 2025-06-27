<template>
  <div>
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
            <el-button link type="primary" :icon="EditPen" @click="handleEdit(row)">修改</el-button>
            <el-button v-if="row.menuType !== 'F'" link type="primary" :icon="Plus" @click="handleAdd(row)">新增</el-button>
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
          <el-select v-model="menuForm.icon" placeholder="请选择图标" clearable>
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
        <el-button @click="dialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, markRaw } from 'vue'; // 1. 引入 markRaw
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, EditPen, Delete, User, Avatar, Menu, OfficeBuilding, Key } from '@element-plus/icons-vue';

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

onMounted(() => {
  tableData.value = mockMenuDataSource;
  menuOptions.value = [{ menuId: 0, menuName: '主类目', children: mockMenuDataSource }];
});

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

const handleDelete = (row) => {
  ElMessageBox.confirm(`是否确认删除名称为"${row.menuName}"的数据项? 同时会删除其所有子项。`, '提示', {
    type: 'warning',
  }).then(() => ElMessage.success('删除成功（模拟）'));
};

const handleSubmit = () => {
  ElMessage.success('保存成功（模拟）');
  dialog.visible = false;
};
</script>

<style scoped>
.content-pane{padding:0 20px}.toolbar{margin-bottom:15px}
</style>