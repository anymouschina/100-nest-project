import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { aiRequest } from '@/utils/api'
import type { ChatMessage, ChatSession, ChatRequest, ChatResponse } from '@/types'

interface ChatState {
  currentSession: ChatSession | null
  sessions: ChatSession[]
  messages: ChatMessage[]
  isLoading: boolean
  isTyping: boolean
}

interface ChatContextType extends ChatState {
  sendMessage: (message: string, sessionId?: string) => Promise<void>
  createSession: (title?: string) => Promise<ChatSession>
  loadSession: (sessionId: string) => Promise<void>
  loadSessions: () => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  clearCurrentSession: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_CURRENT_SESSION'; payload: ChatSession | null }
  | { type: 'SET_CURRENT_SESSION_WITHOUT_MESSAGES'; payload: ChatSession | null }
  | { type: 'SET_SESSIONS'; payload: ChatSession[] }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'ADD_SESSION'; payload: ChatSession }
  | { type: 'REMOVE_SESSION'; payload: string }
  | { type: 'CLEAR_CURRENT_SESSION' }

const initialState: ChatState = {
  currentSession: null,
  sessions: [],
  messages: [],
  isLoading: false,
  isTyping: false,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  // 只记录关键的action
  if (action.type === 'ADD_MESSAGE' || action.type === 'SET_CURRENT_SESSION' || action.type === 'SET_CURRENT_SESSION_WITHOUT_MESSAGES') {
    console.log('ChatReducer - action:', action.type, 'current messages:', state.messages.length)
  }
  
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload }
    case 'SET_CURRENT_SESSION':
      return { 
        ...state, 
        currentSession: action.payload,
        messages: action.payload?.messages || []
      }
    case 'SET_CURRENT_SESSION_WITHOUT_MESSAGES':
      return { 
        ...state, 
        currentSession: action.payload
        // 不重置messages，保持当前的消息状态
      }
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'ADD_MESSAGE':
      const newState = { 
        ...state, 
        messages: [...state.messages, action.payload]
      }
      console.log('ChatReducer - ADD_MESSAGE new state messages:', newState.messages.length)
      return newState
    case 'ADD_SESSION':
      return { 
        ...state, 
        sessions: [action.payload, ...state.sessions]
      }
    case 'REMOVE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload),
        currentSession: state.currentSession?.id === action.payload ? null : state.currentSession,
        messages: state.currentSession?.id === action.payload ? [] : state.messages
      }
    case 'CLEAR_CURRENT_SESSION':
      return {
        ...state,
        currentSession: null,
        messages: []
      }
    default:
      return state
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  const sendMessage = async (message: string, sessionId?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // 使用传入的sessionId，或者当前会话的sessionId
      const currentSessionId = sessionId || state.currentSession?.id
      
      // 添加用户消息
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId || '',
      }
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage })
      
      // 显示打字指示器
      dispatch({ type: 'SET_TYPING', payload: true })
      
      const chatRequest: ChatRequest = {
        message,
        sessionId: currentSessionId, // 确保传递sessionId以保持会话连续性
      }
      
      const response = await aiRequest.post<ChatResponse>('/ai/chat', chatRequest)
      console.log('收到AI响应，内容长度:', response.response.length)
      
      // 添加AI回复
      const aiMessage: ChatMessage = {
        id: response.messageId || (Date.now() + 1).toString(),
        content: response.response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        sessionId: response.sessionId,
      }
      console.log('添加AI消息，ID:', aiMessage.id)
      dispatch({ type: 'ADD_MESSAGE', payload: aiMessage })
      
      // 如果是新会话，创建一个简单的会话对象（不依赖后端会话管理）
      // 注意：不要重置messages，因为我们已经添加了消息
      if (!currentSessionId) {
        const newSession: ChatSession = {
          id: response.sessionId,
          title: '新对话',
          userId: 'current-user',
          messages: [], // 这里设置为空数组，但不会影响当前的messages状态
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        // 只设置currentSession，不重置messages
        dispatch({ type: 'SET_CURRENT_SESSION_WITHOUT_MESSAGES', payload: newSession })
        console.log('创建新会话:', response.sessionId)
      } else {
        console.log('继续现有会话:', currentSessionId)
      }
      
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ type: 'SET_TYPING', payload: false })
    }
  }

  const createSession = async (title?: string): Promise<ChatSession> => {
    try {
      const newSession = await aiRequest.post<ChatSession>('/ai/sessions', {
        title: title || '新对话',
      })
      
      dispatch({ type: 'ADD_SESSION', payload: newSession })
      dispatch({ type: 'SET_CURRENT_SESSION', payload: newSession })
      
      return newSession
    } catch (error) {
      console.error('创建会话失败:', error)
      throw error
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const session = await aiRequest.get<ChatSession>(`/ai/sessions/${sessionId}`)
      
      dispatch({ type: 'SET_CURRENT_SESSION', payload: session })
    } catch (error) {
      console.error('加载会话失败:', error)
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const loadSessions = async () => {
    try {
      const sessions = await aiRequest.get<ChatSession[]>('/ai/sessions')
      dispatch({ type: 'SET_SESSIONS', payload: sessions })
    } catch (error) {
      console.error('加载会话列表失败:', error)
      throw error
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await aiRequest.delete(`/ai/sessions/${sessionId}`)
      dispatch({ type: 'REMOVE_SESSION', payload: sessionId })
    } catch (error) {
      console.error('删除会话失败:', error)
      throw error
    }
  }

  const clearCurrentSession = () => {
    dispatch({ type: 'CLEAR_CURRENT_SESSION' })
  }

  const value: ChatContextType = {
    ...state,
    sendMessage,
    createSession,
    loadSession,
    loadSessions,
    deleteSession,
    clearCurrentSession,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
} 