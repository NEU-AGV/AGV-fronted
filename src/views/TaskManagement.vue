<template>
  <div class="task-management-container">
    <el-tabs v-model="activeTab" class="task-tabs">
      <el-tab-pane label="列表视图" name="list" />
      <el-tab-pane label="日历视图" name="calendar" />
    </el-tabs>

    <div class="tab-content">
      <ListView v-if="activeTab === 'list'" @view-detail="handleViewDetail" />
      <CalendarView v-if="activeTab === 'calendar'" @view-detail="handleViewDetail" />
    </div>

    <el-dialog 
      v-model="detailDialogVisible" 
      title="任务详情" 
      width="60%"
      custom-class="metro-dialog-dark"
      :modal-class="'metro-modal-dark'"
    >
      <div class="dialog-content stat-card">
        <el-descriptions 
          v-if="selectedTask" 
          :column="2" 
          border
          class="metro-descriptions"
        >
          <!-- 描述项内容保持不变 -->
          <el-descriptions-item label="任务ID">{{ selectedTask.taskId }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ selectedTask.taskName }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">{{ selectedTask.taskType }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityTagType(selectedTask.priority)">{{ selectedTask.priority }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedTask.description }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ selectedTask.creator }}</el-descriptions-item>
          <el-descriptions-item label="执行人">{{ selectedTask.executor }}</el-descriptions-item>
          <el-descriptions-item label="协助人" :span="2">{{ selectedTask.helper }}</el-descriptions-item>
          <el-descriptions-item label="计划开始时间">{{ selectedTask.plannedStartTime }}</el-descriptions-item>
          <el-descriptions-item label="计划结束时间">{{ selectedTask.plannedEndTime }}</el-descriptions-item>
          <el-descriptions-item label="实际开始时间">{{ selectedTask.actualStartTime || '--' }}</el-descriptions-item>
          <el-descriptions-item label="实际结束时间">{{ selectedTask.actualEndTime || '--' }}</el-descriptions-item>
          <el-descriptions-item label="巡检线路">{{ selectedTask.line }}</el-descriptions-item>
          <el-descriptions-item label="巡检范围">{{ selectedTask.scope }}</el-descriptions-item>
          <el-descriptions-item label="起始位置">{{ selectedTask.startLocation }}</el-descriptions-item>
          <el-descriptions-item label="结束位置">{{ selectedTask.endLocation }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="getStatusTagType(selectedTask.status)">{{ selectedTask.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="完成度">{{ selectedTask.progress }}%</el-descriptions-item>
          <el-descriptions-item label="发现问题数">{{ selectedTask.problemsFound }}</el-descriptions-item>
          <el-descriptions-item label="执行结果">{{ selectedTask.result }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button class="metro-btn" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ListView from './tasks/ListView.vue';
import CalendarView from './tasks/CalendarView.vue';

const activeTab = ref('list');
const detailDialogVisible = ref(false);
const selectedTask = ref(null);

const handleViewDetail = (task) => {
  selectedTask.value = task;
  detailDialogVisible.value = true;
};

const getStatusTagType = (status) => {
  switch (status) { 
    case '已完成': return 'success'; 
    case '进行中': return 'primary'; 
    case '已暂停': return 'warning'; 
    case '已取消': return 'info'; 
    default: return 'info'; 
  }
};

const getPriorityTagType = (priority) => {
  switch (priority) { 
    case '高': return 'danger'; 
    case '中': return 'warning'; 
    default: return 'primary'; 
  }
};
</script>

<style scoped lang="scss">
/* 主容器深色背景 */
.task-management-container {
  background-color: #0f1419;
  color: #e0e0e0;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}


/* 标签页样式 */
.task-tabs {
  flex-shrink: 0;
  
  :deep(.el-tabs__item) {
    color: rgba(224, 224, 224, 0.7);
    font-size: 16px;
    
    &.is-active {
      color: #00d4ff;
      font-weight: 600;
    }
    
    &:hover {
      color: #00d4ff;
    }
  }
  
  :deep(.el-tabs__active-bar) {
    background-color: #00d4ff;
    height: 3px;
  }
  
  :deep(.el-tabs__nav-wrap::after) {
    background-color: rgba(0, 212, 255, 0.3);
    height: 1px;
  }
}

.tab-content {
  flex-grow: 1;
  overflow-y: auto;
}

/* 弹窗样式 - 完全深色版本 */
:deep(.metro-dialog-dark) {
  background: rgba(10, 15, 20, 0.98) !important;
  border: 1px solid rgba(0, 212, 255, 0.5) !important;
  border-radius: 8px;
  box-shadow: 
    0 0 20px rgba(0, 212, 255, 0.25),
    inset 0 0 15px rgba(0, 212, 255, 0.1) !important;
  backdrop-filter: blur(12px);
  
  .el-dialog__header {
    border-bottom: 1px solid rgba(0, 212, 255, 0.3);
    padding: 18px 24px;
    margin-right: 0;
    
 
    
    .el-dialog__title {
      // 这里改为你想要的蓝色，比如 #00d4ff
      color: #00d4ff !important; 
      font-weight: 600;
      font-size: 20px;
      letter-spacing: 1px;
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }
    
    .el-dialog__headerbtn {
      top: 18px;
      right: 24px;
      
      .el-icon {
        color: #00d4ff;
        font-size: 22px;
        transition: all 0.3s;
        
        &:hover {
          color: #33e0ff;
          transform: rotate(90deg);
        }
      }
    }
  }
  
  .el-dialog__body {
    padding: 0;
    background: transparent !important;
    color: #e0e0e0;
  }
  
  .el-dialog__footer {
    border-top: 1px solid rgba(0, 212, 255, 0.3);
    padding: 16px 24px;
    background: rgba(10, 15, 20, 0.9) !important;
  }
}

/* 内容卡片 */
.dialog-content {
  background: rgba(5, 10, 15, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 6px;
  padding: 24px;
  margin: 24px;
  box-shadow: inset 0 0 10px rgba(0, 212, 255, 0.05);
}

/* 描述列表深度定制 */
:deep(.metro-descriptions) {
  --el-descriptions-item-bordered-label-background: rgba(0, 40, 50, 0.7);
  --el-descriptions-item-bordered-content-background: rgba(0, 20, 30, 0.7);
  --el-descriptions-border-color: rgba(0, 212, 255, 0.3);
  --el-descriptions-title-color: #00d4ff;
  
  .el-descriptions__header {
    margin-bottom: 20px;
    
    .el-descriptions__title {
      color: #00d4ff;
      font-weight: 600;
      font-size: 18px;
    }
  }
  
  .el-descriptions__label {
    color: #00d4ff !important;
    font-weight: 500;
    background: rgba(0, 40, 50, 0.7) !important;
    padding: 12px 16px !important;
  }
  
  .el-descriptions__content {
    color: #e0e0e0 !important;
    background: rgba(0, 20, 30, 0.7) !important;
    padding: 12px 16px !important;
  }
  
  .el-descriptions__body {
    background: transparent !important;
  }
  
  .el-descriptions__table {
    border: 1px solid rgba(0, 212, 255, 0.3) !important;
    
    th, td {
      border: 1px solid rgba(0, 212, 255, 0.3) !important;
    }
    
    th {
      background: rgba(0, 50, 60, 0.7) !important;
    }
  }
}

/* 按钮样式 - 霓虹效果 */
.metro-btn {
  background: rgba(0, 212, 255, 0.15) !important;
  border: 1px solid rgba(0, 212, 255, 0.6) !important;
  color: #00d4ff !important;
  font-weight: 500;
  letter-spacing: 1px;
  padding: 10px 24px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba(0, 212, 255, 0.25) !important;
    transform: translateY(-2px);
    box-shadow: 
      0 4px 15px rgba(0, 212, 255, 0.3),
      0 0 10px rgba(0, 212, 255, 0.2) !important;
    
    &::after {
      left: 120%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -60%;
    width: 40%;
    height: 200%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(0, 212, 255, 0.4) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: rotate(15deg);
    transition: all 0.6s;
  }
}

/* 标签样式 - 发光效果 */
:deep(.el-tag) {
  border: 1px solid;
  background-color: transparent !important;
  font-weight: 500;
  padding: 0 10px;
  height: 26px;
  line-height: 24px;
  
  &.el-tag--primary {
    color: #00d4ff !important;
    border-color: rgba(0, 212, 255, 0.6) !important;
    text-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
  }
  
  &.el-tag--success {
    color: #67c23a !important;
    border-color: rgba(103, 194, 58, 0.6) !important;
    text-shadow: 0 0 8px rgba(103, 194, 58, 0.3);
  }
  
  &.el-tag--warning {
    color: #e6a23c !important;
    border-color: rgba(230, 162, 60, 0.6) !important;
    text-shadow: 0 0 8px rgba(230, 162, 60, 0.3);
  }
  
  &.el-tag--danger {
    color: #f56c6c !important;
    border-color: rgba(245, 108, 108, 0.6) !important;
    text-shadow: 0 0 8px rgba(245, 108, 108, 0.3);
  }
  
  &.el-tag--info {
    color: #909399 !important;
    border-color: rgba(144, 147, 153, 0.6) !important;
    text-shadow: 0 0 8px rgba(144, 147, 153, 0.3);
  }
}


/* 响应式调整 */
@media (max-width: 1200px) {
  :deep(.metro-dialog-dark) {
    width: 70% !important;
  }
}

@media (max-width: 992px) {
  :deep(.metro-dialog-dark) {
    width: 80% !important;
  }
  
  .dialog-content {
    padding: 18px;
    margin: 18px;
  }
}

@media (max-width: 768px) {
  :deep(.metro-dialog-dark) {
    width: 90% !important;
  }
  
  :deep(.metro-descriptions) {
    :deep(.el-descriptions__item) {
      width: 100% !important;
    }
    
    .el-descriptions__label,
    .el-descriptions__content {
      padding: 10px 12px !important;
    }
  }
  
  .dialog-content {
    padding: 16px;
    margin: 16px;
  }
}

@media (max-width: 576px) {
  :deep(.metro-dialog-dark) {
    .el-dialog__header {
      padding: 14px 16px;
      
      .el-dialog__title {
        font-size: 18px;
      }
    }
    
    .el-dialog__footer {
      padding: 12px 16px;
    }
  }
  
  .metro-btn {
    padding: 8px 16px;
  }
}
</style>