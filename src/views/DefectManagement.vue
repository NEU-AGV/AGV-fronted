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
        <el-select v-model="searchForm.severity"
                   placeholder="请选择"
                   clearable
                   style="width: 120px;"
                   popper-class="theme-tunnel-popper">
          <el-option label="高" value="高" />
          <el-option label="中" value="中" />
          <el-option label="低" value="低" />
        </el-select>
      </el-form-item>
      <el-form-item label="当前状态">
        <el-select v-model="searchForm.currentStatus" placeholder="请选择" popper-class="theme-tunnel-popper" clearable style="width: 120px;">
          <el-option label="待确认" value="待确认" />
          <el-option label="已确认" value="已确认" />
          <el-option label="处理中" value="处理中" />
          <el-option label="已整改" value="已整改" />
        </el-select>
      </el-form-item>
      <el-form-item label="发现时间">
        <el-date-picker v-model="searchForm.discoveryDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" popper-class="theme-tunnel-popper"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" class="submit-button" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" class="submit-button" @click="handleReset">重置</el-button>
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
          <el-button v-if="row.currentStatus !== '已整改'" link type="success" @click="handleMarkAsRectified(row)">标记整改</el-button>
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

    <el-dialog v-model="dialogVisible" title="缺陷详情" width="60%" custom-class="metro-dialog"
               :modal-class="'metro-modal'">

      <div class="dialog-content stat-card">
        <el-descriptions
            :column="2"
            class="metro-descriptions"
            border
            title="基础信息"
        >
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

        <el-descriptions
            :column="2"
            class="metro-descriptions"
            border
            title="发现与处理信息"
            style="margin-top: 20px;"
        >
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
        <el-button @click="dialogVisible = false" class="close-button">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';
// 1. 引入新建的API
import { getDefects, updateDefectStatus } from '@/api/defects.js';

// --- 开关：设置为 true 时将调用真实API ---
const USE_REAL_API = false;

const router = useRouter();
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
const fetchData = async () => {
  loading.value = true;
  if (USE_REAL_API) {
    try {
      const params = {
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...searchForm
      };
      const response = await getDefects(params);
      tableData.value = response.list;
      pagination.total = response.total;
    } catch(error) {
      console.error("获取缺陷列表失败:", error);
    } finally {
      loading.value = false;
    }
  } else {
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
  }
}

onMounted(() => { fetchData(); });
// 3. 新增：标记为已整改的方法
const handleMarkAsRectified = async (row) => {
  await ElMessageBox.confirm(`确定要将缺陷 "${row.defectId}" 标记为“已整改”吗？`, '提示', { type: 'warning' });
  if (USE_REAL_API) {
    try {
      await updateDefectStatus(row.defectId, { status: '已整改' });
      ElMessage.success('状态更新成功！');
      fetchData(); // 刷新列表
    } catch (error) { /* ... */ }
  } else {
    const item = mockDataSource.find(d => d.id === row.id);
    if(item) item.currentStatus = '已整改';
    ElMessage.success('状态更新成功（模拟）');
    fetchData(); // 刷新列表
  }
}

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

const handleCurrentChange = (newPage) => { pagination.currentPage = newPage; fetchData(); };
</script>

<style scoped lang="scss">
.defect-management-container {   background-color: #0f1419;
  color: #fff;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px; }
.search-form { background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px; }

/* 提交按钮样式 */
.submit-button {
  background: #00d4ff;
  border-color: #00d4ff;
  color: #0f1419;
  border-radius: 20px;
  height: 40px;
  font-size: 16px;
  padding: 0 20px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.submit-button:hover {
  background: #33e0ff;
  border-color: #33e0ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 10px #00d4ff;
}

.submit-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 5px #00d4ff;
}

.submit-button.is-disabled,
.submit-button.is-disabled:hover {
  background: #00d4ff;
  border-color: #00d4ff;
  color: rgba(15, 20, 25, 0.6);
  cursor: not-allowed;
  transform: translateY(0);
  box-shadow: none;
}
.close-button{
  background: #00d4ff;
  border-color: #00d4ff;
  color: #0f1419;
  border-radius: 20px;
  height: 40px;
  font-size: 16px;
  padding: 0 20px;
  transition: all 0.3s;
}
.close-button:hover {
  background: #33e0ff;
  border-color: #33e0ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 10px #00d4ff;
}

.close-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 5px #00d4ff;
}

.close-button.is-disabled,
.close-button.is-disabled:hover {
  background: #00d4ff;
  border-color: #00d4ff;
  color: rgba(15, 20, 25, 0.6);
  cursor: not-allowed;
  transform: translateY(0);
  box-shadow: none;
}
/* 所有表单标签颜色 */
:deep(.el-form-item__label) {
  color: #00d4ff !important; /* 改为你想要的颜色，如蓝色 */
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
// 覆盖 el-tag 样式（关键）
:deep(.el-tag) {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
:deep(.el-tag--danger) {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid #aa6203;
  color: #aa6203 !important;
}
:deep(.el-tag--warning) {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid #906f15;
  color: #906f15 !important;
}
:deep(.el-tag--info) {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid #059f73;
  color: #059f73 !important;
}
:deep(.el-tag--success) {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid #948c8c;
  color: #948c8c !important;
}
:deep(.el-tag--primary) {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: rgba(0, 212, 255, 0.3) !important;
}
.toolbar { margin-bottom: 15px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
.detail-content { background-color: #0f1419;
  color: #fff;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px; }
.basic{
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
}
/* 修改基础信息标题颜色 */
:deep(.basic .el-descriptions__title) {
  color: #00d4ff !important;
}
/* 添加在 style 标签的底部 */
.detail-content :deep(.el-descriptions-item__label),
.detail-content :deep(.el-descriptions-item__content) {
  color: red !important;
}

.detail-content :deep(.el-descriptions-item__content .el-tag) {
  color: red !important;
  background-color: rgba(255, 0, 0, 0.1) !important;
  border-color: rgba(255, 0, 0, 0.3) !important;
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
</style>