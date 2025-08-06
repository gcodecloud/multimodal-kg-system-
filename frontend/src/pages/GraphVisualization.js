import React, { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Button,
  Typography,
  Row,
  Col,
  Space,
  Statistic,
  Table,
  Input,
  message,
  Spin,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { graphAPI, fileAPI } from '../services/api';
import GraphVisualization from '../components/GraphVisualization';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const GraphVisualizationPage = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(fileId);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphStats, setGraphStats] = useState({
    total_nodes: 0,
    total_edges: 0,
  });

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    if (selectedFileId) {
      loadGraphData(selectedFileId);
    }
  }, [selectedFileId]);

  const loadFiles = async () => {
    try {
      const response = await fileAPI.getFiles();
      const completedFiles = response.data.filter(file => file.status === 'completed');
      setFiles(completedFiles);
      
      // 如果没有选中的文件ID且有可用文件，自动选择第一个
      if (!selectedFileId && completedFiles.length > 0) {
        const firstFileId = completedFiles[0].id;
        setSelectedFileId(firstFileId);
        // 更新URL以包含文件ID
        navigate(`/graph/${firstFileId}`, { replace: true });
      }
    } catch (error) {
      message.error('加载文件列表失败');
    }
  };

  const loadGraphData = async (fId) => {
    try {
      setLoading(true);
      const response = await graphAPI.getGraph(fId);
      const data = response.data;
      
      // 转换数据格式以适配D3
      const transformedData = {
        nodes: data.graph_data.nodes || [],
        edges: data.graph_data.edges || [],
      };
      
      setGraphData(transformedData);
      setGraphStats({
        total_nodes: transformedData.nodes.length,
        total_edges: transformedData.edges.length,
      });
    } catch (error) {
      message.error('加载图谱数据失败');
      setGraphData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await graphAPI.searchGraph(query);
      setSearchResults(response.data.results || []);
    } catch (error) {
      message.error('搜索失败');
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleNodeDoubleClick = (node) => {
    // 双击节点时可以执行更多操作，比如显示详细信息
    console.log('Double clicked node:', node);
  };

  const handleFileChange = (fId) => {
    setSelectedFileId(fId);
    navigate(`/graph/${fId}`);
  };

  const handleExportGraph = () => {
    if (!graphData) {
      message.warning('暂无图谱数据可导出');
      return;
    }

    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `graph_${selectedFileId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const searchColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => (
        <span style={{ 
          color: type === 'entity' ? '#1890ff' : '#52c41a',
          fontWeight: 'bold' 
        }}>
          {type === 'entity' ? '实体' : '关系'}
        </span>
      ),
    },
    {
      title: '内容',
      dataIndex: 'data',
      key: 'content',
      render: (data, record) => {
        if (record.type === 'entity') {
          return data.text || data.label;
        } else {
          return `${data.subject} - ${data.relation} - ${data.object}`;
        }
      },
    },
    {
      title: '文件',
      dataIndex: 'file_id',
      key: 'file_id',
      width: 100,
      render: (fileId) => {
        const file = files.find(f => f.id === fileId);
        return file ? file.filename : fileId;
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        {/* 头部控制区 */}
        <Col span={24}>
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Title level={2}>知识图谱可视化</Title>
              <Text type="secondary">交互式图谱浏览和分析</Text>
            </div>

            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={6}>
                <Space>
                  <Text>选择文件:</Text>
                  <Select
                    style={{ width: 200 }}
                    value={selectedFileId}
                    onChange={handleFileChange}
                    placeholder={files.length === 0 ? "暂无可用文件" : "选择文件"}
                    disabled={files.length === 0}
                  >
                    {files.map(file => (
                      <Option key={file.id} value={file.id}>
                        {file.filename}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Search
                  placeholder="搜索实体或关系"
                  allowClear
                  onSearch={handleSearch}
                  style={{ width: '100%' }}
                  disabled={!selectedFileId}
                />
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => selectedFileId && loadGraphData(selectedFileId)}
                    loading={loading}
                    disabled={!selectedFileId}
                  >
                    刷新
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportGraph}
                    disabled={!graphData}
                  >
                    导出
                  </Button>
                </Space>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Space>
                  <Statistic
                    title="节点"
                    value={graphStats.total_nodes}
                    valueStyle={{ fontSize: '18px', color: '#1890ff' }}
                  />
                  <Statistic
                    title="边"
                    value={graphStats.total_edges}
                    valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 主要内容区域 */}
        <Col xs={24} lg={18}>
          <Card
            title="图谱视图"
            style={{ height: '700px' }}
            bodyStyle={{ padding: 0, height: 'calc(100% - 57px)' }}
          >
            {loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                <Spin size="large" />
              </div>
            ) : graphData ? (
              <GraphVisualization
                data={graphData}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                height={643}
              />
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#999'
              }}>
                <div style={{ textAlign: 'center' }}>
                  {files.length === 0 ? (
                    <div>
                      <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '16px' }}>
                        暂无已处理的文件
                      </Text>
                      <Button 
                        type="primary" 
                        onClick={() => navigate('/files')}
                      >
                        去上传文件
                      </Button>
                    </div>
                  ) : (
                    <Text type="secondary" style={{ fontSize: '16px' }}>
                      {selectedFileId ? '暂无图谱数据' : '请选择文件查看图谱'}
                    </Text>
                  )}
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 侧边信息区域 */}
        <Col xs={24} lg={6}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* 节点详情 */}
            {selectedNode && (
              <Card title="节点详情" size="small">
                <div style={{ marginBottom: '8px' }}>
                  <strong>标签:</strong> {selectedNode.label}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>类型:</strong> {selectedNode.type}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>置信度:</strong> {(selectedNode.confidence * 100).toFixed(1)}%
                </div>
                {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                  <div>
                    <strong>属性:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {Object.entries(selectedNode.properties).map(([key, value]) => (
                        <li key={key}>{key}: {value}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <Card title="搜索结果" size="small">
                <Table
                  dataSource={searchResults}
                  columns={searchColumns}
                  rowKey={(record, index) => `${record.type}_${index}`}
                  pagination={{
                    pageSize: 5,
                    size: 'small',
                  }}
                  size="small"
                />
              </Card>
            )}

            {/* 图谱统计 */}
            <Card title="图谱统计" size="small">
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Statistic
                    title="实体数量"
                    value={graphStats.total_nodes}
                    valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="关系数量"
                    value={graphStats.total_edges}
                    valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                  />
                </Col>
              </Row>
              
              {graphData && (
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    节点类型分布:
                  </Text>
                  {[...new Set(graphData.nodes.map(n => n.type))].map(type => {
                    const count = graphData.nodes.filter(n => n.type === type).length;
                    return (
                      <div key={type} style={{ fontSize: '12px', marginTop: '4px' }}>
                        {type}: {count}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default GraphVisualizationPage;