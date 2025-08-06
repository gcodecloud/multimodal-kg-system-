import axios from 'axios';
import { message } from 'antd';

// 创建axios实例
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    timeout: 30000,
});

// 请求拦截器
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    message.error('登录已过期，请重新登录');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    break;
                case 403:
                    message.error('权限不足');
                    break;
                case 404:
                    message.error('请求的资源不存在');
                    break;
                case 500:
                    message.error('服务器内部错误');
                    break;
                default:
                    message.error(data?.detail || '请求失败');
            }
        } else if (error.request) {
            message.error('网络连接失败，请检查网络设置');
        } else {
            message.error('请求配置错误');
        }

        return Promise.reject(error);
    }
);

// 认证相关API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getCurrentUser: () => api.get('/auth/me'),
};

// 文件相关API
export const fileAPI = {
    upload: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        return api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(progress);
                }
            },
        });
    },
    getFiles: () => api.get('/files'),
    deleteFile: (fileId) => api.delete(`/files/${fileId}`),
};

// 知识图谱相关API
export const graphAPI = {
    getGraph: (fileId) => api.get(`/graph/${fileId}`),
    searchGraph: (query) => api.get('/graph/search', { params: { query } }),
    getGraphStats: (fileId) => api.get('/graph/stats', { params: { file_id: fileId } }),
};

// 用户管理相关API
export const userAPI = {
    getUsers: () => api.get('/users'),
    createUser: (userData) => api.post('/users', userData),
    updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
    deleteUser: (userId) => api.delete(`/users/${userId}`),
};

export default api;