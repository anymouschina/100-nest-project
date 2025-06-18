import React, { useEffect, useState } from 'react';
import { List, Button, Typography, Empty, Input, Spin, message } from 'antd';
import { PlusOutlined, MessageOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import { ChatSession, CreateSessionDto } from '../types/chat';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Title } = Typography;

interface SessionListProps {
  onSelectSession: (session: ChatSession) => void;
  selectedSessionId?: string;
  refreshTrigger?: number;
}

const SessionList: React.FC<SessionListProps> = ({ 
  onSelectSession, 
  selectedSessionId,
  refreshTrigger = 0
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewSessionInput, setShowNewSessionInput] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);
  
  const navigate = useNavigate();

  // 加载会话列表
  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionsData = await apiService.getSessions();
      setSessions(sessionsData);
      
      // 如果有会话且没有选中的会话，自动选择第一个
      if (sessionsData.length > 0 && !selectedSessionId) {
        onSelectSession(sessionsData[0]);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      message.error('加载会话列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建新会话
  const createNewSession = async () => {
    try {
      setCreatingSession(true);
      
      const sessionData: CreateSessionDto = {
        title: newSessionTitle || '新的会话',
      };
      
      const newSession = await apiService.createSession(sessionData);
      setSessions(prevSessions => [newSession, ...prevSessions]);
      onSelectSession(newSession);
      setShowNewSessionInput(false);
      setNewSessionTitle('');
    } catch (error) {
      console.error('Failed to create session:', error);
      message.error('创建会话失败');
    } finally {
      setCreatingSession(false);
    }
  };

  // 开始新会话
  const handleNewSession = () => {
    setShowNewSessionInput(true);
  };

  // 选择会话
  const handleSelectSession = (session: ChatSession) => {
    onSelectSession(session);
  };

  useEffect(() => {
    if (apiService.isAuthenticated()) {
      loadSessions();
    } else {
      navigate('/login');
    }
  }, [navigate, refreshTrigger]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={4} style={{ margin: 0 }}>会话列表</Title>
      </div>
      <div style={{display:'flex'}}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleNewSession}
          style={{ margin: '16px' }}
          block
        >
          新建会话
        </Button>
      </div>
     
      
      {showNewSessionInput && (
        <div style={{ padding: '0 16px 16px' }}>
          <Search
            placeholder="会话标题（可选）"
            enterButton="创建"
            value={newSessionTitle}
            onChange={(e) => setNewSessionTitle(e.target.value)}
            onSearch={createNewSession}
            loading={creatingSession}
          />
        </div>
      )}
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin tip="加载中..." />
          </div>
        ) : sessions.length === 0 ? (
          <Empty description="暂无会话" style={{ margin: '50px 0' }} />
        ) : (
          <List
            dataSource={sessions}
            renderItem={(session) => (
              <List.Item 
                onClick={() => handleSelectSession(session)}
                style={{ 
                  cursor: 'pointer', 
                  background: selectedSessionId === session.id ? '#f0f0f0' : 'transparent',
                  padding: '12px 16px'
                }}
              >
                <List.Item.Meta
                  avatar={<MessageOutlined style={{ fontSize: '20px' }} />}
                  title={session.title}
                  description={
                    <>
                      <div>{session.agent?.name || '默认助手'}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {new Date(session.updatedAt).toLocaleString()}
                      </div>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default SessionList; 