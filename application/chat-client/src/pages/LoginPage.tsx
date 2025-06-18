import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Form, Typography, message, Spin, Tabs, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, HomeOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { WebLoginDto, RegisterUserDto } from '../types/chat';
import axios from 'axios';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [registerForm] = Form.useForm();

  // 检查是否已登录
  useEffect(() => {
    if (apiService.isAuthenticated()) {
      message.info('检测到您已登录，正在跳转...');
      navigate('/chat');
    }
  }, [navigate]);

  // 处理登录表单提交
  const handleLogin = async (values: WebLoginDto) => {
    setLoginError(null);
    
    try {
      setLoading(true);
      console.log('登录请求数据:', values);
      
      const result = await apiService.webLogin(values);
      console.log('登录成功，响应数据:', result);
      
      if (!result?.token) {
        throw new Error('登录响应中没有找到有效的token');
      }
      
      message.success('登录成功，正在跳转...');
      setTimeout(() => {
        navigate('/chat');
      }, 500); // 延迟跳转以确保状态更新
    } catch (error: any) {
      console.error('登录失败:', error);
      let errorMessage = '登录失败，邮箱或密码错误';
      
      if (error.response?.data?.message) {
        errorMessage = `登录失败: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 处理注册表单提交
  const handleRegister = async (values: RegisterUserDto) => {
    setLoginError(null);
    
    try {
      setLoading(true);
      console.log('注册请求数据:', values);
      
      const result = await apiService.register(values);
      console.log('注册成功，响应数据:', result);
      
      if (!result?.token) {
        throw new Error('注册响应中没有找到有效的token');
      }
      
      message.success('注册成功并已自动登录，正在跳转...');
      setTimeout(() => {
        navigate('/chat');
      }, 500); // 延迟跳转以确保状态更新
    } catch (error: any) {
      console.error('注册失败:', error);
      let errorMessage = '注册失败，请检查输入信息';
      
      if (error.response?.data?.message) {
        errorMessage = `注册失败: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateConfirmPassword = (_: any, value: string) => {
    const password = registerForm.getFieldValue('password');
    if (value && value !== password) {
      return Promise.reject(new Error('两次输入的密码不一致'));
    }
    return Promise.resolve();
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#f5f5f5'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>聊天客户端</Title>
        </div>
        
        {loginError && (
          <Alert
            message="错误"
            description={loginError}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setLoginError(null)}
          />
        )}
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          centered
        >
          <TabPane tab="登录" key="login">
            <Form 
              form={form}
              layout="vertical" 
              onFinish={handleLogin}
            >
              <Form.Item 
                name="email" 
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="邮箱" 
                  size="large"
                  disabled={loading}
                />
              </Form.Item>
              
              <Form.Item 
                name="password" 
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="密码" 
                  size="large"
                  disabled={loading}
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                  size="large"
                >
                  登录
                </Button>
              </Form.Item>
              
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  登录状态: {apiService.isAuthenticated() ? '已登录' : '未登录'}
                </Text>
              </div>
            </Form>
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text type="secondary">
                还没有账号？ 
                <Button type="link" onClick={() => setActiveTab('register')} style={{ padding: 0 }}>
                  立即注册
                </Button>
              </Text>
            </div>
          </TabPane>
          
          <TabPane tab="注册" key="register">
            <Form 
              form={registerForm}
              layout="vertical" 
              onFinish={handleRegister}
            >
              <Form.Item 
                name="email" 
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="邮箱" 
                  disabled={loading}
                />
              </Form.Item>
              
              <Form.Item 
                name="name" 
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名" 
                  disabled={loading}
                />
              </Form.Item>
              
              <Form.Item 
                name="password" 
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码长度至少为6个字符' },
                  { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{6,}$/, message: '密码必须包含至少一个大写字母、一个小写字母和一个数字' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="密码" 
                  disabled={loading}
                />
              </Form.Item>
              
              <Form.Item 
                name="confirmPassword" 
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  { validator: validateConfirmPassword }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="确认密码" 
                  disabled={loading}
                />
              </Form.Item>
              
              <Form.Item 
                name="address" 
                rules={[{ required: true, message: '请输入地址' }]}
              >
                <Input 
                  prefix={<HomeOutlined />} 
                  placeholder="地址" 
                  disabled={loading}
                />
              </Form.Item>
              
              <Form.Item 
                name="phone"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', validateTrigger: 'onChange' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="手机号码（可选）" 
                  disabled={loading}
                />
              </Form.Item>
              
              <Form.Item 
                name="refCode"
              >
                <Input 
                  placeholder="引荐码（可选）" 
                  disabled={loading}
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text type="secondary">
                已有账号？ 
                <Button type="link" onClick={() => setActiveTab('login')} style={{ padding: 0 }}>
                  登录
                </Button>
              </Text>
            </div>
          </TabPane>
        </Tabs>
      </Card>
      
      {loading && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.4)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          zIndex: 1000
        }}>
          <Spin tip={activeTab === 'login' ? "登录中..." : "注册中..."} size="large" />
        </div>
      )}
    </div>
  );
};

export default LoginPage; 