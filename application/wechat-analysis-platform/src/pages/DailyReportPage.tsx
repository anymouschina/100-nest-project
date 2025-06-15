import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Typography,
  Row,
  Col,
  Space,
  Spin,
  message,
  Select,
  Divider
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  FireOutlined,
  BulbOutlined,
  MessageOutlined,
  LinkOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import dailyReportApi from '../services/dailyReportApi';
import type { DailyReportData, GroupOption, DateOption } from '../types/dailyReport';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const DailyReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);

  // 初始化日期选项
  useEffect(() => {
    const dates: DateOption[] = [];
    for (let i = 0; i < 7; i++) {
      const date = dayjs().subtract(i, 'day');
      dates.push({
        date: date.format('YYYY-MM-DD'),
        label: date.format('MM-DD'),
        isSelected: i === 0
      });
    }
    setDateOptions(dates);
  }, []);

  // 获取群聊列表
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groupList = await dailyReportApi.getGroups();
        setGroups(groupList);
        if (groupList.length > 0) {
          setSelectedGroup(groupList[0].name);
        }
      } catch {
        message.error('获取群聊列表失败');
      }
    };
    fetchGroups();
  }, []);

  // 流式获取每日报告
  const fetchDailyReportStream = async (groupName: string, date: string) => {
    if (!groupName) return;
    
    setLoading(true);
    setIsStreaming(true);
    setStreamingText('');
    setReportData(null);
    
    try {
      await dailyReportApi.getDailyReportStream(
        {
          groupName,
          specificDate: date,
          summaryType: 'daily',
          customPrompt: '分析今日群聊精华内容，包括重点话题、群聊风格评价和分享文章统计'
        },
        {
          onSummaryChunk: (chunk: string) => {
            setStreamingText(prev => prev + chunk);
          },
          onStyleEvaluation: (style) => {
            setReportData(prev => prev ? { ...prev, styleEvaluation: style } : null);
          },
          onKeyTopics: (topics) => {
            setReportData(prev => prev ? { ...prev, keyTopics: topics } : null);
          },
          onSharedArticles: (articles) => {
            setReportData(prev => prev ? { ...prev, sharedArticles: articles } : null);
          },
          onStatistics: (stats) => {
            setReportData(prev => prev ? { ...prev, statistics: stats } : null);
          },
          onComplete: (data) => {
            setReportData(data);
            setIsStreaming(false);
            message.success('报告生成完成');
          },
          onError: (error) => {
            message.error(`生成报告失败: ${error}`);
            setIsStreaming(false);
          }
        }
      );
    } catch {
      message.error('获取每日报告失败');
      setIsStreaming(false);
    } finally {
      setLoading(false);
    }
  };



  // 当群聊或日期改变时获取报告
  useEffect(() => {
    if (selectedGroup && selectedDate) {
      // 优先使用流式接口
      fetchDailyReportStream(selectedGroup, selectedDate);
    }
  }, [selectedGroup, selectedDate]);

  // 日期切换
  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentIndex = dateOptions.findIndex(d => d.date === selectedDate);
    let newIndex;
    
    if (direction === 'prev' && currentIndex < dateOptions.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'next' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else {
      return;
    }
    
    setSelectedDate(dateOptions[newIndex].date);
  };

  // 获取话题图标
  const getTopicIcon = (emoji?: string) => {
    switch (emoji) {
      case '🔥': return <FireOutlined style={{ color: '#ff4d4f' }} />;
      case '💡': return <BulbOutlined style={{ color: '#faad14' }} />;
      default: return <MessageOutlined style={{ color: '#1890ff' }} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部区域 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BarChartOutlined className="text-2xl text-blue-500" />
              <Title level={3} className="mb-0">群聊洞察</Title>
            </div>
            <Button type="primary" icon={<CalendarOutlined />}>
              每日报告
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 标题与筛选区 */}
        <div className="mb-6">
          <Title level={2} className="mb-2">每日报告</Title>
          <Text type="secondary" className="text-base">
            详细回顾每日群聊精华内容
          </Text>
          
          <div className="mt-6 bg-white p-4 rounded-lg card-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Text strong>选择群聊：</Text>
                <Select
                  value={selectedGroup}
                  onChange={setSelectedGroup}
                  style={{ width: 200 }}
                  placeholder="请选择群聊"
                >
                  {groups.map(group => (
                    <Option key={group.name} value={group.name}>
                      {group.displayName} ({group.memberCount}人)
                    </Option>
                  ))}
                </Select>
              </div>
              
              <div className="flex items-center space-x-4">
                <Text strong>选择日期：</Text>
                <div className="flex items-center space-x-2">
                  <Button
                    icon={<LeftOutlined />}
                    size="small"
                    onClick={() => handleDateChange('prev')}
                    disabled={dateOptions.findIndex(d => d.date === selectedDate) >= dateOptions.length - 1}
                  />
                  
                  <Space>
                    {dateOptions.slice(0, 5).map(date => (
                      <Button
                        key={date.date}
                        type={date.date === selectedDate ? 'primary' : 'default'}
                        size="small"
                        onClick={() => setSelectedDate(date.date)}
                      >
                        {date.label}
                      </Button>
                    ))}
                  </Space>
                  
                  <Button
                    icon={<RightOutlined />}
                    size="small"
                    onClick={() => handleDateChange('next')}
                    disabled={dateOptions.findIndex(d => d.date === selectedDate) <= 0}
                  />
                  
                  <Button type="link" size="small">
                    更多日期
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
            <div className="ml-4">
              <Text>正在生成报告...</Text>
              {isStreaming && (
                <div className="mt-2 text-sm text-gray-500">
                  使用AI流式生成，请稍候
                </div>
              )}
            </div>
          </div>
        ) : reportData ? (
          <Row gutter={24}>
            {/* 左侧主模块 */}
            <Col span={16}>
              <Card className="mb-6 card-shadow hover-scale">
                <Title level={4} className="mb-4">
                  {reportData.title}
                </Title>
                
                {/* 流式总结内容 */}
                {isStreaming && streamingText && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <Title level={5} className="mb-3 text-yellow-700">
                      AI 正在生成总结...
                    </Title>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {streamingText}
                      <span className="animate-pulse">|</span>
                    </div>
                  </div>
                )}
                
                {/* 群聊风格评价 */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <Title level={5} className="mb-3 text-blue-700">
                    群聊风格评价
                  </Title>
                  <Paragraph className="mb-3 text-gray-700">
                    {reportData.styleEvaluation.description}
                  </Paragraph>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Text strong>关注领域：</Text>
                    {reportData.styleEvaluation.focusAreas.map(area => (
                      <Tag key={area} color="blue">{area}</Tag>
                    ))}
                  </div>
                  
                  {reportData.styleEvaluation.controversyPoints.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <Text strong>争议点：</Text>
                      {reportData.styleEvaluation.controversyPoints.map(point => (
                        <Tag key={point} color="orange">{point}</Tag>
                      ))}
                    </div>
                  )}
                </div>

                {/* 今日重点话题 */}
                <div>
                  <Title level={5} className="mb-4">今日重点话题</Title>
                  <Space direction="vertical" size="middle" className="w-full">
                    {reportData.keyTopics.map(topic => (
                      <Card key={topic.id} size="small" className="hover-scale">
                        <div className="flex items-start space-x-3">
                          <div className="text-xl">
                            {getTopicIcon(topic.emoji)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Text strong className="text-base">{topic.title}</Text>
                              {topic.isHot && <Tag color="red">热门</Tag>}
                            </div>
                            <Text type="secondary" className="block mb-2">
                              {topic.description}
                            </Text>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                {topic.tags.map(tag => (
                                  <Tag key={tag}>{tag}</Tag>
                                ))}
                              </div>
                              <Text type="secondary" className="text-sm">
                                {topic.messageCount}条消息 · {topic.participants.length}人参与
                              </Text>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Space>
                </div>
              </Card>
            </Col>

            {/* 右侧副模块 */}
            <Col span={8}>
              <Card title="今日分享的文章" className="card-shadow hover-scale">
                <Space direction="vertical" size="middle" className="w-full">
                  {reportData.sharedArticles.map(article => (
                    <div key={article.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex items-start space-x-2 mb-2">
                        <LinkOutlined className="text-blue-500 mt-1" />
                        <div className="flex-1">
                          <Text strong className="text-sm hover:text-blue-500 cursor-pointer">
                            {article.title}
                          </Text>
                        </div>
                      </div>
                      <Text type="secondary" className="text-xs block mb-2">
                        {article.description}
                      </Text>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{article.sharedBy} · {article.sharedAt}</span>
                        <span>{article.readCount}次阅读</span>
                      </div>
                    </div>
                  ))}
                </Space>
                
                <Divider />
                
                {/* 统计信息 */}
                <div className="space-y-2">
                  <Title level={5} className="mb-3">今日统计</Title>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-500">
                        {reportData.statistics.messageCount}
                      </div>
                      <div className="text-xs text-gray-500">消息数</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-500">
                        {reportData.statistics.participantCount}
                      </div>
                      <div className="text-xs text-gray-500">参与人数</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Text type="secondary" className="text-xs">
                      活跃时段：{reportData.statistics.activeHours.join(', ')}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        ) : (
          <div className="text-center py-12">
            <Text type="secondary">请选择群聊和日期查看报告</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReportPage; 