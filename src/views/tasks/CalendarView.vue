<template>
  <FullCalendar :options="calendarOptions" />
</template>

<script setup>
import { reactive } from 'vue';
import { ElMessage } from 'element-plus';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const emit = defineEmits(['view-detail']);

// 关键改动：这里的模拟数据必须是完整的，才能在弹窗中显示全部详情
const mockDataSource = [
  { id: 1, taskId: 'TASK-20250626-001', taskName: '1号线隧道巡检', taskType: '例行巡检', priority: '高', description: '对1号线K10-K15段进行全面结构巡检。', creator: '张三', executor: '李四', helper: '王二麻子', plannedStartTime: '2025-06-26 09:00', plannedEndTime: '2025-06-26 12:00', actualStartTime: '2025-06-26 09:05', actualEndTime: '2025-06-26 11:45', line: '1号线', startLocation: 'K10', endLocation: 'K15', scope: '全断面', status: '已完成', progress: 100, result: '巡检完成，发现3处轻微裂缝。', problemsFound: 3, uploadTime: '2025-06-26 13:00' },
  { id: 2, taskId: 'TASK-20250627-001', taskName: '2号线设备检查', taskType: '专项检查', priority: '中', description: '检查2号线信号机S5-S8状态。', creator: '王五', executor: '赵六', helper: '孙七', plannedStartTime: '2025-06-27 14:00', plannedEndTime: '2025-06-27 16:00', actualStartTime: '2025-06-27 14:10', actualEndTime: '', line: '2号线', startLocation: 'S5信号机', endLocation: 'S8信号机', scope: '信号设备', status: '进行中', progress: 60, result: '正在处理中...', problemsFound: 1, uploadTime: '' },
  { id: 3, taskId: 'TASK-20250628-001', taskName: '3号线日常巡视', taskType: '日常巡视', priority: '低', description: '3号线全线轨道异物巡视。', creator: '陈七', executor: '吴八', helper: '周九', plannedStartTime: '2025-06-28 08:30', plannedEndTime: '2025-06-28 12:30', actualStartTime: '', actualEndTime: '', line: '3号线', startLocation: '始发站', endLocation: '终点站', scope: '轨道面', status: '待执行', progress: 0, result: '', problemsFound: 0, uploadTime: '' },
];

const getStatusColor = (status) => {
  switch (status) { case '已完成': return '#67c23a'; case '进行中': return '#409eff'; case '待执行': return '#909399'; default: return '#e6a23c'; }
};

const calendarOptions = reactive({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' },
  locale: 'zh-cn',
  buttonText: { today: '今天', month: '月', week: '周' },
  events: mockDataSource.map(task => ({
    id: String(task.id), // id 最好是字符串
    title: task.taskName,
    start: task.plannedStartTime.split(' ')[0],
    backgroundColor: getStatusColor(task.status),
    borderColor: getStatusColor(task.status),
    extendedProps: {
      fullTask: task // 将完整的任务对象存入
    }
  })),
  eventClick: (info) => {
    // 直接从事件的 extendedProps 中获取完整的任务对象
    const task = info.event.extendedProps.fullTask;
    if (task) {
      emit('view-detail', task);
    }
  },
});
</script>