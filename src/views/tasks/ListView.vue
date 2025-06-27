<template>
  <div>
    <el-form :model="searchForm" inline class="search-form">
      <el-form-item label="任务编号">
        <el-input v-model="searchForm.taskId" placeholder="请输入任务编号" clearable />
      </el-form-item>
      <el-form-item label="任务名称">
        <el-input v-model="searchForm.taskName" placeholder="请输入任务名称" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="请选择任务状态" clearable style="width: 150px;">
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
        <el-date-picker v-model="searchForm.plannedDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
      </el-form-item>
      <el-form-item label="实际时间">
        <el-date-picker v-model="searchForm.actualDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="toolbar">
      <el-button type="primary" :icon="Download" @click="handleExport">导出</el-button>
      <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
    </div>

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
      <el-table-column label="计划时间" width="260">
        <template #default="{ row }">
          <div>开始: {{ row.plannedStartTime }}</div>
          <div>结束: {{ row.plannedEndTime }}</div>
        </template>
      </el-table-column>
      <el-table-column label="实际时间" width="260">
        <template #default="{ row }">
          <div>开始: {{ row.actualStartTime || '--' }}</div>
          <div>结束: {{ row.actualEndTime || '--' }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="creator" label="创建人" />
      <el-table-column prop="executor" label="执行人" />
      <el-table-column prop="uploadTime" label="数据上传时间" width="160" />
      <el-table-column label="操作" width="80" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
        class="pagination-container"
        :current-page="pagination.currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Download } from '@element-plus/icons-vue';

const emit = defineEmits(['view-detail']);

const route = useRoute();
const highlightedTaskId = ref(route.query.highlight || null);
const loading = ref(false);
const searchForm = reactive({ taskId: '', taskName: '', status: '', creator: '', executor: '', plannedDateRange: null, actualDateRange: null });
const tableData = ref([]);
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 0 });

const mockDataSource = [
  { id: 1, taskId: 'TASK-20250626-001', taskName: '1号线隧道巡检', taskType: '例行巡检', priority: '高', description: '对1号线K10-K15段进行全面结构巡检。', creator: '张三', executor: '李四', helper: '王二麻子', plannedStartTime: '2025-06-26 09:00', plannedEndTime: '2025-06-26 12:00', actualStartTime: '2025-06-26 09:05', actualEndTime: '2025-06-26 11:45', line: '1号线', startLocation: 'K10', endLocation: 'K15', scope: '全断面', status: '已完成', progress: 100, result: '巡检完成，发现3处轻微裂缝。', problemsFound: 3, uploadTime: '2025-06-26 13:00' },
  { id: 2, taskId: 'TASK-20250627-001', taskName: '2号线设备检查', taskType: '专项检查', priority: '中', description: '检查2号线信号机S5-S8状态。', creator: '王五', executor: '赵六', helper: '孙七', plannedStartTime: '2025-06-27 14:00', plannedEndTime: '2025-06-27 16:00', actualStartTime: '2025-06-27 14:10', actualEndTime: '', line: '2号线', startLocation: 'S5信号机', endLocation: 'S8信号机', scope: '信号设备', status: '进行中', progress: 60, result: '正在处理中...', problemsFound: 1, uploadTime: '' },
  { id: 3, taskId: 'TASK-20250628-001', taskName: '3号线日常巡视', taskType: '日常巡视', priority: '低', description: '3号线全线轨道异物巡视。', creator: '陈七', executor: '吴八', helper: '周九', plannedStartTime: '2025-06-28 08:30', plannedEndTime: '2025-06-28 12:30', actualStartTime: '', actualEndTime: '', line: '3号线', startLocation: '始发站', endLocation: '终点站', scope: '轨道面', status: '待执行', progress: 0, result: '', problemsFound: 0, uploadTime: '' },
];

const tableRowClassName = ({ row }) => { if (row.taskId === highlightedTaskId.value) { return 'highlighted-row'; } return ''; };
const fetchData = () => {
  loading.value = true;
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
};

onMounted(() => { fetchData(); });
const handleSearch = () => { pagination.currentPage = 1; fetchData(); };
const handleReset = () => { Object.keys(searchForm).forEach(key => { searchForm[key] = key.includes('DateRange') ? null : ''; }); handleSearch(); };
const handleExport = () => { ElMessage.info('导出功能待实现'); };
const viewTaskDetail = (task) => { emit('view-detail', task); };
const getStatusTagType = (status) => { switch (status) { case '已完成': return 'success'; case '进行中': return 'primary'; case '已暂停': return 'warning'; case '已取消': return 'info'; default: return 'info'; }};
const handleDelete = (row) => { ElMessageBox.confirm(`确定删除任务 "${row.taskName}"?`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => { ElMessage.success('删除成功'); fetchData(); }); };
const handleSizeChange = (newSize) => { pagination.pageSize = newSize; fetchData(); };
const handleCurrentChange = (newPage) => { pagination.currentPage = newPage; fetchData(); };
</script>

<style scoped>
.search-form { background-color: #f5f7fa; padding: 20px 20px 0 20px; border-radius: 4px; margin-bottom: 20px; }
.toolbar { margin-bottom: 15px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
:deep(.highlighted-row) { background-color: #fdf6ec !important; }
:deep(.highlighted-row:hover > td) { background-color: #fdf6ec !important; }
</style>