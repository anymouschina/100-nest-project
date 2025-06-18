export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatAgent {
  id: string;
  name: string;
  description: string;
  type: string;
  systemPrompt?: string;
  capabilities?: string[];
  active: boolean;
}

export interface ChatSession {
  id: string;
  userId: number;
  agentId: string;
  title: string;
  status: 'active' | 'closed';
  startTime?: Date;
  updatedAt: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
  agent?: ChatAgent;
  messages?: ChatMessage[];
}

export interface User {
  userId: number;
  name: string;
  avatarUrl?: string;
  email?: string;
  wechatInfo?: {
    openId: string;
    gender?: number;
    country?: string;
    province?: string;
    city?: string;
  };
  joinedAt?: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface WebLoginDto {
  email: string;
  password: string;
}

export interface RegisterUserDto {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  address: string;
  phone?: string;
  refCode?: string;
}

export interface CreateSessionDto {
  title?: string;
  agentId?: string;
}

export interface SendMessageDto {
  message: string;
} 