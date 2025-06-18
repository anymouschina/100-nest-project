import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, message } from 'antd';
import { LogoutOutlined, UserOutlined, MenuOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { ChatSession, User } from '../types/chat';
import SessionList from '../components/SessionList';
import ChatWindow from '../components/ChatWindow';

const { Header, Sider, Content } = Layout;

const ChatPage: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  
  // 检查用户是否已登录，并获取用户信息
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 如果未登录，重定向到登录页
        if (!apiService.isAuthenticated()) {
          navigate('/login');
          return;
        }
        
        // 获取用户信息
        const userInfo = await apiService.getUserInfo();
        setUser(userInfo);
      } catch (error) {
        console.error('Failed to verify authentication:', error);
        message.error('会话已过期，请重新登录');
        apiService.clearToken();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // 选择会话
  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session);
  };
  
  // 处理消息发送后的刷新
  const handleMessageSent = () => {
    // 触发会话列表刷新
    setRefreshTrigger(prev => prev + 1);
  };
  
  // 登出
  const handleLogout = async () => {
    try {
      await apiService.logout();
      message.success('已成功登出');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      message.error('登出失败');
    }
  };

  // 用户菜单
  const userMenu = {
    items: [
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />,
        danger: true,
      },
    ],
    onClick: () => handleLogout()
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ 
        padding: '0 16px', 
        background: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ marginRight: '16px' }}
          />
          <h2 style={{ margin: 0 }}>聊天客户端</h2>
        </div>
        
        {user && (
          <Dropdown menu={userMenu} placement="bottomRight">
            <Button icon={<UserOutlined />}>
              {user.name || '用户'}
            </Button>
          </Dropdown>
        )}
      </Header>
      
      <Layout>
        <Sider 
          width={280} 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          theme="light"
          style={{
            overflow: 'auto',
            boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)'
          }}
        >
          {!collapsed && (
            <SessionList 
              onSelectSession={handleSelectSession}
              selectedSessionId={selectedSession?.id}
              refreshTrigger={refreshTrigger}
            />
          )}
        </Sider>
        
        <Content>
          <ChatWindow 
            session={selectedSession} 
            onSendMessage={handleMessageSent}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChatPage; 