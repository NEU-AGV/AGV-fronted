<template>
  <div class="ai-insights-container">
    <div class="template-cards-header">
      <div class="cards-list">
        <el-card v-for="card in analysisTemplates" :key="card.id" class="template-card" shadow="hover" @click="handleCardClick(card)">
          <div class="card-title">{{ card.title }}</div>
        </el-card>
      </div>
      <el-button :icon="Plus" circle @click="handleAddCard" title="自定义添加卡片" />
    </div>

    <div class="main-content">
      <div class="conversation-list">
        <el-button type="primary" plain class="new-chat-btn">新建聊天</el-button>
        <div
            v-for="convo in conversations"
            :key="convo.id"
            class="convo-item"
            :class="{ active: activeConversationId === convo.id }"
            @click="activeConversationId = convo.id"
        >
          {{ convo.title }}
        </div>
      </div>

      <div class="chat-window">
        <div class="chat-history-container">
          <div v-for="(message, index) in activeConversation.messages" :key="index" :class="['chat-message', message.role]">
            <el-avatar :icon="message.role === 'user' ? User : 'Avatar'" class="chat-avatar" />
            <div class="chat-bubble"><pre>{{ message.content }}</pre></div>
          </div>
          <div v-if="isLoading" class="chat-message model">
            <el-avatar icon="Avatar" class="chat-avatar" />
            <div class="chat-bubble loading-bubble">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>正在分析数据，请稍候...</span>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <el-upload action="#" :show-file-list="false" class="upload-btn">
            <el-icon><FolderOpened /></el-icon>
          </el-upload>
          <el-input v-model="userInput" type="textarea" :rows="1" resize="none" placeholder="请输入您的问题..." />
          <el-button type="primary" :icon="Promotion">发送</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="parameterDialog.visible" :title="parameterDialog.title" width="500px">
      <el-form label-position="top">
        <el-form-item v-if="parameterDialog.params.includes('task_ids')" label="选择分析的任务">
          <el-select v-model="parameterDialog.form.taskIds" multiple placeholder="可多选" style="width: 100%;">
            <el-option v-for="task in mockTasks" :key="task.taskId" :label="task.taskName" :value="task.taskId" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="parameterDialog.params.includes('date_range')" label="选择时间范围">
          <el-date-picker v-model="parameterDialog.form.dateRange" type="daterange" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="parameterDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="handleAnalysisSubmit">开始分析</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cardDialog.visible" title="添加自定义分析卡片" width="500px">
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue';
import { User, Plus, FolderOpened, Promotion, Loading } from '@element-plus/icons-vue';

const isLoading = ref(false);
const userInput = ref('');

const analysisTemplates = ref([
  { id: 'defect_summary', title: '缺陷记录分析', description: '分析指定任务或时间范围内的缺陷...', required_params: ['task_ids', 'date_range'] },
  { id: 'personnel_efficiency', title: '人员效率分析', description: '分析指定人员的任务完成频率...', required_params: ['user_ids', 'date_range'] }
]);

const conversations = ref([ { id: 'convo-1', title: '默认会话', messages: [ { role: 'model', content: '您好！我是您的AI数据洞察助手。' } ] } ]);
const activeConversationId = ref('convo-1');
const activeConversation = computed(() => conversations.value.find(c => c.id === activeConversationId.value));

const cardDialog = reactive({ visible: false, form: { title: '', description: '' } });
const mockTasks = ref([
  { taskId: 'TASK-20250626-001', taskName: '1号线隧道巡检' },
  { taskId: 'TASK-20250627-001', taskName: '2号线设备检查' },
]);

// 恢复并重构参数配置弹窗的状态管理
const parameterDialog = reactive({
  visible: false,
  title: '',
  params: [],
  form: { taskIds: [], dateRange: [] },
  analysisType: ''
});

// --- 方法 ---

// 关键改动：点击卡片，现在会打开配置弹窗
const handleCardClick = (card) => {
  parameterDialog.title = `配置分析 - ${card.title}`;
  parameterDialog.params = card.required_params;
  parameterDialog.analysisType = card.id;
  // 重置表单
  parameterDialog.form.taskIds = [];
  parameterDialog.form.dateRange = [];
  parameterDialog.visible = true;
};

// 关键改动：提交弹窗中的参数后，开始分析流程
const handleAnalysisSubmit = () => {
  const cardTitle = analysisTemplates.value.find(c => c.id === parameterDialog.analysisType)?.title || '自定义分析';

  // 1. 创建新会话
  const newConvo = {
    id: `convo-${Date.now()}`,
    title: cardTitle,
    messages: []
  };

  // 2. 格式化用户的请求作为第一条消息
  const userRequestContent = `请为我执行: "${cardTitle}"\n任务范围: ${parameterDialog.form.taskIds.join(', ') || '全部'}\n时间范围: ${parameterDialog.form.dateRange?.map(d => new Date(d).toLocaleDateString()).join(' 至 ') || '全部'}`;
  newConvo.messages.push({ role: 'user', content: userRequestContent });

  conversations.value.unshift(newConvo);
  activeConversationId.value = newConvo.id;

  // 3. 关闭弹窗并开始模拟流式响应
  parameterDialog.visible = false;
  simulateStreamingResponse(newConvo.id);
};

// 模拟流式响应
const simulateStreamingResponse = (convoId) => {
  isLoading.value = true;

  // 找到对应的会话
  const currentConvo = conversations.value.find(c => c.id === convoId);
  if (!currentConvo) return;

  currentConvo.messages.push({ role: 'model', content: '' });

  const mockResponse = "根据您的要求，对任务 [TASK-20250626-001] 的分析结果如下：\n\n1.  **主要缺陷类型**: \n    * 裂缝 (45%)\n    * 渗水 (30%)\n\n2.  **根本原因分析**: \n    * 结构性裂缝多与沉降有关。\n    * 渗水问题集中在接口处，建议加强防水工艺。\n\n3.  **改进建议**: \n    * 对K10-K15段进行重点沉降观测。";
  let index = 0;

  const intervalId = setInterval(() => {
    if (index === 0) {
      isLoading.value = false;
    }
    if (index < mockResponse.length) {
      const lastMessage = currentConvo.messages[currentConvo.messages.length - 1];
      lastMessage.content += mockResponse[index];
      index++;
      nextTick(() => { /* ... 滚动到底部 ... */ });
    } else {
      clearInterval(intervalId);
    }
  }, 50);
};

const handleAddCard = () => {
  cardDialog.form.title = '';
  cardDialog.form.description = '';
  cardDialog.visible = true;
};

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
.ai-insights-container { padding: 20px; display: flex; flex-direction: column; height: calc(100vh - 140px); gap: 20px; }
.template-cards-header { display: flex; align-items: center; gap: 20px; flex-shrink: 0; }
.cards-list { display: flex; gap: 20px; overflow-x: auto; }
.template-card { cursor: pointer; transition: all 0.2s ease-in-out; min-width: 200px; }
.template-card:hover { transform: translateY(-5px); box-shadow: var(--el-box-shadow-light); }
.card-title { font-weight: bold; margin-bottom: 8px; }

.main-content { flex-grow: 1; display: flex; gap: 20px; min-height: 0; }
.conversation-list { width: 240px; background-color: #fcfcfc; border-radius: 4px; border: 1px solid var(--el-border-color-light); padding: 10px; display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
.new-chat-btn { width: 100%; margin-bottom: 10px; }
.convo-item { padding: 10px; border-radius: 4px; cursor: pointer; font-size: 14px; }
.convo-item:hover { background-color: #f5f7fa; }
.convo-item.active { background-color: var(--el-color-primary-light-9); color: var(--el-color-primary); }

.chat-window { flex-grow: 1; display: flex; flex-direction: column; min-width: 0; }
.chat-history-container { flex-grow: 1; overflow-y: auto; background-color: #f5f7fa; padding: 20px; border-radius: 4px; }
.chat-input-area { display: flex; gap: 10px; align-items: center; padding-top: 15px; flex-shrink: 0; }
.upload-btn .el-icon { font-size: 20px; color: #666; cursor: pointer; }

/* 聊天气泡样式 */
.chat-message { display: flex; gap: 12px; margin-bottom: 20px; }
.chat-message.model { justify-content: flex-start; }
.chat-message.user { justify-content: flex-end; }
.chat-message.user .chat-bubble { background-color: #409eff; color: #fff; }
.chat-message.user .chat-avatar { order: 2; }
.chat-bubble { padding: 10px 15px; border-radius: 10px; background-color: #fff; max-width: 80%; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
pre { margin: 0; font-family: inherit; }
</style>