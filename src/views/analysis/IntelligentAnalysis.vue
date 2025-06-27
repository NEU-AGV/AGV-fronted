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
                  <el-select v-model="defectForm.linkedTaskId" placeholder="请选择或搜索关联任务" filterable style="width: 100%;">
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
              <el-select v-model="defectForm.severity" placeholder="请选择严重程度" style="width: 100%;">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </el-form-item>
            <el-form-item label="缺陷描述" prop="description">
              <el-input v-model="defectForm.description" type="textarea" :rows="3" placeholder="请输入详细描述" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSubmit" :disabled="!selectedDefectImage">提交缺陷记录</el-button>
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

const defectFormRef = ref(null);
let wsSimulator = null;

const detectedDefects = ref([]);
const selectedDefectImage = ref(null);
const mockTasks = ref([
  { taskId: 'TASK-20250626-001', taskName: '1号线隧道巡检' },
  { taskId: 'TASK-20250627-001', taskName: '2号线设备检查' },
]);

// 表单数据模型已更新
const defectForm = reactive({
  linkedTaskId: '',
  defectType: '',
  severity: '',
  description: '',
  location: '', // 新增
  discoverer: 'admin',
});
const defectFormRules = {
  linkedTaskId: [{ required: true, message: '请关联一个任务', trigger: 'change' }],
  defectType: [{ required: true, message: '请输入缺陷类型', trigger: 'blur' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  location: [{ required: true, message: '请输入缺陷位置', trigger: 'blur' }],
  discoverer: [{ required: true, message: '请输入发现人员姓名', trigger: 'blur' }], // 新增验证
};

onMounted(() => {
  let imageCounter = 0;
  const sampleImages = [ /* ... */ ];
  const sampleTypes = ['裂缝', '渗水', '脱落'];
  const sampleLocations = ['K10+500', 'K12+100', 'K15+800'];

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
  }, 5000);
});

onUnmounted(() => { clearInterval(wsSimulator); });

const selectDefectImage = (defect) => {
  selectedDefectImage.value = defect;
  defectForm.defectType = defect.preliminary.type;
  defectForm.location = defect.preliminary.location; // 预填位置信息
};

const handleSubmit = () => {
  defectFormRef.value.validate(valid => {
    if (valid) {
      const taskName = mockTasks.value.find(t => t.taskId === defectForm.linkedTaskId)?.taskName || '';
      // 组装成与缺陷管理页面一致的、完整的缺陷数据结构
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

      console.log('准备提交到后端的缺陷数据对象:', finalDefectData);
      ElMessage.success('提交成功！请在浏览器控制台查看数据对象。');

      detectedDefects.value = detectedDefects.value.filter(d => d.imageId !== selectedDefectImage.value.imageId);
      selectedDefectImage.value = null;
      defectFormRef.value.resetFields();
    }
  });
};
</script>

<style scoped>
.analysis-container { padding: 20px; height: calc(100vh - 100px); }
.left-panel, .right-panel { display: flex; flex-direction: column; height: 100%; gap: 20px; }
.video-card { flex-shrink: 0; }
.gallery-card { flex-grow: 1; display: flex; flex-direction: column; }
.form-card { height: 100%; overflow-y: auto; }
.video-player { width: 100%; height: auto; display: block; background-color: #000; }
:deep(.gallery-card .el-card__body) { flex-grow: 1; overflow-y: auto; }
.image-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; }
.gallery-item { position: relative; cursor: pointer; border: 2px solid transparent; transition: border-color 0.3s; }
.gallery-item.active { border-color: var(--el-color-primary); }
.gallery-item .el-image { width: 100%; height: 120px; }
.item-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: #fff; font-size: 12px; padding: 4px; text-align: center; }
/* 新增样式 */
.selected-image-preview {
  width: 100%;
  height: 250px;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px dashed var(--el-border-color);
}
.image-placeholder {
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.image-placeholder .el-icon {
  font-size: 40px;
}
</style>