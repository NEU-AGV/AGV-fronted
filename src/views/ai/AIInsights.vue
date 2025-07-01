<template>
  <div class="ai-insights-container">
    <!-- 整个布局分为左右两部分 -->
    <div class="main-layout">
      <!-- 左侧会话列表 -->
      <div class="conversation-list">
        <el-button
          class="submit-button convo-item"
          @click="handleNewConversation"
          :class="{ 'active-convo': activeConversationId === null }"
        >
          <el-icon><Plus /></el-icon> 新建聊天
        </el-button>
        
        <el-button
          v-for="convo in conversations"
          :key="convo.id"
          class="submit-button convo-item"
          :class="{ 'active-convo': activeConversationId === convo.id }"
          @click="activeConversationId = convo.id"
        >
          {{ convo.title }}
        </el-button>
      </div>

      <!-- 右侧主内容区域 -->
      <div class="main-content">
        <!-- 顶部卡片区域 -->
        <div class="top-cards">
          <div class="cards-list">
            <el-card 
              v-for="card in analysisTemplates" 
              :key="card.id" 
              class="template-card" 
              shadow="hover" 
              @click="handleCardClick(card)"
            >
              <div class="card-title">{{ card.title }}</div>
            </el-card>
          </div>
          <el-button 
            :icon="Plus" 
            title="自定义添加卡片" 
            circle 
            @click="handleAddCard"
            class="add-card-btn"
          />
        </div>

        <!-- 聊天窗口 -->
        <div class="chat-window">
          <div class="chat-history-container">
            <div 
              v-for="(message, index) in activeConversation?.messages || []" 
              :key="index" 
              :class="['chat-message', message.role]"
            >
              <el-avatar 
                :icon="message.role === 'user' ? User : 'Avatar'" 
                class="chat-avatar" 
              />
              <div class="chat-bubble">
                <div v-if="message.attachment" class="attachment-display">
                  <el-icon><Document /></el-icon>
                  <span>{{ message.attachment.name }}</span>
                </div>
                <pre>{{ message.content }}</pre>
              </div>
            </div>
          </div>
          <div class="chat-input-area">
            <div v-if="attachedFile" class="file-attachment-preview">
              <el-icon><FolderChecked /></el-icon>
              <span>{{ attachedFile.name }}</span>
              <el-icon class="remove-icon" @click="removeAttachment"><Close /></el-icon>
            </div>
            <div class="input-actions">
              <el-upload
                action="#"
                :show-file-list="false"
                :before-upload="handleFileSelect"
                class="upload-btn"
              >
                <el-icon title="上传文件"><FolderOpened /></el-icon>
              </el-upload>
              <div class="input-wrapper">
                <el-input
                  v-model="userInput"
                  type="textarea"
                  :rows="1"
                  autosize
                  resize="none"
                  placeholder="请输入您的问题..."
                  @keydown.enter.prevent="handleSendMessage"
                />
              </div>
              <el-button type="primary" :icon="Promotion" class="send-button" @click="handleSendMessage">发送</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析参数弹窗 -->
    <el-dialog 
      v-model="parameterDialog.visible" 
      :title="parameterDialog.title"  
      width="500px"
    >
      <el-form class="back-task" label-position="top">
        <el-form-item 
          v-if="parameterDialog.params.includes('task_ids')" 
          class="task"  
          label="选择分析的任务"
        >
          <el-select 
            v-model="parameterDialog.form.taskIds" 
            multiple 
            placeholder="可多选" 
            style="width: 100%;"
          >
            <el-option 
              v-for="task in mockTasks" 
              :key="task.taskId" 
              :label="task.taskName" 
              :value="task.taskId" 
            />
          </el-select>
        </el-form-item>
        <el-form-item 
          v-if="parameterDialog.params.includes('date_range')" 
          class="task" 
          label="选择时间范围"
        >
          <el-date-picker 
            v-model="parameterDialog.form.dateRange" 
            type="daterange" 
            style="width: 100%;" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="parameterDialog.visible = false" class="close-button">取 消</el-button>
        <el-button type="primary" @click="handleAnalysisSubmit" class="close-button">开始分析</el-button>
      </template>
    </el-dialog>

    <!-- 自定义卡片弹窗 -->
    <el-dialog 
      v-model="cardDialog.visible" 
      title="添加自定义分析卡片" 
      width="500px"
      custom-class="black-card-dialog" 
      :body-style="{ backgroundColor: '#000', color: '#fff' }"
    >
      <el-form :model="cardDialog.form" class="back-task" label-position="top">
        <el-form-item class="task" label="卡片标题">
          <el-input 
            v-model="cardDialog.form.title" 
            placeholder="例如：指定线路缺陷统计" 
          />
        </el-form-item>
        <el-form-item class="task" label="描述或指令">
          <el-input 
            v-model="cardDialog.form.description" 
            type="textarea" 
            placeholder="描述这个卡片的功能或预设的指令" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cardDialog.visible = false" class="close-button">取 消</el-button>
          <el-button type="primary" @click="handleSaveCard" class="close-button">保 存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Plus, FolderOpened, Promotion, Document, FolderChecked, Close } from '@element-plus/icons-vue';
// 假设接口文件路径，实际根据项目调整
import { getTasks } from '@/api/tasks.js'; 
import { getAnalysisTemplates, startStreamAnalysis } from '@/api/ai.js'; 

const USE_REAL_API = false;

const isLoading = ref(false);
const userInput = ref('');
const attachedFile = ref(null);
const analysisTemplates = ref([]);
const conversations = ref([{ 
  id: 'convo-1', 
  title: '默认会话', 
  messages: [{ role: 'model', content: '您好！我是您的AI数据洞察助手。' }] 
}]);
const activeConversationId = ref('convo-1');
const activeConversation = computed(() => 
  conversations.value.find(c => c.id === activeConversationId.value)
);
const cardDialog = reactive({ visible: false, form: { title: '', description: '' } });
const mockTasks = ref([]);
const parameterDialog = reactive({ 
  visible: false, 
  title: '', 
  params: [], 
  form: { taskIds: [], dateRange: [] }, 
  analysisType: '' 
});
let eventSource = null;

// 初始化数据
const fetchInitialData = async () => {
  if (USE_REAL_API) {
    try {
      analysisTemplates.value = await getAnalysisTemplates();
      const taskRes = await getTasks({ page: 1, pageSize: 100 });
      mockTasks.value = taskRes.list;
    } catch(e) { 
      console.error(e); 
    }
  } else {
    analysisTemplates.value = [
      { 
        id: 'defect_summary', 
        title: '缺陷记录分析', 
        description: '分析指定任务或时间范围内的缺陷...', 
        required_params: ['task_ids', 'date_range'] 
      },
      { 
        id: 'personnel_efficiency', 
        title: '人员效率分析', 
        description: '分析指定人员的任务完成频率...', 
        required_params: ['user_ids', 'date_range'] 
      }
    ];
    mockTasks.value = [ 
      { taskId: 'TASK-20250626-001', taskName: '1号线隧道巡检' }, 
      { taskId: 'TASK-20250627-001', taskName: '2号线设备检查' } 
    ];
  }
};

onMounted(() => { 
  fetchInitialData(); 
});
onUnmounted(() => { 
  if (eventSource) eventSource.close(); 
});

// 新建聊天会话
const handleNewConversation = () => {
  const newConvo = {
    id: `convo-${Date.now()}`,
    title: `新的聊天 ${conversations.value.length + 1}`,
    messages: [{ role: 'model', content: '您好！有什么可以帮助您的吗？' }]
  };
  conversations.value.unshift(newConvo);
  activeConversationId.value = newConvo.id;
};

// 文件上传处理
const handleFileSelect = (rawFile) => {
  attachedFile.value = rawFile;
  return false;
};

// 移除附件
const removeAttachment = () => {
  attachedFile.value = null;
};

// 点击分析卡片（缺陷记录分析等）
const handleCardClick = (card) => {
  parameterDialog.title = `配置分析 - ${card.title}`;
  parameterDialog.params = card.required_params;
  parameterDialog.analysisType = card.id;
  parameterDialog.form.taskIds = [];
  parameterDialog.form.dateRange = [];
  parameterDialog.visible = true;
};

// 发送聊天消息
const handleSendMessage = () => {
  if (!userInput.value.trim() && !attachedFile.value) {
    return;
  }

  const userMessage = {
    role: 'user',
    content: userInput.value,
    attachment: attachedFile.value ? {
      name: attachedFile.value.name,
      size: attachedFile.value.size,
      type: attachedFile.value.type,
      file: attachedFile.value
    } : null
  };
  
  if (!activeConversation.value) {
    // 如果没有选中会话，创建一个新会话
    handleNewConversation();
  }
  
  activeConversation.value.messages.push(userMessage);
  userInput.value = '';
  attachedFile.value = null;

  simulateStreamingResponse(activeConversationId.value);
};

// 提交分析（点击“开始分析”）
const handleAnalysisSubmit = () => {
  const cardTitle = analysisTemplates.value.find(c => c.id === parameterDialog.analysisType)?.title || '自定义分析';
  const newConvo = { 
    id: `convo-${Date.now()}`, 
    title: cardTitle, 
    messages: [] 
  };
  const userRequestContent = `请为我执行: "${cardTitle}"\n任务范围: ${parameterDialog.form.taskIds.join(', ') || '全部'}\n时间范围: ${parameterDialog.form.dateRange?.map(d => new Date(d).toLocaleDateString()).join(' 至 ') || '全部'}`;
  newConvo.messages.push({ role: 'user', content: userRequestContent });
  conversations.value.unshift(newConvo);
  activeConversationId.value = newConvo.id;
  parameterDialog.visible = false;

  if (USE_REAL_API) {
    const requestData = {
      analysisType: parameterDialog.analysisType,
      parameters: { ...parameterDialog.form }
    };
    streamResponseFromAPI(requestData, newConvo.id);
  } else {
    simulateStreamingResponse(newConvo.id);
  }
};

// 模拟流式响应（真实场景用接口）
const streamResponseFromAPI = (requestData, convoId) => {
  isLoading.value = true;
  const currentConvo = conversations.value.find(c => c.id === convoId);
  if (!currentConvo) return;
  currentConvo.messages.push({ role: 'model', content: '' });

  eventSource = startStreamAnalysis(requestData);
  eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
      eventSource.close();
      isLoading.value = false;
      return;
    }
    const lastMessage = currentConvo.messages[currentConvo.messages.length - 1];
    lastMessage.content += event.data;
  };
  eventSource.onerror = (err) => {
    console.error("EventSource failed:", err);
    ElMessage.error("与AI服务器连接失败");
    isLoading.value = false;
    eventSource.close();
  };
};

// 模拟流式响应（本地演示）
const simulateStreamingResponse = (convoId) => {
  isLoading.value = true;
  const currentConvo = conversations.value.find(c => c.id === convoId);
  if (!currentConvo) return;
  currentConvo.messages.push({ role: 'model', content: '' });

  const mockResponse = "根据您的要求，对任务 [TASK-20250626-001] 的分析结果如下：\n\n1.  **主要缺陷类型**: \n    * 裂缝 (45%)\n    * 渗水 (30%)\n\n2.  **根本原因分析**: \n    * 结构性裂缝多与沉降有关。\n    * 渗水问题集中在接口处，建议加强防水工艺。\n\n3.  **改进建议**: \n    * 对K10-K15段进行重点沉降观测。";
  let index = 0;

  const intervalId = setInterval(() => {
    if (index === 0) isLoading.value = false;
    if (index < mockResponse.length) {
      const lastMessage = currentConvo.messages[currentConvo.messages.length - 1];
      lastMessage.content += mockResponse[index];
      index++;
      nextTick(() => {
        // 滚动到底部
        const container = document.querySelector('.chat-history-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    } else {
      clearInterval(intervalId);
    }
  }, 50);
};

// 打开自定义卡片弹窗
const handleAddCard = () => {
  cardDialog.form.title = '';
  cardDialog.form.description = '';
  cardDialog.visible = true;
};

// 保存自定义卡片
const handleSaveCard = () => {
  analysisTemplates.value.push({
    id: `custom-${Date.now()}`,
    title: cardDialog.form.title,
    description: cardDialog.form.description,
  });
  cardDialog.visible = false;
};
</script>

<style scoped>
.ai-insights-container {
  background-color: #0f1419;
  color: #fff;
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
}

/* 主要布局容器 */
.main-layout {
  display: flex;
  height: calc(100% - 40px); /* 减去上下padding */
  gap: 20px;
}

/* 左侧会话列表：占据左侧从上到下的空间 */
.conversation-list {
  width: 240px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  overflow-y: auto;
  height: 100%;
}

/* 右侧主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  min-width: 0;
}

/* 顶部卡片区域 */
.top-cards {
  background: rgba(3, 209, 250, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

/* 卡片列表 */
.cards-list {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 5px;
}

/* 单个分析卡片样式 */
.template-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 200px;
  background-color: #4bc5fa;
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 15px;
}

.template-card:hover {
  transform: translateY(-5px);
  border-color: #00d4ff;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

.card-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #0f1010;
}

/* 加号按钮样式 */
.add-card-btn {
  background: rgba(0, 212, 255, 0.2);
  border: 1px solid rgba(0, 212, 255, 0.5);
  color: #00d4ff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}

.add-card-btn:hover {
  background: #00d4ff;
  color: #0f1419;
  transform: translateY(-2px);
}

/* 右侧聊天窗口 */
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
  min-height: 0;
}

/* 聊天历史容器 */
.chat-history-container {
  flex: 1;
  overflow-y: auto;
  background: rgba(0, 212, 255, 0.05);
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

/* 聊天消息样式 */
.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.chat-message.model {
  justify-content: flex-start;
}

.chat-message.user {
  justify-content: flex-end;
}

.chat-message.user .chat-bubble {
  background-color: #409eff;
  color: #161515;
}

.chat-message.user .chat-avatar {
  order: 2;
}

.chat-bubble {
  padding: 10px 15px;
  border-radius: 10px;
  background-color: rgba(64, 158, 255, 0.2);
  max-width: 80%;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

pre {
  margin: 0;
  font-family: inherit;
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
/* 附件显示样式 */
.attachment-display {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: rgba(0,0,0,0.05);
  padding: 5px 8px;
  border-radius: 4px;
  margin-bottom: 5px;
}

/* 聊天输入区域 */
.chat-input-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
  flex-shrink: 0;
}

.input-actions {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  width: 100%;
}

.input-wrapper {
  flex-grow: 1;
  min-width: 0;
}

/* 文件上传预览 */
.file-attachment-preview {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background-color: rgba(236, 245, 255, 0.1);
  border: 1px solid rgba(217, 236, 255, 0.2);
  border-radius: 4px;
  font-size: 13px;
}

.upload-btn .el-icon {
  font-size: 20px;
  color: #666;
  cursor: pointer;
}

.remove-icon {
  cursor: pointer;
  color: #999;
}

.remove-icon:hover {
  color: #00d4ff;
}

/* 统一按钮样式 */
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
  justify-content: flex-start;
  font-weight: 500;
  border: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  gap: 10px;
}

.submit-button:hover {
  background: #33e0ff;
  border-color: #33e0ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 10px rgba(0, 212, 255, 0.4);
}

.submit-button:active,
.active-convo {
  transform: translateY(0);
  background: #00b3ff;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
  font-weight: 600;
}

/* 会话项样式 */
.convo-item {
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

/* 弹窗样式 */
.back-task {
  background-color: #0f1419;
  color: #fff;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
}

/* 穿透样式，修改输入框样式 */
:deep(.input-wrapper .el-input__inner) {
  background-color: rgba(64, 158, 255, 0.1);
  color: #f0f2f5;
  border-color: rgba(64, 158, 255, 0.3);
  caret-color: #00d4ff;
  height: 40px;
}

:deep(.input-wrapper .el-input__inner::placeholder) {
  color: rgba(240, 242, 245, 0.5);
}

:deep(.input-wrapper .el-input.is-focus .el-input__inner) {
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
  border-color: #00d4ff;
}

/* 穿透样式，修改表单标签颜色 */
:deep(.back-task .el-form-item__label) {
  color: #00d4ff;
}

/* 自定义卡片弹窗样式 */
:global(.black-card-dialog) {
  background-color: #000 !important;
  border: 1px solid rgba(0, 212, 255, 0.3) !important;
  border-radius: 8px;
}

:global(.black-card-dialog .el-dialog__title) {
  color: #fff !important;
  font-weight: 500;
}

:global(.black-card-dialog .el-dialog__body) {
  padding: 20px;
  color: #e5e7eb !important;
}

:global(.black-card-dialog .el-input__inner) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #e5e7eb !important;
  border: 1px solid rgba(0, 212, 255, 0.2) !important;
  transition: border-color 0.3s;
}

:global(.black-card-dialog .el-input__inner:focus) {
  border-color: #00d4ff !important;
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.1) !important;
}

:global(.black-card-dialog .el-button--default) {
  background-color: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #9ca3af !important;
}

:global(.black-card-dialog .el-button--default:hover) {
  border-color: #00d4ff !important;
  color: #00d4ff !important;
}

:global(.black-card-dialog .el-button--primary) {
  background-color: #00d4ff !important;
  color: #0f1419 !important;
  border: 1px solid #00d4ff !important;
}

:global(.black-card-dialog .el-button--primary:hover) {
  background-color: #33e0ff !important;
}
.send-button{
  background: #00d4ff;
  border-color: #00d4ff;
  color: #0f1419;
  border-radius: 20px;
  height: 40px;
  font-size: 16px;
  padding: 0 20px;
  transition: all 0.3s;
}
.send-button:hover {
  background: #33e0ff;
  border-color: #33e0ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 10px #00d4ff;
}

.send-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 5px #00d4ff;
}

.send-button.is-disabled,
.send-button.is-disabled:hover {
  background: #00d4ff;
  border-color: #00d4ff;
  color: rgba(15, 20, 25, 0.6);
  cursor: not-allowed;
  transform: translateY(0);
  box-shadow: none;
}
</style>