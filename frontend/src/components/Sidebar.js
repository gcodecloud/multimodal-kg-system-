import React from 'react';
import { Layout, Menu } from 'antd';
import {
    DashboardOutlined,
    FileTextOutlined,
    ShareAltOutlined,
    UserOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/auth';

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin } = useAuth();

    const menuItems = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: '仪表板',
        },
        {
            key: '/files',
            icon: <FileTextOutlined />,
            label: '文件管理',
        },
        {
            key: '/graph',
            icon: <ShareAltOutlined />,
            label: '知识图谱',
        },
        {
            key: '/analytics',
            icon: <BarChartOutlined />,
            label: '数据分析',
        },
    ];

    // 如果是管理员，添加用户管理菜单
    if (isAdmin) {
        menuItems.push({
            key: '/users',
            icon: <UserOutlined />,
            label: '用户管理',
        });
    }

    const handleMenuClick = ({ key }) => {
        navigate(key);
    };

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 64,
                bottom: 0,
                zIndex: 1000,
                background: '#fff',
                boxShadow: '2px 0 6px rgba(0, 21, 41, 0.35)',
            }}
        >
            <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
                style={{
                    height: '100%',
                    borderRight: 0,
                }}
            />
        </Sider>
    );
};

export default Sidebar;