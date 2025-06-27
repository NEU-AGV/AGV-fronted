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

    <el-dialog v-model="detailDialogVisible" title="任务详情" width="60%">
      <el-descriptions v-if="selectedTask" :column="2" border>
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
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
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
  switch (status) { case '已完成': return 'success'; case '进行中': return 'primary'; case '已暂停': return 'warning'; case '已取消': return 'info'; default: return 'info'; }
};
const getPriorityTagType = (priority) => {
  switch (priority) { case '高': return 'danger'; case '中': return 'warning'; default: return 'primary'; }
}
</script>

<style scoped>
.task-management-container {
  display: flex;
  flex-direction: column;
  /* 确保在布局内部可以撑满高度 */
  height: calc(100vh - 140px); /* 视您的整体布局header和padding而定，可调整 */
}
.task-tabs {
  flex-shrink: 0;
}
.tab-content {
  flex-grow: 1;
  overflow-y: auto;
}
</style>