<template>
  <div class="defect-management-container">
    <el-form :model="searchForm" inline class="search-form">
      <el-form-item label="所属任务">
        <el-input v-model="searchForm.taskName" placeholder="请输入任务名称" clearable />
      </el-form-item>
      <el-form-item label="缺陷类型">
        <el-input v-model="searchForm.defectType" placeholder="请输入缺陷类型" clearable />
      </el-form-item>
      <el-form-item label="严重程度">
        <el-select v-model="searchForm.severity" placeholder="请选择" clearable style="width: 120px;">
          <el-option label="高" value="高" />
          <el-option label="中" value="中" />
          <el-option label="低" value="低" />
        </el-select>
      </el-form-item>
      <el-form-item label="当前状态">
        <el-select v-model="searchForm.currentStatus" placeholder="请选择" clearable style="width: 120px;">
          <el-option label="待确认" value="待确认" />
          <el-option label="已确认" value="已确认" />
          <el-option label="处理中" value="处理中" />
          <el-option label="已整改" value="已整改" />
        </el-select>
      </el-form-item>
      <el-form-item label="发现时间">
        <el-date-picker v-model="searchForm.discoveryDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="tableData" border stripe v-loading="loading" style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="defectId" label="缺陷编号" width="180" />
      <el-table-column prop="taskName" label="关联任务" width="180">
        <template #default="{ row }">
          <el-link type="primary" @click="goToTask(row)">{{ row.taskName }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="defectType" label="缺陷类型" width="120" />
      <el-table-column label="缺陷图片" width="120" align="center">
        <template #default="{ row }">
          <el-image
              style="width: 80px; height: 60px; cursor: pointer;"
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              fit="cover"
              hide-on-click-modal
              preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column prop="severity" label="严重程度" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getSeverityTagType(row.severity)">{{ row.severity }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="currentStatus" label="当前状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.currentStatus)">{{ row.currentStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="discoveryTime" label="发现时间" width="160" />
      <el-table-column prop="discoverer" label="发现人员" width="100" />
      <el-table-column prop="handler" label="处理人员" width="100" />
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleImagePreview(row)">查看详情</el-button>
          <el-button link type="success">标记整改</el-button>
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

    <el-dialog v-model="dialogVisible" title="缺陷详情" width="60%">
      <div v-if="selectedDefect" class="detail-content">
        <el-descriptions :column="2" border title="基础信息">
          <el-descriptions-item label="缺陷编号">{{ selectedDefect.defectId }}</el-descriptions-item>
          <el-descriptions-item label="缺陷类型">{{ selectedDefect.defectType }}</el-descriptions-item>
          <el-descriptions-item label="严重程度">
            <el-tag :type="getSeverityTagType(selectedDefect.severity)">{{ selectedDefect.severity }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="是否属实">
            <el-tag :type="selectedDefect.isVerified ? 'success' : 'danger'">{{ selectedDefect.isVerified ? '是' : '否' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="缺陷描述" :span="2">{{ selectedDefect.description }}</el-descriptions-item>
          <el-descriptions-item label="缺陷图片" :span="2">
            <el-image :src="selectedDefect.imageUrl" fit="contain" style="width: 100%; max-height: 400px;" />
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions :column="2" border title="发现与处理信息" style="margin-top: 20px;">
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusTagType(selectedDefect.currentStatus)">{{ selectedDefect.currentStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="关联任务">{{ selectedDefect.taskName }}</el-descriptions-item>
          <el-descriptions-item label="发现人员">{{ selectedDefect.discoverer }}</el-descriptions-item>
          <el-descriptions-item label="发现时间">{{ selectedDefect.discoveryTime }}</el-descriptions-item>
          <el-descriptions-item label="确认人员">{{ selectedDefect.confirmer }}</el-descriptions-item>
          <el-descriptions-item label="确认时间">{{ selectedDefect.confirmationTime }}</el-descriptions-item>
          <el-descriptions-item label="处理人员">{{ selectedDefect.handler }}</el-descriptions-item>
          <el-descriptions-item label="处理完成时间">{{ selectedDefect.handlingCompletionTime }}</el-descriptions-item>
          <el-descriptions-item label="处理结果" :span="2">{{ selectedDefect.handlingResult }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // 1. 在这里补上引入
import { ElMessage } from 'element-plus';
import { Search, Refresh, Download } from '@element-plus/icons-vue';

const router = useRouter(); // 2. 在这里实例化 router
const loading = ref(false);
const dialogVisible = ref(false);
const selectedDefect = ref(null);

const searchForm = reactive({ taskName: '', defectType: '', severity: '', currentStatus: '', discoveryDateRange: null });
const tableData = ref([]);
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 0 });

const mockDataSource = [
  { id: 1, defectId: 'DEF-2024-001', taskId: 'TASK-20250626-001', taskName: '1号线隧道巡检', defectType: '裂缝', description: '隧道壁K125+600处发现横向裂缝，长约2.5米。', imageUrl: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg', severity: '中', isVerified: true, currentStatus: '已整改', discoverer: '李四', discoveryTime: '2025-06-26 10:30', discoveryMethod: '人工巡检', confirmer: '王主管', confirmationTime: '2025-06-26 14:00', handler: '维修一队', handlingStartTime: '2025-06-27 09:00', handlingCompletionTime: '2025-06-27 17:30', handlingResult: '已使用高标号水泥砂浆进行封堵修复。'},
  { id: 2, defectId: 'DEF-2024-002', taskId: 'TASK-20250627-001', taskName: '2号线设备检查', defectType: '渗水', description: '接触网支撑结构附近有明显水渍和滴漏。', imageUrl: 'https://fuss10.elemecdn.com/1/34/19aa98b1fcb2781c4fba33d850549jpeg.jpeg', severity: '高', isVerified: true, currentStatus: '处理中', discoverer: '赵六', discoveryTime: '2025-06-26 15:45', discoveryMethod: '例行检查', confirmer: '王主管', confirmationTime: '2025-06-27 09:00', handler: '抢修二队', handlingStartTime: '2025-06-28 10:00', handlingCompletionTime: '', handlingResult: ''},
  { id: 3, defectId: 'DEF-2024-003', taskName: '3号线日常巡视', defectType: '设备故障', description: '信号机S-34无显示，疑似电源故障。', imageUrl: 'https://fuss10.elemecdn.com/0/6f/e35ff375812e6b0020b6b4e8f9583jpeg.jpeg', severity: '高', isVerified: true, currentStatus: '已确认', discoverer: '吴八', discoveryTime: '2025-06-25 09:15', discoveryMethod: '人工巡检', confirmer: '刘工', confirmationTime: '2025-06-25 10:00', handler: '', handlingStartTime: '', handlingCompletionTime: '', handlingResult: ''},
  { id: 4, defectId: 'DEF-2024-004', taskName: '1号线隧道巡检', defectType: '照明问题', description: 'K130附近连续3盏照明灯不亮。', imageUrl: 'https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg', severity: '低', isVerified: true, currentStatus: '待确认', discoverer: '李四', discoveryTime: '2025-06-25 11:20', discoveryMethod: '人工巡检', confirmer: '', confirmationTime: '', handler: '', handlingStartTime: '', handlingCompletionTime: '', handlingResult: ''},
];

// --- 方法定义 ---
const fetchData = () => {
  loading.value = true;
  setTimeout(() => {
    const filteredData = mockDataSource.filter(item => {
      const discoveryDate = new Date(item.discoveryTime);
      const range = searchForm.discoveryDateRange;
      const isDateInRange = !range || (discoveryDate >= range[0] && discoveryDate <= range[1]);

      return (
          item.taskName.includes(searchForm.taskName) &&
          item.defectType.includes(searchForm.defectType) &&
          (!searchForm.severity || item.severity === searchForm.severity) &&
          (!searchForm.currentStatus || item.currentStatus === searchForm.currentStatus) &&
          isDateInRange
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

// 新增：跳转到任务管理页面的方法
const goToTask = (row) => {
  router.push({
    path: '/tasks',
    query: { highlight: row.taskId } // 传递任务ID用于高亮
  });
};

const handleSearch = () => { pagination.currentPage = 1; fetchData(); };
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = key.includes('DateRange') ? null : '';
  });
  handleSearch();
};
const handleExport = () => { ElMessage.info('导出功能待实现'); };

const handleImagePreview = (row) => {
  selectedDefect.value = row;
  dialogVisible.value = true;
};

const getSeverityTagType = (severity) => {
  switch (severity) { case '高': return 'danger'; case '中': return 'warning'; default: return 'info'; }
};
const getStatusTagType = (status) => {
  switch (status) { case '已整改': return 'success'; case '处理中': return 'primary'; case '已确认': return 'warning'; default: return 'info'; }
};

const handleSizeChange = (newSize) => { pagination.pageSize = newSize; fetchData(); };
const handleCurrentChange = (newPage) => { pagination.currentPage = newPage; fetchData(); };
</script>

<style scoped>
.defect-management-container { padding: 20px; background-color: #fff; border-radius: 4px; }
.search-form { background-color: #f5f7fa; padding: 20px 20px 0 20px; border-radius: 4px; margin-bottom: 20px; }
.toolbar { margin-bottom: 15px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
.detail-content { max-height: 60vh; overflow-y: auto; }
:deep(.el-descriptions__title) { font-size: 16px; }
</style>