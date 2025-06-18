import axios, { AxiosInstance } from 'axios';
import { 
  AuthResponse, 
  ChatSession, 
  ChatMessage, 
  CreateSessionDto, 
  SendMessageDto,
  WebLoginDto,
  RegisterUserDto 
} from '../types/chat';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 从本地存储恢复token
    this.token = localStorage.getItem('token');
    
    // 请求拦截器，添加token
    this.api.interceptors.request.use(config => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  // 登录相关API
  async webLogin(loginData: WebLoginDto): Promise<AuthResponse> {
    const response = await this.api.post('/api/user/webLogin', loginData);
    // 处理嵌套的响应结构
    const responseData = response.data.data || response.data;
    this.setToken(responseData.token);
    return responseData;
  }

  async register(registerData: RegisterUserDto): Promise<AuthResponse> {
    const response = await this.api.post('/api/user/register', registerData);
    // 处理嵌套的响应结构
    const responseData = response.data.data || response.data;
    this.setToken(responseData.token);
    return responseData;
  }

  // 保留微信登录以兼容
  async wxLogin(code: string, userInfo?: any): Promise<AuthResponse> {
    const response = await this.api.post('/user/wxLogin', { code, userInfo });
    const responseData = response.data.data || response.data;
    this.setToken(responseData.token);
    return responseData;
  }

  async logout(): Promise<void> {
    await this.api.get('/api/user/logout'); // 注意这里是GET请求
    this.clearToken();
  }

  async getUserInfo(): Promise<any> {
    const response = await this.api.get('/user/info');
    const responseData = response.data.data || response.data;
    return responseData;
  }

  // 聊天相关API - 更新路径和请求格式
  async createSession(data: CreateSessionDto): Promise<ChatSession> {
    const requestData = {
      agentId: data.agentId,
      title: data.title
    };
    const response = await this.api.post('/chat/sessions', requestData);
    const responseData = response.data.data || response.data;
    return responseData;
  }

  async getSessions(): Promise<ChatSession[]> {
    const response = await this.api.get('/chat/sessions');
    const responseData = response.data.data || response.data;
    // 服务器返回的是 { sessions: [], pagination: {} } 格式
    return responseData.sessions || responseData;
  }

  async getSessionMessages(sessionId: string): Promise<ChatSession> {
    // 获取会话详情
    const sessionResponse = await this.api.get(`/chat/sessions/${sessionId}`);
    const sessionData = sessionResponse.data.data || sessionResponse.data;
    
    // 获取会话消息历史
    const historyResponse = await this.api.get(`/chat/sessions/${sessionId}/history`);
    const historyData = historyResponse.data.data || historyResponse.data;
    
    // 合并会话信息和消息历史
    return {
      ...sessionData,
      messages: historyData.messages || []
    };
  }

  async sendMessage(sessionId: string, data: SendMessageDto): Promise<ChatMessage> {
    const requestData = {
      content: data.message,
      role: 'user'
    };
    const response = await this.api.post(`/chat/sessions/${sessionId}/messages`, requestData);
    const responseData = response.data.data || response.data;
    
    // 适配响应格式，返回AI消息
    if (responseData.aiMessage) {
      return {
        id: `ai-${Date.now()}`,
        sessionId,
        role: 'assistant',
        content: responseData.aiMessage.content,
        timestamp: new Date(),
        metadata: responseData.metadata
      };
    }
    
    return responseData;
  }

  async analyzeMessage(message: string): Promise<any> {
    // 这个接口可能不存在了，暂时保留
    const response = await this.api.post('/chat/analyze', { message });
    const responseData = response.data.data || response.data;
    return responseData;
  }

  // 获取可用的代理列表
  async getAgents(): Promise<any[]> {
    const response = await this.api.get('/chat/agents');
    const responseData = response.data.data || response.data;
    return responseData;
  }

  // Token管理
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiService = new ApiService(); 