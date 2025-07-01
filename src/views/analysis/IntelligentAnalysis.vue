<template>
  <div class="analysis-container">
    <el-row :gutter="20" style="height: 100%;">
      <el-col :span="12" class="left-panel">
        <el-card class="box-card video-card">
          <template #header><span>视频流展示</span></template>
          <video src="https://www.w3schools.com/html/mov_bbb.mp4" controls autoplay muted loop class="video-player"></video>
        </el-card>
        <el-card class="box-card gallery-card">
          <template #header><span>CV模型截取缺陷图片 (点击选择)</span></template>
          <div class="image-gallery">
            <div
                v-for="defect in detectedDefects"
                :key="defect.imageId"
                class="gallery-item"
                :class="{ active: selectedDefectImage && selectedDefectImage.imageId === defect.imageId }"
                @click="selectDefectImage(defect)"
            >
              <el-image :src="defect.imageUrl" fit="cover" />
              <div class="item-overlay">
                <span>{{ defect.preliminary.type }} ({{ defect.preliminary.confidence * 100 }}%)</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12" class="right-panel">
        <el-card class="box-card form-card">
          <template #header><span>缺陷信息录入与提交</span></template>

          <div class="selected-image-preview">
            <el-image v-if="selectedDefectImage" :src="selectedDefectImage.imageUrl" fit="contain" />
            <div v-else class="image-placeholder">
              <el-icon><Picture /></el-icon>
              <span>请从左侧选择一张图片</span>
            </div>
          </div>

          <el-form ref="defectFormRef" :model="defectForm" :rules="defectFormRules" label-width="80px" label-position="top">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="关联任务" prop="linkedTaskId">
                  <el-select v-model="defectForm.linkedTaskId" placeholder="请选择或搜索关联任务" filterable style="width: 100%;" popper-class="theme-tunnel-popper">
                    <el-option v-for="task in mockTasks" :key="task.taskId" :label="task.taskName" :value="task.taskId" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发现人员" prop="discoverer">
                  <el-input v-model="defectForm.discoverer" placeholder="请输入发现人员姓名" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="缺陷位置" prop="location">
                  <el-input v-model="defectForm.location" placeholder="例如: K12+300" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="缺陷类型" prop="defectType">
                  <el-input v-model="defectForm.defectType" placeholder="请输入缺陷类型" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="严重程度" prop="severity">
              <el-select v-model="defectForm.severity" placeholder="请选择严重程度" style="width: 100%;" popper-class="theme-tunnel-popper">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </el-form-item>
            <el-form-item label="缺陷描述" prop="description">
              <el-input v-model="defectForm.description"  placeholder="请输入详细描述" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" round class="submit-button" @click="handleSubmit" :disabled="!selectedDefectImage">提交缺陷记录
              </el-button>
</el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
// 1. 引入所有需要的API函数
import { getTasks } from '@/api/tasks.js';
import { addDefect } from '@/api/defects.js';
import { getVideoSource } from '@/api/analysis.js';

// --- 开关：设置为 true 时将调用真实API ---
const USE_REAL_API = false;

const defectFormRef = ref(null);
let wsConnection = null; // 用于真实的WebSocket连接
let wsSimulator = null;  // 用于模拟的定时器

const videoUrl = ref('');
const detectedDefects = ref([]);
const selectedDefectImage = ref(null);
const mockTasks = ref([]);

const defectForm = reactive({
  linkedTaskId: '', defectType: '', severity: '',
  description: '', location: '', discoverer: 'admin',
});
const defectFormRules = {
  linkedTaskId: [{ required: true, message: '请关联一个任务', trigger: 'change' }],
  defectType: [{ required: true, message: '请输入缺陷类型', trigger: 'blur' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  location: [{ required: true, message: '请输入缺陷位置', trigger: 'blur' }],
  discoverer: [{ required: true, message: '请输入发现人员姓名', trigger: 'blur' }], // 新增验证
};

// 2. 改造 onMounted，区分真实和模拟逻辑
onMounted(async () => {
  if (USE_REAL_API) {
    // --- 真实API逻辑 ---
    // 1. 获取视频流地址
    try {
      const res = await getVideoSource();
      videoUrl.value = res.url;
    } catch (error) { console.error("获取视频流失败:", error); }

    // 2. 获取任务列表用于下拉框
    try {
      const res = await getTasks({ page: 1, pageSize: 100 }); // 获取前100个任务作选项
      mockTasks.value = res.list;
    } catch (error) { console.error("获取任务列表失败:", error); }

    // 3. 建立WebSocket连接
    wsConnection = new WebSocket('ws://your-server.com/ws/cv-analysis');
    wsConnection.onmessage = (event) => {
      const newDefect = JSON.parse(event.data);
      if (newDefect.type === 'NEW_DEFECT_DETECTED') {
        detectedDefects.value.unshift(newDefect.payload);
      }
    };
  } else {
    // --- 模拟数据逻辑 (保持不变) ---
    videoUrl.value = "https://www.w3schools.com/html/mov_bbb.mp4";
    mockTasks.value = [
      { taskId: 'TASK-20250626-001', taskName: '1号线隧道巡检' },
      { taskId: 'TASK-20250627-001', taskName: '2号线设备检查' },
    ];
  wsSimulator = setInterval(() => {
    if (detectedDefects.value.length > 10) return;
    const newDefect = {
      imageId: `img-${Date.now()}`,
      imageUrl: sampleImages[imageCounter % sampleImages.length],
      timestamp: Date.now(),
      preliminary: {
        type: sampleTypes[imageCounter % sampleTypes.length],
        confidence: (Math.random() * (0.98 - 0.85) + 0.85).toFixed(2),
        location: sampleLocations[imageCounter % sampleLocations.length] // AI分析出的位置
      }
    };
    detectedDefects.value.unshift(newDefect);
    imageCounter++;
  }, 5000);}
});

onUnmounted(() => {
  // 组件销毁时，关闭连接或清除定时器
  if (wsConnection) wsConnection.close();
  if (wsSimulator) clearInterval(wsSimulator);
});

const selectDefectImage = (defect) => {
  selectedDefectImage.value = defect;
  defectForm.defectType = defect.preliminary.type;
  defectForm.location = defect.preliminary.location; // 预填位置信息
};

// 3. 改造 handleSubmit，调用真实API
const handleSubmit = async () => {
  await defectFormRef.value.validate();

  const taskName = mockTasks.value.find(t => t.taskId === defectForm.linkedTaskId)?.taskName || '';
  const finalDefectData = {
        id: Date.now(),
        defectId: `DEF-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
        taskId: defectForm.linkedTaskId,
        taskName: taskName,
        defectType: defectForm.defectType,
        description: defectForm.description,
        location: defectForm.location, // 新增
        imageUrl: selectedDefectImage.value.imageUrl,
        severity: defectForm.severity,
        isVerified: false, // 默认值
        currentStatus: '待确认', // 默认值
        discoverer: defectForm.discoverer, // 使用表单中填写的人员
        discoveryTime: new Date().toLocaleString('zh-CN', { hour12: false }), // 使用标准格式
        discoveryMethod: '智能识别', // 自动填充
        // 以下字段在创建时为空，待后续流程中更新
        confirmer: '',
        confirmationTime: '',
        handler: '',
        handlingStartTime: '',
        handlingCompletionTime: '',
        handlingResult: '',
      };

  if (USE_REAL_API) {
    try {
      await addDefect(finalDefectData);
      ElMessage.success('缺陷记录提交成功！');
      // ... (提交成功后的清理逻辑)
    } catch (error) { /* ElMessage is handled in interceptor */ }
  } else {
    console.log('准备提交到后端的缺陷数据对象:', finalDefectData);
    ElMessage.success('提交成功！请在浏览器控制台查看数据对象。');
    // ... (提交成功后的清理逻辑)
  }
};
</script>

<style scoped>
.analysis-container {
  background-color: #0f1419;
  color: #fff;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.box-card {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
}
/* --- 1. 美化搜索区域的输入框和选择框 --- */
:deep(.form-card .el-input__wrapper),
:deep(.form-card .el-date-editor .el-range-input),
:deep(.form-card .el-select__wrapper) {
  background-color: #0f1419 !important; /* 设置为页面的主背景色 */
  box-shadow: none !important; /* 移除 Element Plus 自带的阴影 */
  border: 1px solid rgba(0, 212, 255, 0.3) !important; /* 使用主题边框色 */
  color: #c1f0ff; /* 设置输入文字的颜色 */
}

/* 修复日期选择器在深色背景下的文字颜色 */
:deep(.form-card .el-range-input) {
  color: #c1f0ff !important;
}

/* 修复下拉框箭头的颜色 */
:deep(.form-card .el-select .el-select__caret) {
  color: #00d4ff;
}

.video-card .el-card__header span,
.right-panel .form-card .el-card__header span,
.gallery-card .el-card__header span {
  font-size: 16px;
  margin-bottom: 15px;
  color: #00d4ff;
}

.selected-image-preview {
  width: 100%;
  height: 250px;
  background-color: rgba(0, 212, 255, 0.1); /* 改为半透明蓝色背景，与示例一致 */
  border: 1px solid rgba(0, 212, 255, 0.3); /* 改为实线边框，与示例一致 */
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
}

.image-placeholder {
  color: rgba(0, 212, 255, 0.7); /* 改为半透明蓝色文字，与示例一致 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.image-placeholder .el-icon {
  font-size: 40px;
  color: #00d4ff; /* 主色调图标，与示例一致 */
}

.image-placeholder span {
  font-size: 14px;
}

/* 表单整体文字颜色 */
:deep(.form-card) {
  color: #00d4ff !important;
}

/* 表单标签颜色 */
:deep(.form-card .el-form-item__label) {
  color: #00d4ff !important;
}
.form-card .el-input__inner:focus {
  border-color: #409EFF;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

.form-card .el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.form-card .el-input__inner:focus {
  outline: none;
}

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
  box-shadow: 0 2px 10px #00d4ff(0, 212, 255, 0.4);
}

.submit-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 5px #00d4ff(0, 212, 255, 0.4);
}

.submit-button.is-disabled,
.submit-button.is-disabled:hover {
  background: #00d4ff(0, 212, 255, 0.3);
  border-color: #00d4ff(0, 212, 255, 0.3);
  color: rgba(15, 20, 25, 0.6);
  cursor: not-allowed;
  transform: translateY(0);
  box-shadow: none;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
}

.gallery-card {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.form-card {
  height: 100%;
  overflow-y: auto;
}

.video-player {
  width: 100%;
  height: auto;
  display: block;
  background-color: #000;
}

:deep(.gallery-card .el-card__body) {
  flex-grow: 1;
  overflow-y: auto;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.gallery-item {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.gallery-item.active {
  border-color: #00d4ff; /* 改为示例中的主色调，而非Element默认蓝色 */
}

.gallery-item .el-image {
  width: 100%;
  height: 120px;
}

.item-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 4px;
  text-align: center;
}

.selected-image-preview:not(.preview-image) {
  background-color: rgba(248, 251, 252, 0); /* 覆盖之前错误的背景色 */
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

</style>