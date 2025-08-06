import React from 'react';
import { Layout, Button, Dropdown, Avatar, Space, Typography } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = ({ collapsed, setCollapsed }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleMenuClick = ({ key }) => {
        switch (key) {
            case 'profile':
                // 跳转到个人资料页面
                break;
            case 'settings':
                // 跳转到设置页面
                break;
            case 'logout':
                logout();
                navigate('/login');
                break;
            default:
                break;
        }
    };

    const menuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: '个人资料',
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: '设置',
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            danger: true,
        },
    ];

    return (
        <AntHeader
            style={{
                padding: 0,
                background: '#001529',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        fontSize: '16px',
                        width: 64,
                        height: 64,
                        color: 'white',
                    }}
                />
                <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                    多模态知识图谱系统
                </div>
            </div>

            <div style={{ marginRight: '24px' }}>
                <Dropdown
                    menu={{
                        items: menuItems,
                        onClick: handleMenuClick,
                    }}
                    placement="bottomRight"
                    arrow
                >
                    <Space style={{ cursor: 'pointer', color: 'white' }}>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <Text style={{ color: 'white' }}>
                            {user?.username}
                            {user?.is_admin && <span style={{ color: '#52c41a' }}> (管理员)</span>}
                        </Text>
                    </Space>
                </Dropdown>
            </div>
        </AntHeader>
    );
};

export default Header;