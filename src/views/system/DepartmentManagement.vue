<template>
  <div>
  <div class="content-pane">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="handleAdd()">新增部门</el-button>
    </div>

    <el-tree
        :data="treeData"
        :props="{ label: 'deptName', children: 'children' }"
        node-key="deptId"
        default-expand-all
        :expand-on-click-node="false"
        class="department-tree"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span>{{ node.label }}</span>
          <span>
            <el-button link type="primary" :icon="Plus" @click.stop="handleAdd(data)">新增</el-button>
            <el-button link type="primary" :icon="EditPen" @click.stop="handleEdit(data)">修改</el-button>
            <el-button link type="danger" :icon="Delete" @click.stop="handleDelete(data)">删除</el-button>
          </span>
        </span>
      </template>
    </el-tree>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="600px">
      <el-form ref="deptFormRef" :model="deptForm" :rules="deptFormRules" label-width="100px">
        <el-form-item label="上级部门">
          <el-tree-select
              v-model="deptForm.parentId"
              :data="treeDataWithOptions"
              :props="{ label: 'deptName', value: 'deptId' }"
              check-strictly
              placeholder="选择上级部门"
          />
        </el-form-item>
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="deptForm.deptName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="显示排序" prop="orderNum">
          <el-input-number v-model="deptForm.orderNum" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="负责人" prop="leader">
          <el-input v-model="deptForm.leader" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="deptForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="deptForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="部门状态">
          <el-radio-group v-model="deptForm.status">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, EditPen, Delete } from '@element-plus/icons-vue';
import { getDepartments, addDepartment, updateDepartment, deleteDepartment } from '@/api/system.js';

const USE_REAL_API = false;

const treeData = ref([]);
const dialog = reactive({ visible: false, title: '' });
const deptFormRef = ref(null);
const deptForm = reactive({
  deptId: null, parentId: 0, deptName: '', orderNum: 0,
  leader: '', phone: '', email: '', status: '正常'
});
const deptFormRules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
};

// --- 模拟数据 ---
const mockDeptDataSource = [
  { deptId: 100, deptName: '集团总部', parentId: 0, orderNum: 1, leader: '董事长', phone: '12345678', email: 'hq@example.com', status: '正常', createTime: '2024-01-01 00:00:00', children: [
      { deptId: 101, deptName: '研发部', parentId: 100, orderNum: 1, leader: '张三', phone: '13800138000', email: 'rd@example.com', status: '正常', createTime: '2024-01-02 00:00:00' },
      { deptId: 102, deptName: '运维部', parentId: 100, orderNum: 2, leader: '李四', phone: '13900139000', email: 'op@example.com', status: '正常', createTime: '2024-01-03 00:00:00' },
      { deptId: 103, deptName: '市场部', parentId: 100, orderNum: 3, leader: '王五', phone: '13700137000', email: 'mkt@example.com', status: '停用', createTime: '2024-01-04 00:00:00' },
    ]
  }
];

// 计算属性，为上级部门选择器构造数据，增加一个顶级的“根部门”
const treeDataWithOptions = computed(() => {
  return [{ deptId: 0, deptName: '根部门', children: treeData.value }];
});

const fetchDepartments = async () => {
  if (USE_REAL_API) {
    try {
      treeData.value = await getDepartments();
    } catch (error) { console.error(error); }
  } else {
    treeData.value = mockDeptDataSource;
  }
};

onMounted(() => { fetchDepartments(); });

const handleAdd = (data) => {
  // 重置表单
  Object.keys(deptForm).forEach(key => deptForm[key] = key === 'orderNum' ? 0 : (key === 'parentId' ? 0 : null));
  deptForm.status = '正常';

  if (data && data.deptId) {
    deptForm.parentId = data.deptId;
    dialog.title = '新增子部门';
  } else {
    dialog.title = '新增部门';
  }
  dialog.visible = true;
};

const handleEdit = (data) => {
  dialog.title = '编辑部门';
  dialog.visible = true;
  nextTick(() => Object.assign(deptForm, data));
};

const handleDelete = async (data) => {
  await ElMessageBox.confirm(`是否确认删除名称为 "${data.deptName}" 的数据项? 如果存在子部门，也将会一同被删除。`, '提示', { type: 'warning' });
  if (USE_REAL_API) {
    try {
      await deleteDepartment(data.deptId);
      ElMessage.success('删除成功！');
      fetchDepartments();
    } catch(error) { /* ... */ }
  } else {
    ElMessage.success('删除成功（模拟）');
  }
};

const handleSubmit = async () => {
  await deptFormRef.value.validate();
  if (USE_REAL_API) {
    try {
      if (deptForm.deptId) {
        await updateDepartment(deptForm.deptId, deptForm);
        ElMessage.success('修改成功！');
      } else {
        await addDepartment(deptForm);
        ElMessage.success('新增成功！');
      }
      dialog.visible = false;
      fetchDepartments();
    } catch (error) { /* ... */ }
  } else {
    ElMessage.success('保存成功（模拟）');
    dialog.visible = false;
  }
};
</script>

<style scoped>
.content-pane{padding:0 20px}.toolbar{margin-bottom:15px}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
.department-tree {
  max-width: 600px;
}
</style>