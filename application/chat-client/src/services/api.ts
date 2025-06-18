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
    const response = await this.api.post('/user/webLogin', loginData);
    // 处理嵌套的响应结构
    const responseData = response.data.data || response.data;
    this.setToken(responseData.token);
    return responseData;
  }

  async register(registerData: RegisterUserDto): Promise<AuthResponse> {
    const response = await this.api.post('/user/register', registerData);
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
    await this.api.post('/user/logout');
    this.clearToken();
  }

  async getUserInfo(): Promise<any> {
    const response = await this.api.get('/user/info');
    const responseData = response.data.data || response.data;
    return responseData;
  }

  // 聊天相关API
  async createSession(data: CreateSessionDto): Promise<ChatSession> {
    const response = await this.api.post('/chat/session', data);
    const responseData = response.data.data || response.data;
    return responseData;
  }

  async getSessions(): Promise<ChatSession[]> {
    const response = await this.api.get('/chat/sessions');
    const responseData = response.data.data || response.data;
    return responseData;
  }

  async getSessionMessages(sessionId: string): Promise<ChatSession> {
    const response = await this.api.get(`/chat/session/${sessionId}`);
    const responseData = response.data.data || response.data;
    return responseData;
  }

  async sendMessage(sessionId: string, data: SendMessageDto): Promise<ChatMessage> {
    const response = await this.api.post(`/chat/session/${sessionId}/message`, data);
    const responseData = response.data.data || response.data;
    return responseData;
  }

  async analyzeMessage(message: string): Promise<any> {
    const response = await this.api.post('/chat/analyze', { message });
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