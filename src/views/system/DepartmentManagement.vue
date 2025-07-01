<template>
  <div>
    <div class="defect-management-container"></div>
  <div class="content-pane">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="handleAdd()">新增部门</el-button>
    </div>


    <div class="tree-container">
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
            <el-button link type="blue" :icon="Plus" @click.stop="handleAdd(data)">新增</el-button>
            <el-button link type="blue" :icon="EditPen" @click.stop="handleEdit(data)">修改</el-button>
            <el-button link type="danger" :icon="Delete" @click.stop="handleDelete(data)">删除</el-button>
          </span>
        </span>
      </template>
    </el-tree>
  </div>
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
        <el-button type="primary" @click="dialog.visible = false">取 消</el-button>
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
  width: 100%;  /* 占满容器宽度 */
  max-width: none;  /* 移除最大宽度限制 */
}

.content-pane {
  background-color: #0f1419;
  color: #fff;
  padding: 30px;
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

/* 新增树容器玻璃框样式 */
.tree-container {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 30px;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.15);  /* 添加阴影增强立体感 */
  
}

/* 树组件样式调整 */
:deep(.department-tree) {
  background: transparent;
  border: none;
}

:deep(.el-tree-node__label) {
  color: #ccc;
}

:deep(.el-tree-node:focus > .el-tree-node__content),
:deep(.el-tree-node__content:hover) {
  background-color: rgba(0, 212, 255, 0.2);
}

:deep(.el-tree-node__expand-icon) {
  color: rgba(255, 255, 255, 0.7);
}



/* 表单标签、表格表头 颜色*/
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
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
  color: #ccc; 
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

</style>