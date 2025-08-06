import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Space,
  Tag,
  Button,
  Progress,
} from 'antd';
import {
  FileTextOutlined,
  ShareAltOutlined,
  UserOutlined,
  UploadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { fileAPI, graphAPI } from '../services/api';
import moment from 'moment';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalEntities: 0,
    totalRelations: 0,
    processedFiles: 0,
  });
  const [recentFiles, setRecentFiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取文件列表
      const filesResponse = await fileAPI.getFiles();
      const files = filesResponse.data;
      
      // 计算统计数据
      const totalFiles = files.length;
      const processedFiles = files.filter(f => f.status === 'completed').length;
      
      // 获取最近的文件
      const sortedFiles = files
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      setStats({
        totalFiles,
        processedFiles,
        totalEntities: 0, // 这里可以从图谱API获取
        totalRelations: 0, // 这里可以从图谱API获取
      });
      
      setRecentFiles(sortedFiles);
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      uploaded: { color: 'blue', text: '已上传' },
      processing: { color: 'orange', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      error: { color: 'red', text: '处理失败' },
    };
    
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const recentFilesColumns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 80,
      render: (type) => type.toUpperCase(),
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: formatFileSize,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (time) => moment(time).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.status === 'completed' && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/graph/${record.id}`)}
            >
              查看图谱
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const processingRate = stats.totalFiles > 0 ? (stats.processedFiles / stats.totalFiles) * 100 : 0;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>仪表板</Title>
        <Text type="secondary">系统概览和最新动态</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总文件数"
              value={stats.totalFiles}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已处理文件"
              value={stats.processedFiles}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="知识实体"
              value={stats.totalEntities}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="实体关系"
              value={stats.totalRelations}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 处理进度 */}
        <Col xs={24} lg={8}>
          <Card title="处理进度" style={{ height: '400px' }}>
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <Progress
                type="circle"
                percent={Math.round(processingRate)}
                format={(percent) => `${percent}%`}
                size={120}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div style={{ marginTop: '24px' }}>
                <Text type="secondary">
                  已处理 {stats.processedFiles} / {stats.totalFiles} 个文件
                </Text>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => navigate('/files')}
                >
                  上传文件
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* 最近文件 */}
        <Col xs={24} lg={16}>
          <Card
            title="最近文件"
            style={{ height: '400px' }}
            extra={
              <Button type="link" onClick={() => navigate('/files')}>
                查看全部
              </Button>
            }
          >
            <Table
              dataSource={recentFiles}
              columns={recentFilesColumns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
              scroll={{ y: 280 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="快速操作">
            <Space size="large">
              <Button
                type="primary"
                icon={<UploadOutlined />}
                size="large"
                onClick={() => navigate('/files')}
              >
                上传文件
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                size="large"
                onClick={() => navigate('/graph')}
              >
                查看图谱
              </Button>
              <Button
                icon={<EyeOutlined />}
                size="large"
                onClick={() => navigate('/analytics')}
              >
                数据分析
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;