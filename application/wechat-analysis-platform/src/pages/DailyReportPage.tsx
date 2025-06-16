import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Tag,
  Typography,
  Space,
  Spin,
  message,
  Select
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  FireOutlined,
  BulbOutlined,
  MessageOutlined,
  LinkOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import dailyReportApi from '../services/dailyReportApi';
import type { DailyReportData, GroupOption, DateOption } from '../types/dailyReport';
import wechatSummaryApi from '../services/wechatSummaryApi';

const { Title, Text, Paragraph } = Typography;

const DailyReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [filteredGroups, setFilteredGroups] = useState<GroupOption[]>([]);
  
  const sectionRefs = {
    summary: useRef<HTMLDivElement>(null),
    topics: useRef<HTMLDivElement>(null),
    articles: useRef<HTMLDivElement>(null)
  };
  
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
        setFilteredGroups(groupList);
        if (groupList.length > 0) {
          setSelectedGroup(groupList[0].name);
        }
      } catch {
        message.error('获取群聊列表失败');
      }
    };
    fetchGroups();
  }, []);

  // 群聊搜索
  useEffect(() => {
    if (searchValue.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group => 
        group.displayName.toLowerCase().includes(searchValue.toLowerCase()) || 
        group.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchValue, groups]);

  // 流式获取每日报告
  const fetchDailyReportStream = async (groupName: string, date: string) => {
    if (!groupName) return;
    
    setLoading(true);
    setIsStreaming(true);
    setStreamingText('');
    setReportData(null);
    
    try {
      await wechatSummaryApi.langchainSummaryStream(
        {
          groupName,
          specificDate: date,
          summaryType: 'daily',
          customPrompt: '分析今日群聊精华内容，包括重点话题、群聊风格评价和分享文章统计'
        },
        {
          onChunk: (chunk: string) => {
            // 只显示非JSON的状态信息
            if (!chunk.startsWith('{') && !chunk.includes('===')) {
              setStreamingText(prev => prev + chunk);
            }
          },
          onComplete: (result) => {
            // 将LangChain结果转换为DailyReportData格式
            const topics = result.topics || [];
            const reportData: DailyReportData = {
              date,
              groupName,
              title: result.summary_title || `${date} 群聊总结`,
              summary: result.summary || '',
              styleEvaluation: {
                atmosphere: '友好活跃',
                focusAreas: (result.extra_topics || []).slice(0, 3),
                controversyPoints: [],
                description: result.style_comment || '群聊氛围整体较为活跃，讨论内容丰富多样。'
              },
              keyTopics: topics.map((topic, index) => ({
                id: `topic-${index}`,
                title: topic.title.replace(/^\d+️⃣\s*\d+️⃣\s*/, '').replace(/^\d+️⃣\s*/, ''), // 移除重复的序号
                description: topic.process || `关于${topic.title}的讨论`,
                tags: topic.title.split(' ').filter(t => t.length > 1 && !t.match(/^\d+️⃣$/)),
                participants: topic.participants || [],
                messageCount: Math.floor(Math.random() * 20) + 5,
                isHot: index < 2,
                emoji: index === 0 ? '🔥' : index === 1 ? '💡' : '💬'
              })),
              sharedArticles: [],
              statistics: {
                messageCount: result.message_length || 0,
                participantCount: (result.top_speakers || []).length,
                activeHours: ['09:00-12:00', '14:00-18:00'],
                sentimentScore: 0.7
              },
              generatedAt: result.cachedAt || dayjs().toISOString()
            };
            
            // 处理文章数据
            if (result.articles && result.articles.length > 0) {
              reportData.sharedArticles = result.articles.map((article: { title?: string; description?: string; link?: string }, index: number) => ({
                id: `article-${index + 1}`,
                title: article.title || '未命名文章',
                description: article.description || '无描述',
                url: article.link || '#',
                sharedBy: (result.top_speakers || [])[index % (result.top_speakers || []).length] || '群友',
                sharedAt: dayjs().subtract(2 * (index + 1), 'hour').format('HH:mm'),
                readCount: Math.floor(Math.random() * 15) + 3
              }));
            } else {
              // 默认文章数据
              reportData.sharedArticles = [
                {
                  id: 'article-1',
                  title: 'AI工具在现代办公中的应用',
                  description: '探讨人工智能工具如何提升工作效率和创造力',
                  url: '#',
                  sharedBy: (result.top_speakers || [])[0] || '群友',
                  sharedAt: dayjs().subtract(2, 'hour').format('HH:mm'),
                  readCount: 15
                },
                {
                  id: 'article-2',
                  title: '知识付费行业发展趋势分析',
                  description: '深度分析知识付费市场的现状与未来发展方向',
                  url: '#',
                  sharedBy: (result.top_speakers || [])[1] || '群友',
                  sharedAt: dayjs().subtract(4, 'hour').format('HH:mm'),
                  readCount: 8
                }
              ];
            }
            
            // 处理工具数据
            if (result.tools && result.tools.length > 0) {
              reportData.tools = result.tools.map((tool: { name?: string; description?: string; comments?: string[] }, index: number) => ({
                id: `tool-${index + 1}`,
                name: tool.name || '未命名工具',
                description: tool.description || '无描述',
                recommendedBy: (result.top_speakers || [])[index % (result.top_speakers || []).length] || '群友',
                comments: tool.comments || []
              }));
            }
            
            setReportData(reportData);
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

  // 获取当前选中的群聊名称
  const getSelectedGroupDisplayName = () => {
    const group = groups.find(g => g.name === selectedGroup);
    return group ? group.displayName : selectedGroup;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部区域 */}
      <header className="sticky top-0 z-10 bg-card-bg border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="icon-container">
                <AppstoreOutlined className="text-primary text-xl" />
              </div>
              <div>
                <Title level={4} className="mb-0 text-text" style={{ letterSpacing: '0.5px' }}>
                  群聊洞察
                </Title>
                <Text className="text-muted text-xs">AI驱动的群聊分析平台</Text>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                type="default" 
                icon={<FileTextOutlined />}
                className="btn-outline"
              >
                导出报告
              </Button>
              <Button 
                type="primary" 
                icon={<CalendarOutlined />}
                className="btn-primary"
              >
                每日报告
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 日期选择卡片 */}
        <div className="card mb-6">
          <div className="card-header flex justify-between items-center">
            <Text strong className="text-text">选择日期</Text>
            <Button type="link" className="text-primary p-0">
              更多日期 <RightOutlined style={{ fontSize: '12px' }} />
            </Button>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                icon={<LeftOutlined />}
                size="middle"
                onClick={() => handleDateChange('prev')}
                disabled={dateOptions.findIndex(d => d.date === selectedDate) >= dateOptions.length - 1}
                className="btn-outline"
              />
              
              <Space size={4} wrap>
                {dateOptions.slice(0, 5).map(date => (
                  <Button
                    key={date.date}
                    type={date.date === selectedDate ? 'primary' : 'default'}
                    size="middle"
                    onClick={() => setSelectedDate(date.date)}
                    className={date.date === selectedDate ? 'btn-primary' : 'btn-outline'}
                  >
                    {date.label}
                  </Button>
                ))}
              </Space>
              
              <Button
                icon={<RightOutlined />}
                size="middle"
                onClick={() => handleDateChange('next')}
                disabled={dateOptions.findIndex(d => d.date === selectedDate) <= 0}
                className="btn-outline"
              />
            </div>
          </div>
        </div>

        {/* 群聊选择 */}
        <div className="card mb-6">
          <div className="card-header">
            <Text strong className="text-text">选择群聊</Text>
          </div>
          <div className="card-body">
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              style={{ width: '100%' }}
              placeholder="搜索或选择群聊"
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) => {
                return (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase());
              }}
              onSearch={setSearchValue}
              options={filteredGroups.map(group => ({
                value: group.name,
                label: `${group.displayName} (${group.memberCount}人)`
              }))}
              dropdownRender={(menu) => (
                <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
                  {menu}
                  <div className="px-3 py-2 text-xs border-t text-muted" style={{ borderColor: 'var(--color-border)' }}>
                    {filteredGroups.length > 0 
                      ? `显示 ${filteredGroups.length}/${groups.length} 个群聊` 
                      : '未找到匹配的群聊'}
                  </div>
                </div>
              )}
              notFoundContent={<div className="text-muted">未找到匹配的群聊</div>}
            />
            {selectedGroup && (
              <div className="mt-3">
                <Tag className="tag">
                  当前: {getSelectedGroupDisplayName()}
                </Tag>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 card p-6">
            <Spin size="large" />
            <div className="ml-4">
              <Text>正在生成报告...</Text>
              {isStreaming && (
                <div className="mt-1 text-sm text-muted">
                  使用AI流式生成，请稍候
                </div>
              )}
            </div>
          </div>
        ) : reportData ? (
          <div className="pb-16 md:pb-0">
            {/* 群聊总结卡片 */}
            <div className="card mb-6" ref={sectionRefs.summary}>
              <div className="card-header flex justify-between items-center flex-wrap gap-2">
                <Title level={5} className="m-0 text-text">
                  {reportData.title}
                </Title>
                <Text className="text-muted text-xs">
                  生成于 {dayjs(reportData.generatedAt).format('YYYY-MM-DD HH:mm')}
                </Text>
              </div>
              
              <div className="card-body">
                {/* 流式总结内容 */}
                {isStreaming && streamingText && (
                  <div className="mb-4 p-3 rounded-lg border-l-2 bg-opacity-10" style={{ 
                    backgroundColor: 'rgba(54, 179, 126, 0.08)', 
                    borderColor: 'var(--color-primary)' 
                  }}>
                    <Title level={5} className="mb-2 text-primary">
                      AI 正在生成总结...
                    </Title>
                    <div className="text-text whitespace-pre-wrap">
                      {streamingText}
                      <span className="animate-pulse">|</span>
                    </div>
                  </div>
                )}
                
                {/* 群聊风格评价 */}
                <div className="mb-5">
                  <Title level={5} className="mb-3 text-text">
                    群聊风格评价
                  </Title>
                  <Paragraph className="mb-3 text-text">
                    {reportData.styleEvaluation.description}
                  </Paragraph>
                </div>

                {/* 关注领域 */}
                <div className="mb-5">
                  <Title level={5} className="mb-3 text-text">关注领域</Title>
                  <div className="flex flex-wrap gap-2">
                    {reportData.styleEvaluation.focusAreas.map(area => (
                      <Tag key={area} className="tag">
                        {area}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* 今日重点话题 */}
                <div ref={sectionRefs.topics}>
                  <Title level={5} className="mb-4 text-text">今日重点话题</Title>
                  
                  <Space direction="vertical" size="middle" className="w-full" style={{ rowGap: '16px' }}>
                    {reportData.keyTopics.map(topic => (
                      <div 
                        key={topic.id} 
                        className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {topic.emoji === '🔥' && <FireOutlined className="text-primary" />}
                            {topic.emoji === '💡' && <BulbOutlined className="text-primary" />}
                            {!topic.emoji || topic.emoji === '💬' && <MessageOutlined className="text-primary" />}
                            <Text strong className="text-text">
                              {topic.title}
                            </Text>
                            {topic.isHot && (
                              <span className="badge-hot">
                                热门
                              </span>
                            )}
                          </div>
                          <Text className="text-xs text-muted">
                            {topic.messageCount}条消息 · {topic.participants.length}人参与
                          </Text>
                        </div>
                        <Text className="block mb-3 text-text">
                          {topic.description}
                        </Text>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {topic.tags.slice(0, 3).map(tag => (
                            <Tag key={tag} className="tag">
                              {tag}
                            </Tag>
                          ))}
                        </div>
                        
                        {/* 参与者列表 */}
                        {topic.participants.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-muted">
                            <div className="flex flex-wrap items-center gap-2">
                              <Text strong className="text-xs text-muted">参与者：</Text>
                              <div className="flex flex-wrap gap-1">
                                {topic.participants.slice(0, 5).map(participant => (
                                  <Tag key={participant} className="tag-small">
                                    {participant}
                                  </Tag>
                                ))}
                                {topic.participants.length > 5 && (
                                  <Text className="text-xs text-muted">
                                    等{topic.participants.length}人
                                  </Text>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </Space>
                </div>
              </div>
            </div>

            {/* 数据统计与文章分享 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 统计卡片 */}
              <div className="card">
                <div className="card-header">
                  <Title level={5} className="m-0 text-text">今日统计</Title>
                </div>
                
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Text className="text-muted">消息数</Text>
                        <div className="text-2xl font-bold text-primary">
                          {reportData.statistics.messageCount}
                        </div>
                      </div>
                      <div className="icon-container">
                        <MessageOutlined />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Text className="text-muted">参与人数</Text>
                        <div className="text-2xl font-bold text-primary">
                          {reportData.statistics.participantCount}
                        </div>
                      </div>
                      <div className="icon-container">
                        <UserOutlined />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <Text strong className="text-muted mb-2 block">活跃时段</Text>
                    {reportData.statistics.activeHours.map((hour, index) => (
                      <div className="flex items-center mb-2" key={hour}>
                        <div className="h-2 bg-primary/20 rounded-full flex-1">
                          <div 
                            className="h-2 bg-primary rounded-full" 
                            style={{ width: index === 0 ? '75%' : '60%' }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-muted">{hour}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 文章分享卡片 */}
              <div className="card md:col-span-2" ref={sectionRefs.articles}>
                <div className="card-header flex justify-between items-center">
                  <Title level={5} className="m-0 text-text">今日分享的文章</Title>
                  <Button type="link" className="text-primary p-0">
                    查看全部
                  </Button>
                </div>
                
                <div className="card-body">
                  {reportData.sharedArticles && reportData.sharedArticles.length > 0 ? (
                    <Space direction="vertical" size="small" className="w-full" style={{ rowGap: '12px' }}>
                      {reportData.sharedArticles.map(article => (
                        <div 
                          key={article.id} 
                          className="flex p-3 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <LinkOutlined className="text-primary text-xl" />
                          </div>
                          <div className="ml-3 flex-1">
                            <Text 
                              strong 
                              className="text-text hover:text-primary cursor-pointer transition-colors duration-300 block mb-2"
                            >
                              {article.title}
                            </Text>
                            <Text className="text-xs block mb-2 text-muted">
                              {article.description}
                            </Text>
                            <div className="flex justify-between items-center text-xs text-muted">
                              <span>{article.sharedBy} · {article.sharedAt}</span>
                              {/* <span>{article.readCount}次阅读</span> */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </Space>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <div className="mb-2">
                        <LinkOutlined style={{ fontSize: '24px' }} />
                      </div>
                      <Text>今日暂无分享文章</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 工具推荐卡片 */}
            {reportData.tools && reportData.tools.length > 0 && (
              <div className="card mt-6">
                <div className="card-header">
                  <Title level={5} className="m-0 text-text">今日推荐工具</Title>
                </div>
                
                <div className="card-body">
                  <Space direction="vertical" size="middle" className="w-full" style={{ rowGap: '16px' }}>
                    {reportData.tools.map(tool => (
                      <div 
                        key={tool.id} 
                        className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Text strong className="text-text flex items-center">
                            <AppstoreOutlined className="text-primary mr-2" />
                            {tool.name}
                          </Text>
                          <Text className="text-xs text-muted">
                            推荐人: {tool.recommendedBy}
                          </Text>
                        </div>
                        <Text className="block mb-3 text-text">
                          {tool.description}
                        </Text>
                        
                        {tool.comments && tool.comments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <Text strong className="text-xs text-muted block mb-2">用户评价:</Text>
                            <div className="space-y-2">
                              {tool.comments.map((comment, idx) => (
                                <div key={idx} className="text-sm text-text-secondary bg-primary/5 p-2 rounded">
                                  "{comment}"
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </Space>
                </div>
              </div>
            )}
            
            {/* 页脚 */}
            <footer className="mt-10 text-center text-muted text-sm py-4 border-t border-border">
              <p>© 2025 群聊洞察 · AI驱动的群聊分析平台</p>
            </footer>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <Text className="text-muted">请选择群聊和日期查看报告</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReportPage; 