/**
 * AI模块接口定义
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatSession {
  sessionId: string;
  userId: number;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  title?: string;
  metadata?: Record<string, any>;
}

export interface PromptOptimizationRequest {
  originalPrompt: string;
  optimizationType: OptimizationType;
  domain?: string;
  context?: string;
  requirements?: string[];
}

export interface PromptOptimizationResponse {
  optimizedPrompt: string;
  optimizationExplanation: string;
  expectedEffects: string;
  qualityScore: QualityScore;
  suggestions: string[];
}

export interface QualityScore {
  clarity: number; // 1-10
  specificity: number; // 1-10
  completeness: number; // 1-10
  consistency: number; // 1-10
  effectiveness: number; // 1-10
  overall: number; // 1-10
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export interface ConversationContext {
  sessionId: string;
  userId: number;
  recentMessages: ChatMessage[];
  userPreferences?: UserPreferences;
  domainContext?: string;
}

export interface UserPreferences {
  language?: string;
  responseStyle?: 'formal' | 'casual' | 'technical' | 'creative';
  maxResponseLength?: number;
  preferredOptimizationTypes?: OptimizationType[];
}

export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  variables: string[];
  examples: PromptExample[];
}

export interface PromptExample {
  input: Record<string, string>;
  expectedOutput: string;
  explanation?: string;
}

export type OptimizationType =
  | 'basic'
  | 'role-based'
  | 'few-shot'
  | 'chain-of-thought'
  | 'domain-specific'
  | 'multimodal';

export interface AIServiceConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

export interface PromptAnalysis {
  wordCount: number;
  sentenceCount: number;
  complexity: 'low' | 'medium' | 'high';
  clarity: number;
  structure: 'poor' | 'fair' | 'good' | 'excellent';
  missingElements: string[];
  strengths: string[];
    weaknesses: string[];
}