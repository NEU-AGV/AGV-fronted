// src/api/analysis.js
import api from '@/utils/request'

/**
 * 获取用于播放的视频流地址
 */
export const getVideoSource = () => {
    return api.get('/stream/source')
}