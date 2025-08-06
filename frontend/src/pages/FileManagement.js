import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Upload,
  message,
  Space,
  Tag,
  Modal,
  Progress,
  Typography,
  Input,
  Row,
  Col,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import { fileAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Search } = Input;

const FileManagement = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fileAPI.getFiles();
      setFiles(response.data);
    } catch (error) {
      message.error('加载文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    const fileId = Date.now();
    setUploadProgress({ ...uploadProgress, [fileId]: 0 });
    setUploading(true);

    try {
      await fileAPI.upload(file, (progress) => {
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      });
      
      message.success('文件上传成功');
      loadFiles(); // 重新加载文件列表
    } catch (error) {
      message.error('文件上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }

    return false; // 阻止默认上传行为
  };

  const handleDelete = async (fileId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文件吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await fileAPI.deleteFile(fileId);
          message.success('文件删除成功');
          loadFiles();
        } catch (error) {
          message.error('文件删除失败');
        }
      },
    });
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

  // 拖拽上传配置
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach(file => {
      handleUpload(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    multiple: true,
  });

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.filename.toLowerCase().includes(value.toLowerCase()),
      render: (text) => (
        <div style={{ maxWidth: '200px' }}>
          <Text ellipsis={{ tooltip: text }}>{text}</Text>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 80,
      render: (type) => (
        <Tag color="blue">{type.toUpperCase()}</Tag>
      ),
      filters: [
        { text: 'TXT', value: '.txt' },
        { text: 'PDF', value: '.pdf' },
        { text: 'DOCX', value: '.docx' },
        { text: 'JPG', value: '.jpg' },
        { text: 'PNG', value: '.png' },
      ],
      onFilter: (value, record) => record.file_type === value,
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: formatFileSize,
      sorter: (a, b) => a.file_size - b.file_size,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
      filters: [
        { text: '已上传', value: 'uploaded' },
        { text: '处理中', value: 'processing' },
        { text: '已完成', value: 'completed' },
        { text: '处理失败', value: 'error' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => moment(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      defaultSortOrder: 'descend',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
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
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <div style={{ marginBottom: '24px' }}>
              <Title level={2}>文件管理</Title>
              <Text type="secondary">上传文件并进行知识抽取处理</Text>
            </div>

            {/* 文件上传区域 */}
            <Card
              title="上传文件"
              style={{ marginBottom: '24px' }}
              bodyStyle={{ padding: '24px' }}
            >
              <div
                {...getRootProps()}
                className={`upload-area ${isDragActive ? 'dragover' : ''}`}
                style={{
                  border: '2px dashed #d9d9d9',
                  borderRadius: '6px',
                  padding: '40px',
                  textAlign: 'center',
                  background: isDragActive ? '#e6f7ff' : '#fafafa',
                  borderColor: isDragActive ? '#1890ff' : '#d9d9d9',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                <input {...getInputProps()} />
                <InboxOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <div>
                  <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                    {isDragActive ? '放开鼠标上传文件' : '点击或拖拽文件到这里上传'}
                  </Text>
                  <Text type="secondary">
                    支持 .txt, .pdf, .docx, .jpg, .png 格式，最大 100MB
                  </Text>
                </div>
              </div>

              {/* 上传进度 */}
              {Object.keys(uploadProgress).length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  {Object.entries(uploadProgress).map(([fileId, progress]) => (
                    <div key={fileId} style={{ marginBottom: '8px' }}>
                      <Progress percent={progress} status="active" />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Upload
                  beforeUpload={handleUpload}
                  showUploadList={false}
                  multiple
                  accept=".txt,.pdf,.docx,.jpg,.jpeg,.png"
                >
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    loading={uploading}
                    size="large"
                  >
                    选择文件上传
                  </Button>
                </Upload>
              </div>
            </Card>

            {/* 文件列表 */}
            <Card title="文件列表">
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <Search
                  placeholder="搜索文件名"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 300 }}
                  allowClear
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadFiles}
                  loading={loading}
                >
                  刷新
                </Button>
              </div>

              <Table
                dataSource={filteredFiles}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{
                  total: filteredFiles.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
                scroll={{ x: 800 }}
              />
            </Card>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FileManagement;