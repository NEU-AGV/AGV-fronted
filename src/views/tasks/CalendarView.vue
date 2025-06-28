<template>
  <FullCalendar :options="calendarOptions" />
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
// 1. 引入新建的API
import { getTasks } from '@/api/tasks.js';

// --- 开关：设置为 true 时将调用真实API --,-
const USE_REAL_API = false;

const emit = defineEmits(['view-detail']);

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
  // 2. 改造 events 属性为一个函数，这样日历在切换月份时会自动调用它
  events: async (fetchInfo, successCallback, failureCallback) => {
    if (USE_REAL_API) {
      try {
        // 从 fetchInfo 中获取当前视图的起止日期
        const params = {
          startDate: fetchInfo.startStr,
          endDate: fetchInfo.endStr
        };
        const tasks = await getTasks(params); // 后端应返回该时间段内的所有任务
        const events = tasks.list.map(task => ({
          id: String(task.id),
          title: task.taskName,
          start: task.plannedStartTime.split(' ')[0],
          backgroundColor: getStatusColor(task.status),
          borderColor: getStatusColor(task.status),
          extendedProps: { fullTask: task }
        }));
        successCallback(events);
      } catch (error) {
        failureCallback(error);
      }
    } else {
      // 保留模拟数据逻辑
      const events = mockDataSource.map(task => ({
        id: String(task.id),
        title: task.taskName,
        start: task.plannedStartTime.split(' ')[0],
        backgroundColor: getStatusColor(task.status),
        borderColor: getStatusColor(task.status),
        extendedProps: { fullTask: task }
      }));
      successCallback(events);
    }
  },
  eventClick: (info) => {
    const task = info.event.extendedProps.fullTask;
    if (task) { emit('view-detail', task); }
  },
});
</script>