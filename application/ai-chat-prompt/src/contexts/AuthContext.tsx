import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { request } from '@/utils/api'
import type { User, AuthState, LoginRequest, RegisterRequest, AuthResponse, GuestLoginResponse } from '@/types'

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  guestLogin: () => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'LOGOUT' }

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      }
    case 'SET_TOKEN':
      return { ...state, token: action.payload }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // 初始化时检查本地存储的认证信息
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        dispatch({ type: 'SET_TOKEN', payload: token })
        dispatch({ type: 'SET_USER', payload: user })
      } catch (error) {
        console.error('解析用户信息失败:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await request.post<AuthResponse>('/auth/login', credentials)
      
      const { user, accessToken } = response
      
      localStorage.setItem('token', accessToken)
      localStorage.setItem('user', JSON.stringify(user))
      
      dispatch({ type: 'SET_TOKEN', payload: accessToken })
      dispatch({ type: 'SET_USER', payload: user })
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      throw error
    }
  }

  const guestLogin = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await request.post<GuestLoginResponse>('/auth/guest-login')
      
      const { user, accessToken } = response
      
      localStorage.setItem('token', accessToken)
      localStorage.setItem('user', JSON.stringify(user))
      
      dispatch({ type: 'SET_TOKEN', payload: accessToken })
      dispatch({ type: 'SET_USER', payload: user })
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      throw error
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await request.post<AuthResponse>('/auth/register', userData)
      
      const { user, accessToken } = response
      
      localStorage.setItem('token', accessToken)
      localStorage.setItem('user', JSON.stringify(user))
      
      dispatch({ type: 'SET_TOKEN', payload: accessToken })
      dispatch({ type: 'SET_USER', payload: user })
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      throw error
    }
  }

  const logout = async () => {
    try {
      // 如果有token，调用后端登出接口
      if (state.token) {
        await request.post('/auth/logout')
      }
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      dispatch({ type: 'LOGOUT' })
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      dispatch({ type: 'SET_USER', payload: updatedUser })
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    guestLogin,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 