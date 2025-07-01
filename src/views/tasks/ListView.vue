<template>
  <div class="defect-management-container">
    <!-- 搜索表单卡片 -->
    <div class="search-card stat-card">
      <el-form :model="searchForm" inline class="search-form-inner">
        <el-form-item label="任务编号">
          <el-input v-model="searchForm.taskId" placeholder="请输入任务编号" clearable />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.taskName" placeholder="请输入任务名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择任务状态" 
            clearable 
            style="width: 100%;"
            popper-class="theme-tunnel-popper"
          >
            <el-option label="待执行" value="待执行" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已暂停" value="已暂停" />
            <el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人">
          <el-input v-model="searchForm.creator" placeholder="请输入创建人" clearable />
        </el-form-item>
        <el-form-item label="执行人">
          <el-input v-model="searchForm.executor" placeholder="请输入执行人" clearable />
        </el-form-item>
        <el-form-item label="计划时间">
          <el-date-picker 
            v-model="searchForm.plannedDateRange" 
            type="daterange" 
            range-separator="至" 
            start-placeholder="开始日期" 
            end-placeholder="结束日期"
            popper-class="theme-tunnel-popper"
          />
        </el-form-item>
        <el-form-item label="实际时间">
          <el-date-picker 
            v-model="searchForm.actualDateRange" 
            type="daterange" 
            range-separator="至" 
            start-placeholder="开始日期" 
            end-placeholder="结束日期"
            popper-class="theme-tunnel-popper"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工具栏卡片 -->
    <div class="toolbar-card stat-card">
      <el-button type="primary" :icon="Download" @click="handleExport">导出</el-button>
      <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card stat-card">
      <el-table :data="tableData" border stripe v-loading="loading" style="width: 100%" :row-key="'id'" :row-class-name="tableRowClassName">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="taskId" label="任务编号" width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewTaskDetail(row)">{{ row.taskId }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="taskName" label="任务名称" width="180" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="计划时间" width="200">
          <template #default="{ row }">
            <div>开始: {{ row.plannedStartTime }}</div>
            <div>结束: {{ row.plannedEndTime }}</div>
          </template>
        </el-table-column>
        <el-table-column label="实际时间" width="200">
          <template #default="{ row }">
            <div>开始: {{ row.actualStartTime || '--' }}</div>
            <div>结束: {{ row.actualEndTime || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" />
        <el-table-column prop="executor" label="执行人" />
        <el-table-column prop="uploadTime" label="数据上传时间" width="160" />
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button link type="danger" @click="handleDelete(row)" class="action-btn">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
    </div>

    <!-- 分页卡片 -->
    <div class="pagination-card stat-card">
      <el-pagination
        class="pagination-container"
        :current-page="pagination.currentPage"
        :page-sizes="10"
        :page-size="pagination.pageSize"
        layout="total,  prev, pager, next, jumper"
        :total="pagination.total"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Download } from '@element-plus/icons-vue';


// 1. 引入新建的API
import { getTasks, deleteTask, exportTasks } from '@/api/tasks.js';


// --- 开关：设置为 true 时将调用真实API ---
const USE_REAL_API = false;

const emit = defineEmits(['view-detail']);

const route = useRoute()
// 修改 highlightedTaskId 的监听方式
const highlightedTaskId = ref(null)

const loading = ref(false);
const searchForm = reactive({ taskId: '', taskName: '', status: '', creator: '', executor: '', plannedDateRange: null, actualDateRange: null });
const tableData = ref([]);
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 0 });


const mockDataSource = [
  { id: 1, taskId: 'TASK-20250626-001', taskName: '1号线隧道巡检', taskType: '例行巡检', priority: '高', description: '对1号线K10-K15段进行全面结构巡检。', creator: '张三', executor: '李四', helper: '王二麻子', plannedStartTime: '2025-06-26 09:00', plannedEndTime: '2025-06-26 12:00', actualStartTime: '2025-06-26 09:05', actualEndTime: '2025-06-26 11:45', line: '1号线', startLocation: 'K10', endLocation: 'K15', scope: '全断面', status: '已完成', progress: 100, result: '巡检完成，发现3处轻微裂缝。', problemsFound: 3, uploadTime: '2025-06-26 13:00' },
  { id: 2, taskId: 'TASK-20250627-001', taskName: '2号线设备检查', taskType: '专项检查', priority: '中', description: '检查2号线信号机S5-S8状态。', creator: '王五', executor: '赵六', helper: '孙七', plannedStartTime: '2025-06-27 14:00', plannedEndTime: '2025-06-27 16:00', actualStartTime: '2025-06-27 14:10', actualEndTime: '', line: '2号线', startLocation: 'S5信号机', endLocation: 'S8信号机', scope: '信号设备', status: '进行中', progress: 60, result: '正在处理中...', problemsFound: 1, uploadTime: '' },
  { id: 3, taskId: 'TASK-20250628-001', taskName: '3号线日常巡视', taskType: '日常巡视', priority: '低', description: '3号线全线轨道异物巡视。', creator: '陈七', executor: '吴八', helper: '周九', plannedStartTime: '2025-06-28 08:30', plannedEndTime: '2025-06-28 12:30', actualStartTime: '', actualEndTime: '', line: '3号线', startLocation: '始发站', endLocation: '终点站', scope: '轨道面', status: '待执行', progress: 0, result: '', problemsFound: 0, uploadTime: '' },
];

// 表格行样式
const tableRowClassName = ({ row }) => {
  if (row.taskId === highlightedTaskId.value) {
    return 'highlighted-row';
  }
  return '';
};

// 2. 改造核心数据获取方法
const fetchData = async () => {
  loading.value = true;
  if (USE_REAL_API) {
    try {
      const params = {
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...searchForm
      };
      // 实际调用API
      const response = await getTasks(params);
      tableData.value = response.list;
      pagination.total = response.total;
    } catch (error) {
      console.error("获取任务列表失败:", error);
    } finally {
      loading.value = false;
    }
  } else {
    setTimeout(() => {
      const filteredData = mockDataSource.filter(item => {
        const plannedDate = new Date(item.plannedStartTime);
        const plannedRange = searchForm.plannedDateRange;
        const isPlannedDateInRange = !plannedRange || (plannedDate >= plannedRange[0] && plannedDate <= plannedRange[1]);
        const actualDate = item.actualStartTime ? new Date(item.actualStartTime) : null;
        const actualRange = searchForm.actualDateRange;
        const isActualDateInRange = !actualRange || (actualDate && actualDate >= actualRange[0] && actualDate <= actualRange[1]);
        return (
            item.taskId.includes(searchForm.taskId) &&
            item.taskName.includes(searchForm.taskName) &&
            item.creator.includes(searchForm.creator) &&
            item.executor.includes(searchForm.executor) &&
            (!searchForm.status || item.status === searchForm.status) &&
            isPlannedDateInRange &&
            isActualDateInRange
        );
      });
      pagination.total = filteredData.length;
      const start = (pagination.currentPage - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      tableData.value = filteredData.slice(start, end);
      loading.value = false;
    }, 500);
  }
}

onMounted(() => {
  // 初始化高亮任务ID
  highlightedTaskId.value = route.query.highlight || '';
  console.log('初始化高亮任务ID:', highlightedTaskId.value);
  
  // 加载数据
  fetchData();
});

// 高亮指定任务
const highlightTask = () => {
  console.log('尝试高亮任务ID:', highlightedTaskId.value);
  
  // 检查是否有需要高亮的任务
  if (highlightedTaskId.value) {
    // 检查任务是否在当前页
    const taskExists = tableData.value.some(task => task.taskId === highlightedTaskId.value);
    
    if (!taskExists && pagination.total > 0) {
      // 任务不在当前页，尝试定位到该任务所在页
      console.log('任务不在当前页，尝试定位...');
      
      // 简化处理：重置到第一页重新搜索
      pagination.currentPage = 1;
      fetchData();
    }
  }
};



const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除任务 "${row.taskName}"?`, '提示', { type: 'warning' });
  if (USE_REAL_API) {
    try {
      await deleteTask(row.taskId);
      ElMessage.success('删除成功');
      fetchData();
    } catch(error) { /* Interceptor handles message */ }
  } else {
    // 模拟删除
    const index = mockDataSource.findIndex(item => item.id === row.id);
    if (index !== -1) mockDataSource.splice(index, 1);
    ElMessage.success('删除成功（模拟）');
    fetchData();
  }
}
const handleSearch = () => { pagination.currentPage = 1; fetchData(); };
const handleReset = () => { Object.keys(searchForm).forEach(key => { searchForm[key] = key.includes('DateRange') ? null : ''; }); handleSearch(); };
const handleExport = () => { ElMessage.info('导出功能待实现'); };
const viewTaskDetail = (task) => { emit('view-detail', task); };
const getStatusTagType = (status) => { switch (status) { case '已完成': return 'success'; case '进行中': return 'primary'; case '已暂停': return 'warning'; case '已取消': return 'info'; default: return 'info'; }};
const handleSizeChange = (newSize) => { pagination.pageSize = newSize; fetchData(); };
const handleCurrentChange = (newPage) => { pagination.currentPage = newPage; fetchData(); };



</script>

<style scoped>
/* 主容器深色背景 */
.defect-management-container {
  background-color: #0f1419;
  color: #fff;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  padding-bottom: 120px;
  overflow: hidden;
}

/* 应用主界面 stat-card 样式 */
.stat-card {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
}

/* 搜索表单内部样式优化 */
.search-form-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.search-form-inner .el-form-item {
  margin-bottom: 0;
  flex: 1 1 calc(25% - 15px);
  min-width: 180px;
}

.search-form-inner .el-form-item__label {
  color: #00d4ff;
  font-weight: 500;
  white-space: nowrap;
  padding-right: 10px;
}

/* --- 1. 美化搜索区域的输入框和选择框 --- */
:deep(.search-form-inner .el-input__wrapper),
:deep(.search-form-inner .el-date-editor .el-range-input),
:deep(.search-form-inner .el-select__wrapper) {
  background-color: #0f1419 !important; /* 设置为页面的主背景色 */
  box-shadow: none !important; /* 移除 Element Plus 自带的阴影 */
  border: 1px solid rgba(0, 212, 255, 0.3) !important; /* 使用主题边框色 */
  color: #c1f0ff; /* 设置输入文字的颜色 */
}

/* 修复日期选择器在深色背景下的文字颜色 */
:deep(.search-form-inner .el-range-input) {
  color: #c1f0ff !important;
}

/* 修复下拉框箭头的颜色 */
:deep(.search-form-inner .el-select .el-select__caret) {
  color: #00d4ff;
}

.search-form-inner .el-input:focus, 
.search-form-inner .el-select:focus,
.search-form-inner .el-date-picker:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.3);
}

.search-form-inner .el-input::placeholder, 
.search-form-inner .el-select__placeholder {
  color: #777;
}

.search-form-inner .el-button {
  background: #00d4ff;
  color: #0f1419;
  border-color: #00d4ff;
  min-width: 100px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-form-inner .el-button:hover {
  background: #33e0ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.search-form-inner .el-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 6px rgba(0, 212, 255, 0.2);
}

.search-form-inner .el-date-picker {
  width: 100%;
}

/* 响应式优化 */
@media (max-width: 1200px) {
  .search-form-inner .el-form-item {
    flex: 1 1 calc(33.33% - 15px);
  }
}

@media (max-width: 768px) {
  .search-form-inner .el-form-item {
    flex: 1 1 100%;
  }
}

/* 工具栏样式 */
.toolbar-card {
  display: flex;
  gap: 10px;
}

.toolbar-card .el-button {
  background: #00d4ff;
  color: #0f1419;
  border-color: #00d4ff;
}

.toolbar-card .el-button:hover {
  background: #33e0ff;
}

/* 表格样式优化 */
:deep(.el-table) {
  --el-table-text-color: #c1f0ff;
  --el-table-header-text-color: #00d4ff;
  --el-table-row-hover-bg-color: rgba(0, 232, 255, 0.15); /* 悬停颜色变亮 */
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

/* --- 2. 美化分页组件 --- */
.pagination-card .pagination-container {
  /* 确保分页组件的背景透明，以显示父容器的颜色 */
  background-color: transparent !important;
  padding: 10px 5px;
  border-radius: 4px;
  margin-top: 0;
  justify-content: flex-end;
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

/* 强制高亮样式（更高优先级） */
:deep(.el-table__body tr.highlighted-row) {
  background-color: rgba(255, 255, 0, 0.2) !important;
  position: relative;
}

/* 高亮行金色强烈发光效果 */
.highlighted-row {
  background-color: rgba(255, 217, 0, 0.3) !important;       /* 金色半透明背景，饱和度更高 */
  box-shadow: 0 0 25px 8px rgba(255, 215, 0, 0.5) !important; /* 扩大发光范围，增强亮度 */
  position: relative;
  z-index: 2;                                             /* 提升层级，避免被遮挡 */
  animation: goldenPulse 1.8s infinite;                    /* 延长动画周期，效果更明显 */
}

@keyframes goldenPulse {
  0% {
    box-shadow: 0 0 15px 5px rgba(255, 215, 0, 0.3);
  }
  50% {
    box-shadow: 0 0 30px 12px rgba(255, 215, 0, 0.7);     /* 峰值时更强的发光效果 */
  }
  100% {
    box-shadow: 0 0 15px 5px rgba(255, 215, 0, 0.3);
  }
}

/* 所有表单标签颜色 */
:deep(.el-form-item__label) {
  color: #00d4ff; /* 改为你想要的颜色，如蓝色 */
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
  animation: trainMove 30s linear infinite;
}

@keyframes trainMove {
  0% { background-position: 0 0; }
  100% { background-position: -1200px 0; }
}

/* 霓虹灯效果弹窗 */
:deep(.metro-dialog) {
  background: rgba(15, 23, 30, 0.9) !important;
  border: 1px solid rgba(0, 212, 255, 0.3) !important;
  border-radius: 8px !important;
  box-shadow:
      0 8px 32px rgba(0, 212, 255, 0.15),
      inset 0 1px 1px rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(12px) !important;

  .el-dialog__header {
    border-bottom: 1px solid rgba(0, 212, 255, 0.3) !important;
    padding: 16px 20px !important;
    margin-right: 0 !important;

    .el-dialog__title {
      color: #00d4ff !important;
      font-weight: 600 !important;
      font-size: 18px !important;
      text-shadow: 0 0 8px rgba(0, 212, 255, 0.3) !important;
    }

    .el-dialog__headerbtn {
      top: 16px !important;

      .el-icon {
        color: #00d4ff !important;
        font-size: 20px !important;

        &:hover {
          color: #33e0ff !important;
        }
      }
    }
  }

  .el-dialog__body {
    padding: 0 !important;
    background: transparent !important;
    color: #e0e0e0 !important;
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(0, 212, 255, 0.3) !important;
    padding: 16px 20px !important;
    background: transparent !important;
  }
}

.dialog-content {
  background: rgba(0, 30, 40, 0.7) !important;
  border: 1px solid rgba(0, 212, 255, 0.3) !important;
  border-radius: 4px !important;
  padding: 20px !important;
  margin: 20px !important;
}

/* 科技感描述列表 */
:deep(.metro-descriptions) {
  --el-descriptions-item-bordered-label-background: rgba(0, 50, 60, 0.7) !important;
  --el-descriptions-item-bordered-content-background: rgba(0, 30, 40, 0.7) !important;
  --el-descriptions-border-color: rgba(0, 212, 255, 0.3) !important;
  --el-descriptions-title-color: #00d4ff !important;

  .el-descriptions__header {
    margin-bottom: 16px !important;

    .el-descriptions__title {
      color: #00d4ff !important;
      font-weight: 600 !important;
    }
  }

  .el-descriptions__label {
    color: #00d4ff !important;
    font-weight: 500 !important;
    background: rgba(7, 16, 18, 0.7) !important;
  }

  .el-descriptions__content {
    color: #e0e0e0 !important;
    background: rgba(0, 30, 40, 0.7) !important;
  }

  .el-descriptions__body {
    background: transparent !important;
  }

  .el-descriptions__table {
    border-color: rgba(0, 212, 255, 0.3) !important;

    th, td {
      border-color: rgba(0, 212, 255, 0.3) !important;
    }
  }
}

/* 霓虹按钮 */
.metro-btn {
  background: rgba(0, 212, 255, 0.2) !important;
  border: 1px solid rgba(0, 212, 255, 0.5) !important;
  color: #00d4ff !important;
  font-weight: 500 !important;
  transition: all 0.3s !important;

  &:hover {
    background: rgba(0, 212, 255, 0.3) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2) !important;
  }
}

/* 模态背景 */
:deep(.metro-modal) {
  background-color: rgba(15, 20, 25, 0.8) !important;
  backdrop-filter: blur(5px) !important;
}

/* 移除原有的.detail-content样式 */
.detail-content {
  background-color: transparent !important;
  padding: 0 !important;
  gap: 0 !important;
}

/* 移除原有的.basic样式 */
.basic {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
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

/* (2) 日期选择器 (el-date-picker) 的样式 */
.theme-tunnel-popper.el-picker__popper {
  .el-picker-panel {
    background-color: transparent !important;
    color: #e0e0e0;
  }

  .el-date-range-picker__content.is-left {
    border-right: 1px solid rgba(0, 229, 255, 0.3) !important;
  }

  .el-date-table th, .el-date-picker__header-label, .el-picker-panel__icon-btn {
    color: #e0e0e0;
  }

  .el-date-table-cell {
    color: #e0e0e0;
    &:hover {
      color: #00e5ff !important;
    }
    &.in-range {
      background-color: rgba(0, 229, 255, 0.15) !important;
    }
    &.today .el-date-table-cell__text {
      color: #00e5ff !important;
    }
  }

  .el-date-table td.start-date .el-date-table-cell,
  .el-date-table td.end-date .el-date-table-cell {
    background-color: #00e5ff !important;
    .el-date-table-cell__text {
      color: #0d1b2a !important;
    }
  }
  .el-picker-panel__footer {
    background-color: #0d1b2a;
    border-top: 1px solid rgba(0, 229, 255, 0.3);
  }
}

/* 添加在现有样式中 */
.time-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;  /* 根据实际需要调整 */
}

</style>