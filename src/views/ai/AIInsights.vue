<template>
  <div class="ai-insights-container">
    <div class="main-layout">
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

      <div class="main-content">
        <div class="top-cards">
          <div class="cards-list">
            <el-card
                v-for="card in analysisTemplates"
                :key="card.id"
                class="template-card"
                :class="{ 'is-configured': !!card.selection }"
                shadow="hover"
            >
              <div class="card-content" @click="handleCardClick(card)">
                <div class="card-header">
                  <div class="card-title">{{ card.title }}</div>
                  <el-icon v-if="card.selection" class="clear-icon" @click.stop="clearCardSelection(card.id)"><Close /></el-icon>
                </div>

                <div v-if="card.selection" class="card-selection-details">
                  <div v-if="card.selection.taskNames && card.selection.taskNames.length">
                    <el-icon><FolderChecked /></el-icon> 任务: {{ card.selection.taskNames.join(', ') }}
                  </div>
                  <div v-if="card.selection.dateRange && card.selection.dateRange.length">
                    <el-icon><Calendar /></el-icon> 时间: {{ formatDateRange(card.selection.dateRange) }}
                  </div>
                </div>

                <div v-else class="card-description">
                  {{ card.description }}
                </div>
              </div>

              <el-checkbox
                  v-if="card.selection"
                  v-model="card.isSelectedForAnalysis"
                  class="card-selector-checkbox"
                  @click.stop
              />
            </el-card>
          </div>

          <el-button
              :icon="Plus"
              title="自定义添加卡片"
              circle
              @click="handleAddCard"
              class="add-card-btn"
          />

          <el-button
              type="primary"
              :disabled="!isAnyCardSelected"
              @click="handleBatchAnalysis"
              class="batch-analysis-btn"
          >
            汇总分析
          </el-button>
        </div>

        <div class="chat-window">
          <div class="chat-history-container">
            <div v-for="(message, index) in activeConversation?.messages || []" :key="index" :class="['chat-message', message.role]">
              <el-avatar :icon="message.role === 'user' ? User : 'Avatar'" class="chat-avatar" />
              <div class="chat-bubble"><pre>{{ message.content }}</pre></div>
            </div>
          </div>
          <div class="chat-input-area">
            <div class="input-actions">
              <div class="input-wrapper">
                <el-input v-model="userInput" type="textarea" :rows="1" autosize resize="none" placeholder="可在此继续追问..." @keydown.enter.prevent="handleSendMessage" />
              </div>
              <el-button type="primary" :icon="Promotion" class="send-button" @click="handleSendMessage">发送</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="parameterDialog.visible" :title="parameterDialog.title" width="500px">
      <el-form class="back-task" label-position="top">
        <el-form-item v-if="parameterDialog.params.includes('task_ids')" class="task" label="选择分析的任务">
          <el-select v-model="parameterDialog.form.taskIds" multiple placeholder="可多选" style="width: 100%;">
            <el-option v-for="task in mockTasks" :key="task.taskId" :label="task.taskName" :value="task.taskId" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="parameterDialog.params.includes('date_range')" class="task" label="选择时间范围">
          <el-date-picker v-model="parameterDialog.form.dateRange" type="daterange" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="parameterDialog.visible = false" class="close-button">取 消</el-button>
        <el-button type="primary" @click="handleConfirmSelection" class="close-button">确 定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cardDialog.visible" title="添加自定义分析卡片" width="500px" custom-class="black-card-dialog">
      <el-form :model="cardDialog.form" class="back-task" label-position="top">
        <el-form-item class="task" label="卡片标题"><el-input v-model="cardDialog.form.title" placeholder="例如：指定线路缺陷统计" /></el-form-item>
        <el-form-item class="task" label="描述或指令"><el-input v-model="cardDialog.form.description" type="textarea" placeholder="描述这个卡片的功能或预设的指令" /></el-form-item>
        <el-form-item class="task" label="补充数据文件 (可选)">
          <el-upload ref="uploadRef" :auto-upload="false" :on-change="handleCardFileChange" :limit="1">
            <el-button type="primary" plain>选择文件</el-button>
          </el-upload>
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
import { User, Plus, Promotion, FolderChecked, Close, Calendar } from '@element-plus/icons-vue';
// 引入所有需要的API函数
import { getAnalysisTemplates, saveNewTemplate, getTasks, startStreamAnalysis } from '@/api/ai.js';


// 添加用于切换真实/模拟API的开关
const USE_REAL_API = ref(false); // 设置为true来启用真实API

const userInput = ref('');
const analysisTemplates = ref([]);
const conversations = ref([{
  id: 'convo-1',
  title: '默认会话',
  messages: [{ role: 'model', content: '您好！我是您的AI数据洞察助手。请选择并配置上方的分析卡片，然后点击“开始汇总分析”。' }]
}]);
const activeConversationId = ref('convo-1');
const activeConversation = computed(() => conversations.value.find(c => c.id === activeConversationId.value));
const mockTasks = ref([]);

// 恢复：自定义卡片弹窗的响应式对象
const cardDialog = reactive({
  visible: false,
  form: { title: '', description: '', file: null }
});

const parameterDialog = reactive({
  visible: false,
  title: '',
  params: [],
  form: { taskIds: [], dateRange: [] },
  analysisType: '',
});

// 计算属性，判断是否有任何卡片被勾选
const isAnyCardSelected = computed(() =>
    analysisTemplates.value.some(card => card.isSelectedForAnalysis)
);

// --- 新增：从API获取初始数据 ---
const fetchInitialData = async () => {
  if (USE_REAL_API.value) {
    try {
      // 并行获取分析模板和任务列表
      const [templatesRes, tasksRes] = await Promise.all([
        getAnalysisTemplates(), // [cite: 1]
        getTasks({ page: 1, pageSize: 100 }) // [cite: 1]
      ]);
      analysisTemplates.value = templatesRes.map(t => ({...t, selection: null, isSelectedForAnalysis: false}));
      mockTasks.value = tasksRes.list;
    } catch (error) {
      ElMessage.error('初始化数据失败，请检查网络或联系管理员。');
      console.error(error);
    }
  } else {
    // 保留原来的模拟数据逻辑
    analysisTemplates.value = [
      { id: 'defect_summary', title: '缺陷记录分析', description: '分析指定任务或时间范围内的缺陷...', required_params: ['task_ids', 'date_range'], selection: null, isSelectedForAnalysis: false },
      { id: 'personnel_efficiency', title: '人员效率分析', description: '分析指定人员的任务完成频率...', required_params: ['user_ids', 'date_range'], selection: null, isSelectedForAnalysis: false }
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

const handleNewConversation = () => {
  const newConvo = {
    id: `convo-${Date.now()}`,
    title: `新的聊天 ${conversations.value.length + 1}`,
    messages: [{ role: 'model', content: '您好！有什么可以帮助您的吗？' }]
  };
  conversations.value.unshift(newConvo);
  activeConversationId.value = newConvo.id;
};

// 恢复：打开新增卡片弹窗
const handleAddCard = () => {
  cardDialog.form.title = '';
  cardDialog.form.description = '';
  cardDialog.form.file = null;
  cardDialog.visible = true;
};

// 恢复：处理自定义卡片中的文件选择
const handleCardFileChange = (file) => {
  cardDialog.form.file = file.raw;
};

// --- 更新：保存自定义卡片，调用API ---
const handleSaveCard = async () => {
  if (USE_REAL_API.value) {
    const formData = new FormData();
    formData.append('title', cardDialog.form.title);
    formData.append('description', cardDialog.form.description);
    if (cardDialog.form.file) {
      formData.append('file', cardDialog.form.file);
    }

    try {
      const newCard = await saveNewTemplate(formData); [cite_start]// [cite: 1]
      analysisTemplates.value.push({...newCard, selection: null, isSelectedForAnalysis: false});
      ElMessage.success('自定义卡片已成功保存至服务器');
    } catch (error) {
      ElMessage.error('卡片保存失败');
      console.error(error);
    }

  } else {
    // 保留原来的前端模拟逻辑
    const newCard = { id: `custom-${Date.now()}`, title: cardDialog.form.title, description: cardDialog.form.description, hasAttachment: !!cardDialog.form.file, required_params: [], selection: null, isSelectedForAnalysis: false };
    analysisTemplates.value.push(newCard);
    ElMessage.success('自定义卡片已添加 (本地模拟)');
  }
  cardDialog.visible = false;
};

const handleCardClick = (card) => {
  if (card.required_params && card.required_params.length > 0) {
    parameterDialog.title = `配置分析 - ${card.title}`;
    parameterDialog.params = card.required_params;
    parameterDialog.analysisType = card.id;
    parameterDialog.form.taskIds = card.selection?.taskIds || [];
    parameterDialog.form.dateRange = card.selection?.dateRange || [];
    parameterDialog.visible = true;
  }
};

const handleConfirmSelection = () => {
  const card = analysisTemplates.value.find(c => c.id === parameterDialog.analysisType);
  if (card) {
    const selectedTaskNames = parameterDialog.form.taskIds.map(id =>
        mockTasks.value.find(task => task.taskId === id)?.taskName || id
    );
    card.selection = {
      taskIds: [...parameterDialog.form.taskIds],
      taskNames: selectedTaskNames,
      dateRange: [...(parameterDialog.form.dateRange || [])]
    };
    card.isSelectedForAnalysis = true; // 配置完成后默认勾选
  }
  parameterDialog.visible = false;
};

const clearCardSelection = (cardId) => {
  const card = analysisTemplates.value.find(c => c.id === cardId);
  if (card) {
    card.selection = null;
    card.isSelectedForAnalysis = false;
  }
};

// 用于处理真实API流式响应的函数
const streamResponseFromAPI = (requestData, convoId) => {
  const currentConvo = conversations.value.find(c => c.id === convoId);
  if (!currentConvo) return;
  currentConvo.messages.push({ role: 'model', content: '' });

  // 注意：startStreamAnalysis 是从 ai.js 导入的
  const eventSource = startStreamAnalysis(requestData);  // [cite: 2]

  eventSource.onmessage = (event) => {
     if (event.data === '[DONE]') { // [cite: 2]
      eventSource.close();
      return;
    }
    const lastMessage = currentConvo.messages[currentConvo.messages.length - 1];
    lastMessage.content += event.data;
    // 滚动到底部
    nextTick(() => {
      const container = document.querySelector('.chat-history-container');
      if (container) container.scrollTop = container.scrollHeight;
    });
  };
  eventSource.onerror = (err) => {
    console.error("EventSource failed:", err);
    ElMessage.error("与AI服务器连接失败");
    eventSource.close();
  };
};

const handleBatchAnalysis = () => {
  const selectedCards = analysisTemplates.value.filter(card => card.isSelectedForAnalysis);
  if (selectedCards.length === 0) return;

  const newConvo = { id: `convo-${Date.now()}`, title: '汇总分析', messages: [] };
  let userRequestContent = '请为我执行以下已选定的分析任务：\n\n';

  // 为API请求准备数据
  const analysisRequests = selectedCards.map(card => {
    const taskText = card.selection.taskNames?.join(', ') || '未指定';
    const dateText = formatDateRange(card.selection.dateRange) || '未指定';
    userRequestContent += `* **${card.title}**: \n    * 任务: ${taskText}\n    * 时间: ${dateText}\n`;

    // 返回给API的数据结构
    return {
       analysisType: card.id, // [cite: 2]
        parameters: {
      taskIds: card.selection.taskIds,
          dateRange: card.selection.dateRange
           } // [cite: 2]
  };
  });

  newConvo.messages.push({ role: 'user', content: userRequestContent });
  conversations.value.unshift(newConvo);
  activeConversationId.value = newConvo.id;

  // 清空已分析卡片的配置
  selectedCards.forEach(card => {
    card.selection = null;
    card.isSelectedForAnalysis = false;
  });

  // --- 新增的分支逻辑 ---
  if (USE_REAL_API.value) {
    // 如果开关为true，调用真实API
     // 接口文档要求发送一个包含多个分析对象的数组 [cite: 2]
    streamResponseFromAPI(analysisRequests, newConvo.id);
  } else {
    // 如果开关为false，调用模拟函数
    const mockResponse = `已收到您的 ${selectedCards.length} 项分析请求，正在处理...\n--- 模拟结果将在此呈现 ---`;
    simulateStreamingResponse(newConvo.id, mockResponse);
  }
};

const handleSendMessage = () => {
  if (!userInput.value.trim() || !activeConversation.value) return;
  activeConversation.value.messages.push({ role: 'user', content: userInput.value });
  const conversationId = activeConversation.value.id;
  userInput.value = '';
  simulateStreamingResponse(conversationId, "关于您的问题，进一步的分析如下：...");
};

const simulateStreamingResponse = (convoId, mockResponse) => {
  const currentConvo = conversations.value.find(c => c.id === convoId);
  if (!currentConvo) return;
  currentConvo.messages.push({ role: 'model', content: '' });

  let index = 0;
  const intervalId = setInterval(() => {
    if (index < mockResponse.length) {
      const lastMessage = currentConvo.messages[currentConvo.messages.length - 1];
      lastMessage.content += mockResponse[index];
      index++;
      nextTick(() => {
        const container = document.querySelector('.chat-history-container');
        if (container) container.scrollTop = container.scrollHeight;
      });
    } else {
      clearInterval(intervalId);
    }
  }, 30);
};

const formatDateRange = (dateRange) => {
  if (!dateRange || dateRange.length !== 2) return '';
  return `${new Date(dateRange[0]).toLocaleDateString()} - ${new Date(dateRange[1]).toLocaleDateString()}`;
};
</script>

<style scoped>
/* 保持大部分样式不变，只对有改动的部分进行调整或新增 */
.top-cards {
  /* 调整以容纳新按钮 */
  display: flex;
  align-items: flex-start; /* 顶部对齐 */
  gap: 20px;
}

.cards-list {
  flex: 1; /* 占据更多空间 */
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.template-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 220px; /* 稍微加宽以容纳更多信息 */
  background-color: #4bc5fa;
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  position: relative; /* 为复选框定位提供基准 */
  padding-bottom: 30px; /* 为复选框留出空间 */
}
.template-card:hover {
  transform: translateY(-5px);
  border-color: #00d4ff;
}
/* 已配置卡片的特殊样式 */
.template-card.is-configured {
  border-color: #00d4ff;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.card-title {
  font-weight: bold;
  color: #0f1010;
  flex: 1;
}
.clear-icon {
  color: #0f1010;
  opacity: 0.6;
  cursor: pointer;
  font-size: 16px;
}
.clear-icon:hover {
  opacity: 1;
  color: #ff4d4f;
}
/* 卡片上显示配置详情的样式 */
.card-selection-details {
  font-size: 13px;
  color: #0f1010;
  opacity: 0.9;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.card-selection-details div {
  display: flex;
  align-items: center;
  gap: 6px;
}
.card-description {
  font-size: 13px;
  color: #0f1010;
  opacity: 0.7;
}

/* 汇总分析按钮样式 */
.batch-analysis-btn {
  background: #00d4ff;
  border-color: #00d4ff;
  color: #0f1419;
  border-radius: 8px;
  height: auto; /* 高度自适应 */
  padding: 15px 20px;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
  white-space: normal;
  line-height: 1.2;
}
.batch-analysis-btn:hover {
  background: #33e0ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.5);
}
.batch-analysis-btn.is-disabled {
  background: rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.3);
  color: rgba(255,255,255,0.4);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
/* 主容器 - 保持不变 */
.ai-insights-container {
  background-color: #0f1419;
  color: #fff;
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
}

/* 关键修改：主布局调整 */
.main-layout {
  display: flex;
  height: calc(100% - 40px);
  gap: 20px;
  align-items: stretch; /* 使左右两侧高度一致 */
}

/* 左侧会话列表调整 */
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
  /* 移除固定高度，改用flex布局控制 */
}

/* 右侧主内容调整 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  /* 移除固定高度，改用flex布局控制 */
}

/* 聊天窗口调整 */
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 关键：防止flex布局溢出 */
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
}

/* 顶部卡片区域微调 */
.top-cards {
  background: rgba(3, 209, 250, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
  flex-shrink: 0; /* 防止被压缩 */
}

/* 以下所有其他样式保持不变... */
.cards-list {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.template-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 220px;
  background-color: #4bc5fa;
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  position: relative;
  padding-bottom: 30px;
}

.template-card:hover {
  transform: translateY(-5px);
  border-color: #00d4ff;
}

.chat-history-container {
  flex: 1;
  overflow-y: auto;
  background: rgba(0, 212, 255, 0.05);
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}
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
.convo-item {
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
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
:deep(.input-wrapper .el-textarea__inner) {
  background-color: rgba(64, 158, 255, 0.1) !important;
  color: #f0f2f5 !important;
  border-color: rgba(64, 158, 255, 0.3) !important;
  caret-color: #00d4ff !important;
  box-shadow: none !important;
}
:deep(.back-task .el-form-item__label) {
  color: #00d4ff;
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

.ai-insights-container {
  background-color: #0f1419;
  color: #fff;
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
}

/* 修改主布局容器的高度计算方式 */
.main-layout {
  display: flex;
  height: calc(100% - 40px);
  gap: 20px;
  align-items: stretch; /* 添加这一行使子元素高度一致 */
}

/* 调整会话列表样式 */
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
  /* 移除固定高度，改用flex布局控制 */
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
  margin-left: auto;
}

.add-card-btn:hover {
  background: #00d4ff;
  color: #0f1419;
  transform: translateY(-2px);
}

/* 调整聊天窗口 */
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 15px;
  border-radius: 4px;
  min-height: 0;
  /* 确保有最小高度 */
}

/* 聊天历史容器 */
.chat-history-container {
  flex: 1;
  overflow-y: auto;
  background: rgba(0, 212, 255, 0.05);
  padding: 15px;
  border-radius: 4px;
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