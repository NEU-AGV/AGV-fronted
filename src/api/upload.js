import request from '@/utils/request.js'

export const uploadFile = formData => request.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
})
