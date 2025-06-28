import { EventSourcePolyfill } from 'event-source-polyfill';
import { useAuthStore } from '@/stores/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * 获取AI分析模板卡片列表
 */
export const getAnalysisTemplates = () => {
    // 假设模板是固定的，在真实项目中可以从API获取
    // import api from '@/utils/request';
    // return api.get('/ai/analysis-templates');
    return Promise.resolve([
        { id: 'defect_summary', title: '缺陷记录分析', description: '分析指定任务或时间范围内的缺陷...', required_params: ['task_ids', 'date_range'] },
        { id: 'personnel_efficiency', title: '人员效率分析', description: '分析指定人员的任务完成频率...', required_params: ['user_ids', 'date_range'] }
    ]);
};

/**
 * 开始一个流式的AI分析 (使用SSE)
 * @param {object} data - 包含 analysisType 和 parameters 的对象
 * @returns {EventSource} 返回一个EventSource实例，供组件层监听
 */
export const startStreamAnalysis = (data) => {
    const authStore = useAuthStore();
    const token = authStore.token;

    // EventSourcePolyfill 支持自定义 headers，可以用来传递JWT token
    const eventSource = new EventSourcePolyfill(`${BASE_URL}/ai/stream-analysis`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    return eventSource;
};