import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, message } from 'antd';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FileManagement from './pages/FileManagement';
import GraphVisualization from './pages/GraphVisualization';
import UserManagement from './pages/UserManagement';
import { AuthProvider, useAuth } from './services/auth';
import './App.css';

const { Content } = Layout;

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>加载中...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// 主应用布局
const AppLayout = () => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header collapsed={collapsed} setCollapsed={setCollapsed} />
            <Layout>
                <Sidebar collapsed={collapsed} />
                <Layout>
                    <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/files" element={<FileManagement />} />
                            <Route path="/graph/:fileId?" element={<GraphVisualization />} />
                            <Route path="/users" element={<UserManagement />} />
                        </Routes>
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

function App() {
    return (
        <AuthProvider>
            <div className="App">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    } />
                </Routes>
            </div>
        </AuthProvider>
    );
}

export default App;