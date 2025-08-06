import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, Button, Space, Slider, Select, Input, Tooltip, message } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  SearchOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { Search } = Input;

const GraphVisualization = ({ data, onNodeClick, onNodeDoubleClick, height = 600 }) => {
  const svgRef = useRef(null);
  const [simulation, setSimulation] = useState(null);
  const [zoom, setZoom] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [linkDistance, setLinkDistance] = useState(100);
  const [chargeStrength, setChargeStrength] = useState(-300);
  const [searchText, setSearchText] = useState('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState('all');

  useEffect(() => {
    if (data && data.nodes && data.edges) {
      initGraph();
    }
    
    return () => {
      if (simulation) {
        simulation.stop();
      }
    };
  }, [data]);

  useEffect(() => {
    if (simulation) {
      simulation.force('link').distance(linkDistance);
      simulation.force('charge').strength(chargeStrength);
      simulation.alpha(0.3).restart();
    }
  }, [linkDistance, chargeStrength, simulation]);

  const initGraph = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svg.node().getBoundingClientRect().width;
    const graphHeight = height;

    // 创建缩放行为
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);
    setZoom(zoomBehavior);

    // 创建容器组
    const container = svg.append('g').attr('class', 'container');

    // 创建箭头标记
    svg.append('defs').selectAll('marker')
      .data(['arrow'])
      .enter().append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // 处理数据
    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.edges.map(d => ({ ...d }));

    // 创建力导向布局
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, graphHeight / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 5));

    setSimulation(sim);

    // 创建连线
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.width || 1))
      .attr('marker-end', 'url(#arrow)');

    // 创建连线标签
    const linkLabel = container.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(links)
      .enter().append('text')
      .attr('class', 'edge-label')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text(d => d.relation);

    // 创建节点
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('class', 'node')
      .attr('r', d => d.size || 10)
      .attr('fill', d => getNodeColor(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        // 移除之前选中节点的样式
        d3.selectAll('.node').classed('selected', false);
        // 为当前节点添加选中样式
        d3.select(event.currentTarget).classed('selected', true);
        
        setSelectedNode(d);
        if (onNodeClick) {
          onNodeClick(d);
        }
      })
      .on('dblclick', (event, d) => {
        if (onNodeDoubleClick) {
          onNodeDoubleClick(d);
        }
      })
      .on('mouseover', (event, d) => {
        // 显示工具提示
        showTooltip(event, d);
      })
      .on('mouseout', hideTooltip);

    // 创建节点标签
    const nodeLabel = container.append('g')
      .attr('class', 'node-labels')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .attr('class', 'node-label')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('text-anchor', 'middle')
      .attr('dy', d => (d.size || 10) + 15)
      .text(d => d.label.length > 10 ? d.label.substring(0, 10) + '...' : d.label);

    // 力导向布局更新
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      nodeLabel
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // 拖拽事件处理
    function dragstarted(event, d) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const getNodeColor = (type) => {
    const colors = {
      'PERSON': '#ff7875',
      'ORG': '#73d13d',
      'GPE': '#40a9ff',
      'PRODUCT': '#b37feb',
      'EVENT': '#ffbb96',
      'TIME': '#87e8de',
      'MONEY': '#ffd666',
    };
    return colors[type] || '#1890ff';
  };

  const showTooltip = (event, d) => {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    tooltip.transition()
      .duration(200)
      .style('opacity', .9);
    
    tooltip.html(`
      <strong>${d.label}</strong><br/>
      类型: ${d.type}<br/>
      置信度: ${(d.confidence * 100).toFixed(1)}%
    `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  };

  const hideTooltip = () => {
    d3.selectAll('.tooltip').remove();
  };

  const handleZoomIn = () => {
    if (zoom) {
      d3.select(svgRef.current).transition().call(
        zoom.scaleBy, 1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (zoom) {
      d3.select(svgRef.current).transition().call(
        zoom.scaleBy, 1 / 1.5
      );
    }
  };

  const handleReset = () => {
    if (zoom) {
      d3.select(svgRef.current).transition().call(
        zoom.transform,
        d3.zoomIdentity
      );
    }
    if (simulation) {
      simulation.alpha(1).restart();
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value) {
      // 高亮搜索结果
      d3.selectAll('.node')
        .style('opacity', d => d.label.toLowerCase().includes(value.toLowerCase()) ? 1 : 0.3)
        .style('stroke-width', d => d.label.toLowerCase().includes(value.toLowerCase()) ? 4 : 2);
    } else {
      // 清除高亮
      d3.selectAll('.node')
        .style('opacity', 1)
        .style('stroke-width', 2);
    }
  };

  const handleTypeFilter = (type) => {
    setNodeTypeFilter(type);
    if (type === 'all') {
      d3.selectAll('.node').style('opacity', 1);
      d3.selectAll('.node-label').style('opacity', 1);
    } else {
      d3.selectAll('.node')
        .style('opacity', d => d.type === type ? 1 : 0.2);
      d3.selectAll('.node-label')
        .style('opacity', d => d.type === type ? 1 : 0.2);
    }
  };

  const nodeTypes = data?.nodes ? [...new Set(data.nodes.map(n => n.type))] : [];

  return (
    <div className="graph-visualization-container" style={{ position: 'relative' }}>
      {/* 控制面板 */}
      <Card
        size="small"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 100,
          width: 300,
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Search
              placeholder="搜索节点"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <Select
              placeholder="筛选节点类型"
              style={{ width: '100%' }}
              value={nodeTypeFilter}
              onChange={handleTypeFilter}
            >
              <Option value="all">所有类型</Option>
              {nodeTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </div>

          <div>
            <div style={{ marginBottom: 8 }}>连线距离: {linkDistance}</div>
            <Slider
              min={50}
              max={200}
              value={linkDistance}
              onChange={setLinkDistance}
            />
          </div>

          <div>
            <div style={{ marginBottom: 8 }}>斥力强度: {Math.abs(chargeStrength)}</div>
            <Slider
              min={100}
              max={500}
              value={Math.abs(chargeStrength)}
              onChange={(value) => setChargeStrength(-value)}
            />
          </div>

          <Space>
            <Tooltip title="放大">
              <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
            </Tooltip>
            <Tooltip title="缩小">
              <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
            </Tooltip>
            <Tooltip title="重置">
              <Button icon={<ReloadOutlined />} onClick={handleReset} />
            </Tooltip>
          </Space>
        </Space>
      </Card>

      {/* SVG画布 */}
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          background: '#fff',
        }}
      />

      {/* 选中节点信息 */}
      {selectedNode && (
        <Card
          size="small"
          title="节点信息"
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            width: 250,
            zIndex: 100,
          }}
          extra={
            <Button
              type="text"
              size="small"
              onClick={() => setSelectedNode(null)}
            >
              ✕
            </Button>
          }
        >
          <div>
            <strong>标签:</strong> {selectedNode.label}
          </div>
          <div>
            <strong>类型:</strong> {selectedNode.type}
          </div>
          <div>
            <strong>置信度:</strong> {(selectedNode.confidence * 100).toFixed(1)}%
          </div>
        </Card>
      )}
    </div>
  );
};

export default GraphVisualization;