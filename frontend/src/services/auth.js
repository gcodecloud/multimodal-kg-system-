import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await authAPI.getCurrentUser();
                setUser(response.data);
            }
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials);
            const { access_token, user: userData } = response.data;

            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            message.success('登录成功');
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.detail || '登录失败';
            message.error(errorMessage);
            return { success: false, message: errorMessage };
        }
    };

    const register = async (userData) => {
        try {
            await authAPI.register(userData);
            message.success('注册成功，请登录');
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.detail || '注册失败';
            message.error(errorMessage);
            return { success: false, message: errorMessage };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        message.success('已退出登录');
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAdmin: user?.is_admin || false,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};