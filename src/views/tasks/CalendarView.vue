<template>
  <div class="calendar-container">
    <div class="glass-card">
      <FullCalendar :options="calendarOptions" />
    </div>
  </div>
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
  switch (status) {
    case '已完成': return '#00800040';  // 透明绿色
    case '进行中': return '#9E9E9E40';  // 透明黄色
    case '待执行': return '#F5F5DC40';  // 透明橙色
    case '已延期': return '#DAA52040';  // 透明红色
    case '已取消': return '#80808040';  // 透明灰色
    default: return '#FFFFFFFF';       // 透明白色
  }
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

<style scoped>
/* 黑色背景容器 */
.calendar-container {
  position: relative;
  background: linear-gradient(145deg, #0a0a0a, #121212);
  border-radius: 16px;
  padding: 24px;
  min-height: 600px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
}

/* 玻璃框 - 亮蓝色边框 */
.glass-card {
  background: rgba(0, 212, 255, 0.15);
  border: 1px solid var(--primary-color, #00d4ff);
  backdrop-filter: blur(16px);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 1200px;
  box-shadow: 
    0 8px 30px rgba(0, 212, 255, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
  position: relative;
}

/* 日历组件基础 */
.fc {
  background-color: transparent;
  border-radius: 8px;
  position: relative;
  z-index: 1;
}

/* 文字颜色 */
.fc, .fc * {
  color: var(--primary-color, #00d4ff) !important;
}

/* 事件卡片 - 增强对比度样式 */
.fc-event {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05); /* 半透明背景 */
  border-radius: 4px;
  border-left: 3px solid;
  font-size: 11px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  
  /* 新增：增加内阴影提升对比度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 
              inset 0 1px 3px rgba(255, 255, 255, 0.05);
}

.fc-event:hover {
  background: rgba(0, 212, 255, 0.15); /* 悬停时背景更明显 */
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2),
              inset 0 1px 3px rgba(255, 255, 255, 0.1);
}

/* 状态颜色 - 增强边框和背景 */
.fc-event[style*="rgba(103, 194, 58"] { 
  border-left-color: #55ff00; 
  background-color: rgba(103, 194, 58, 0.1); /* 增加同色系背景 */
}
.fc-event[style*="rgba(0, 212, 255"] { 
  border-left-color: #872d81; 
  background-color: rgba(0, 212, 255, 0.1); /* 增加同色系背景 */
}
.fc-event[style*="rgba(144, 147, 153"] { 
  border-left-color: #909399; 
  background-color: rgba(144, 147, 153, 0.1); /* 增加同色系背景 */
}
.fc-event[style*="rgba(230, 162, 60"] { 
  border-left-color: #ff6302; 
  background-color: rgba(230, 162, 60, 0.1); /* 增加同色系背景 */
}

.fc-event-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
  color: #e0e0e0 !important;
  font-weight: 500; /* 增加文字粗细 */
}


.fc-event-selected .fc-event-main {
  background: rgba(0, 212, 255, 0.2) !important;
  border-left-width: 4px;
  transform: translateX(2px);
}

.fc-event-selected .fc-event-title {
  color: #fff !important;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .calendar-container {
    padding: 16px;
  }
  
  .glass-card {
    padding: 16px;
  }
  
  .fc-daygrid-day {
    min-height: 80px;
  }
}

@media (max-width: 768px) {
  .fc-toolbar {
    flex-direction: column;
    gap: 10px;
  }
  
  .fc-toolbar-chunk {
    width: 100%;
    text-align: center;
  }
  
  .fc-daygrid-day {
    min-height: 60px;
  }
}


</style>