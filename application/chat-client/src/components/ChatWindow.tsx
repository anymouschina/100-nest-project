import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Avatar, Spin, message, Typography, Empty } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import { ChatSession, ChatMessage, SendMessageDto } from '../types/chat';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ChatWindowProps {
  session?: ChatSession;
  onSendMessage?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  session, 
  onSendMessage 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载会话消息
  const loadMessages = async () => {
    if (!session) return;

    try {
      setLoading(true);
      const sessionData = await apiService.getSessionMessages(session.id);
      if (sessionData.messages) {
        setMessages(sessionData.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      message.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!session || !inputValue.trim()) return;

    try {
      setSending(true);
      const messageDto: SendMessageDto = { message: inputValue.trim() };
      
      // 先添加用户消息到本地显示
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        sessionId: session.id,
        role: 'user',
        content: inputValue.trim(),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      
      // 发送消息到服务器
      const response = await apiService.sendMessage(session.id, messageDto);
      
      // 添加助手回复
      setMessages(prev => [...prev, response]);
      
      // 调用父组件的回调函数
      if (onSendMessage) {
        onSendMessage();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      message.error('发送消息失败');
    } finally {
      setSending(false);
    }
  };

  // 处理按键事件，支持Ctrl+Enter发送
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当会话ID改变时加载消息
  useEffect(() => {
    if (session) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [session?.id]);

  // 当消息列表更新时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 格式化消息时间
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!session) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#f5f5f5'
      }}>
        <Empty description="请选择或创建一个会话" />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 会话头部 */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Title level={4} style={{ margin: 0 }}>{session.title}</Title>
        {session.agent && (
          <Text type="secondary" style={{ marginLeft: '10px' }}>
            助手: {session.agent.name}
          </Text>
        )}
      </div>

      {/* 消息列表 */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '16px', 
        background: '#f5f5f5' 
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Spin tip="加载消息中..." />
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={messages}
            renderItem={(msg) => (
              <List.Item style={{ padding: '8px 0' }}>
                <div style={{ 
                  maxWidth: '80%',
                  marginLeft: msg.role === 'assistant' ? 0 : 'auto',
                  marginRight: msg.role === 'user' ? 0 : 'auto',
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}>
                  <Avatar 
                    icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                    style={{ 
                      background: msg.role === 'user' ? '#1890ff' : '#52c41a',
                      marginRight: msg.role === 'user' ? 0 : '8px',
                      marginLeft: msg.role === 'user' ? '8px' : 0,
                    }}
                  />
                  <div style={{ 
                    background: msg.role === 'user' ? '#1890ff' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#000',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    position: 'relative',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: msg.role === 'user' ? '#e6f7ff' : '#aaa',
                      marginTop: '4px',
                      textAlign: 'right'
                    }}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid #f0f0f0',
        background: '#fff'
      }}>
        <div style={{ display: 'flex' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入消息，Ctrl + Enter 发送"
            autoSize={{ minRows: 2, maxRows: 6 }}
            onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
            disabled={sending}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            style={{ marginLeft: '8px', height: 'auto' }}
            loading={sending}
            disabled={!inputValue.trim()}
          />
        </div>
        <div style={{ marginTop: '4px', fontSize: '12px', color: '#aaa', textAlign: 'right' }}>
          按 Ctrl + Enter 发送
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 