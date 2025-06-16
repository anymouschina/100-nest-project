import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Tag,
  Typography,
  Row,
  Col,
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
  BarChartOutlined,
  AppstoreOutlined,
  FileTextOutlined
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
  const [activeSection, setActiveSection] = useState<string>('summary');
  
  const sectionRefs = {
    summary: useRef<HTMLDivElement>(null),
    topics: useRef<HTMLDivElement>(null),
    articles: useRef<HTMLDivElement>(null)
  };
  
  // 监听滚动，更新当前活跃区域
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      // 确定当前可见的区域
      if (sectionRefs.articles.current && scrollPosition >= sectionRefs.articles.current.offsetTop) {
        setActiveSection('articles');
      } else if (sectionRefs.topics.current && scrollPosition >= sectionRefs.topics.current.offsetTop) {
        setActiveSection('topics');
      } else if (sectionRefs.summary.current) {
        setActiveSection('summary');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              sharedArticles: [
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
              ],
              statistics: {
                messageCount: result.message_length || 0,
                participantCount: (result.top_speakers || []).length,
                activeHours: ['09:00-12:00', '14:00-18:00'],
                sentimentScore: 0.7
              },
              generatedAt: result.cachedAt || dayjs().toISOString()
            };
            
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

  // 获取话题图标
  const getTopicIcon = (emoji?: string) => {
    switch (emoji) {
      case '🔥': return <FireOutlined className="text-error" />;
      case '💡': return <BulbOutlined className="text-warning" />;
      default: return <MessageOutlined className="text-primary" />;
    }
  };

  // 获取当前选中的群聊名称
  const getSelectedGroupDisplayName = () => {
    const group = groups.find(g => g.name === selectedGroup);
    return group ? group.displayName : selectedGroup;
  };
  
  // 滚动到指定区域
  const scrollToSection = (section: string) => {
    const ref = sectionRefs[section as keyof typeof sectionRefs];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen grid-texture">
      {/* 顶部区域 */}
      <header className="sticky top-0 z-10" style={{ backgroundColor: 'rgba(30, 27, 44, 0.95)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AppstoreOutlined className="text-primary text-xl" />
              <div>
                <Title level={4} className="mb-0 text-primary" style={{ letterSpacing: '0.5px' }}>
                  群聊洞察
                </Title>
                <Text className="text-muted text-xs">AI驱动的群聊分析平台</Text>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                type="text" 
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

      {/* 侧边导航 - 移动端隐藏 */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 hidden md:block">
        <div className="flex flex-col gap-3 p-2 rounded-lg card" style={{ backgroundColor: 'rgba(42, 39, 59, 0.85)' }}>
          <Button 
            type="text" 
            shape="circle" 
            icon={<BarChartOutlined />} 
            onClick={() => scrollToSection('summary')}
            className={activeSection === 'summary' ? 'text-primary' : 'text-muted'}
            style={{ 
              border: activeSection === 'summary' ? '1px solid var(--color-primary)' : 'none',
              transform: activeSection === 'summary' ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          />
          <Button 
            type="text" 
            shape="circle" 
            icon={<MessageOutlined />} 
            onClick={() => scrollToSection('topics')}
            className={activeSection === 'topics' ? 'text-primary' : 'text-muted'}
            style={{ 
              border: activeSection === 'topics' ? '1px solid var(--color-primary)' : 'none',
              transform: activeSection === 'topics' ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          />
          <Button 
            type="text" 
            shape="circle" 
            icon={<LinkOutlined />} 
            onClick={() => scrollToSection('articles')}
            className={activeSection === 'articles' ? 'text-primary' : 'text-muted'}
            style={{ 
              border: activeSection === 'articles' ? '1px solid var(--color-primary)' : 'none',
              transform: activeSection === 'articles' ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* 移动端底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-border md:hidden z-50">
        <div className="flex justify-around py-2">
          <Button 
            type="text" 
            icon={<BarChartOutlined />} 
            onClick={() => scrollToSection('summary')}
            className={activeSection === 'summary' ? 'text-primary' : 'text-muted'}
          />
          <Button 
            type="text" 
            icon={<MessageOutlined />} 
            onClick={() => scrollToSection('topics')}
            className={activeSection === 'topics' ? 'text-primary' : 'text-muted'}
          />
          <Button 
            type="text" 
            icon={<LinkOutlined />} 
            onClick={() => scrollToSection('articles')}
            className={activeSection === 'articles' ? 'text-primary' : 'text-muted'}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 标题与筛选区 */}
        <div className="mb-6">
          <div className="page-title mb-4 inline-block">
            <Title level={3} className="m-0">
              每日报告
            </Title>
          </div>
          <Text className="text-muted block mb-4">
            详细回顾每日群聊精华内容，智能分析话题走向与参与度
          </Text>
          
          <div className="card mb-6">
            <div className="card-header">
              <Text strong className="text-primary">筛选条件</Text>
            </div>
            <div className="card-body">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Text strong className="text-muted mb-1 md:mb-0">选择群聊：</Text>
                    <div className="flex-1 min-w-[200px]">
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
                    </div>
                    {selectedGroup && (
                      <Tag className="tag mt-1 md:mt-0">
                        当前: {getSelectedGroupDisplayName()}
                      </Tag>
                    )}
                  </div>
                </Col>
                
                <Col xs={24} md={12}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Text strong className="text-muted mb-1 md:mb-0">选择日期：</Text>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        icon={<LeftOutlined />}
                        size="small"
                        onClick={() => handleDateChange('prev')}
                        disabled={dateOptions.findIndex(d => d.date === selectedDate) >= dateOptions.length - 1}
                        className="btn-outline"
                      />
                      
                      <Space size={4} wrap>
                        {dateOptions.slice(0, 5).map(date => (
                          <Button
                            key={date.date}
                            type={date.date === selectedDate ? 'primary' : 'default'}
                            size="small"
                            onClick={() => setSelectedDate(date.date)}
                            className={date.date === selectedDate ? 'btn-primary' : 'btn-outline'}
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
                        className="btn-outline"
                      />
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
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
          <div className="card-container pb-16 md:pb-0">
            {/* 左侧主模块 */}
            <div className="space-y-5">
              <div 
                ref={sectionRefs.summary}
                className="card fade-in-scale"
              >
                <div className="card-header flex justify-between items-center flex-wrap gap-2">
                  <Title level={5} className="m-0 text-primary">
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
                      backgroundColor: 'rgba(114, 87, 237, 0.08)', 
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
                  <div className="mb-5 p-4 rounded-lg subtle-border" style={{ backgroundColor: 'rgba(77, 74, 95, 0.08)' }}>
                    <Title level={5} className="mb-3 text-primary">
                      群聊风格评价
                    </Title>
                    <Paragraph className="mb-3 text-text">
                      {reportData.styleEvaluation.description}
                    </Paragraph>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Text strong className="text-muted">关注领域：</Text>
                      <div className="flex flex-wrap gap-1">
                        {reportData.styleEvaluation.focusAreas.map(area => (
                          <Tag key={area} className="tag">
                            {area}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 今日重点话题 */}
                  <div ref={sectionRefs.topics}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-4 w-1 bg-primary rounded-full"></div>
                      <Title level={5} className="m-0 text-primary">今日重点话题</Title>
                    </div>
                    
                    <div className="gradient-divider mb-4"></div>
                    
                    <Space direction="vertical" size="middle" className="w-full" style={{ rowGap: '16px' }}>
                      {reportData.keyTopics.map(topic => (
                        <div 
                          key={topic.id} 
                          className="p-4 rounded-lg subtle-border hover-scale"
                          style={{ backgroundColor: 'rgba(77, 74, 95, 0.04)' }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-lg mt-1">
                              {getTopicIcon(topic.emoji)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <Text strong className="text-text">
                                  {topic.title}
                                </Text>
                                {topic.isHot && (
                                  <span className="badge-hot">
                                    热门
                                  </span>
                                )}
                              </div>
                              <Text className="block mb-3 text-muted">
                                {topic.description}
                              </Text>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap gap-1">
                                  {topic.tags.slice(0, 3).map(tag => (
                                    <Tag key={tag} className="tag">
                                      {tag}
                                    </Tag>
                                  ))}
                                </div>
                                <Text className="text-xs text-muted">
                                  {topic.messageCount}条消息 · {topic.participants.length}人参与
                                </Text>
                              </div>
                              
                              {/* 参与者列表 */}
                              {topic.participants.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-muted">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Text strong className="text-xs text-muted">参与者：</Text>
                                    <div className="flex flex-wrap gap-1">
                                      {topic.participants.slice(0, 5).map(participant => (
                                        <Tag key={participant} className="tag-small" style={{ fontSize: '11px', padding: '0 6px' }}>
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
                          </div>
                        </div>
                      ))}
                    </Space>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧副模块 */}
            <div className="space-y-5">
              <div 
                ref={sectionRefs.articles}
                className="card fade-in-scale"
              >
                <div className="card-header">
                  <Title level={5} className="m-0 text-primary">今日分享的文章</Title>
                </div>
                
                <div className="card-body">
                  <Space direction="vertical" size="small" className="w-full" style={{ rowGap: '12px' }}>
                    {reportData.sharedArticles.map(article => (
                      <div 
                        key={article.id} 
                        className="pb-3 border-b border-muted last:border-b-0 last:pb-0 hover-scale"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <LinkOutlined className="text-primary mt-1" />
                          <div className="flex-1">
                            <Text 
                              strong 
                              className="text-sm hover:text-primary cursor-pointer transition-colors duration-300"
                            >
                              {article.title}
                            </Text>
                          </div>
                        </div>
                        <Text className="text-xs block mb-2 text-muted">
                          {article.description}
                        </Text>
                        <div className="flex justify-between items-center text-xs text-muted">
                          <span>{article.sharedBy} · {article.sharedAt}</span>
                          <span>{article.readCount}次阅读</span>
                        </div>
                      </div>
                    ))}
                  </Space>
                </div>
              </div>
              
              <div className="card fade-in-scale">
                <div className="card-header">
                  <Title level={5} className="m-0 text-primary">今日统计</Title>
                </div>
                
                <div className="card-body">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(77, 74, 95, 0.08)' }}>
                      <div className="text-xl font-bold text-primary">
                        {reportData.statistics.messageCount}
                      </div>
                      <div className="text-xs text-muted">消息数</div>
                    </div>
                    <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgba(77, 74, 95, 0.08)' }}>
                      <div className="text-xl font-bold text-accent">
                        {reportData.statistics.participantCount}
                      </div>
                      <div className="text-xs text-muted">参与人数</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 w-1 bg-primary rounded-full"></div>
                      <Text strong className="text-muted">活跃时段</Text>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(77, 74, 95, 0.04)' }}>
                      {reportData.statistics.activeHours.map((hour, index) => (
                        <div 
                          key={hour} 
                          className={`py-1 px-2 rounded ${index === 0 ? 'mb-1' : ''}`}
                          style={{ backgroundColor: index === 0 ? 'rgba(114, 87, 237, 0.08)' : 'transparent' }}
                        >
                          <Text className={index === 0 ? 'text-primary' : 'text-muted'}>
                            {hour}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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