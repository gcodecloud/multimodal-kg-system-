import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { userAPI } from '../services/api';
import { useAuth } from '../services/auth';
import moment from 'moment';

const { Title, Text } = Typography;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      is_active: user.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (userId) => {
    try {
      await userAPI.deleteUser(userId);
      message.success('用户删除成功');
      loadUsers();
    } catch (error) {
      message.error('用户删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await userAPI.updateUser(editingUser.id, values);
        message.success('用户更新成功');
      } else {
        await userAPI.createUser(values);
        message.success('用户创建成功');
      }
      setModalVisible(false);
      loadUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || '操作失败';
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text) => (
        <Space>
          <MailOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'is_admin',
      key: 'is_admin',
      render: (isAdmin) => (
        <Tag color={isAdmin ? 'red' : 'blue'}>
          {isAdmin ? '管理员' : '普通用户'}
        </Tag>
      ),
      filters: [
        { text: '管理员', value: true },
        { text: '普通用户', value: false },
      ],
      onFilter: (value, record) => record.is_admin === value,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
      filters: [
        { text: '启用', value: true },
        { text: '禁用', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => moment(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.id === currentUser?.id} // 不能编辑自己
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个用户吗？此操作不可恢复。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={record.id === currentUser?.id} // 不能删除自己
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.id === currentUser?.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>用户管理</Title>
          <Text type="secondary">管理系统用户和权限</Text>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建用户
          </Button>
        </div>

        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            total: users.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />

        <Modal
          title={editingUser ? '编辑用户' : '新建用户'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                disabled={!!editingUser} // 编辑时不能修改用户名
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="请输入邮箱"
              />
            </Form.Item>

            {!editingUser && (
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                />
              </Form.Item>
            )}

            <Form.Item
              name="is_admin"
              label="管理员权限"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="是"
                unCheckedChildren="否"
              />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="启用状态"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
            </Form.Item>

            <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingUser ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default UserManagement;