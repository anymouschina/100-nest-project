import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, Eye, EyeOff, UserCheck, MessageCircle, Wand2, BarChart3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGuestLoading, setIsGuestLoading] = useState(false)
  const [showGuestSuccess, setShowGuestSuccess] = useState(false)
  const { login, guestLogin, user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('请填写完整的登录信息')
      return
    }

    setIsLoading(true)
    try {
      await login({ email, password })
      toast.success('登录成功')
      navigate('/')
    } catch (error: any) {
      console.error('登录错误:', error)
      
      // 根据错误状态码显示不同的错误信息
      if (error?.response?.status === 401) {
        toast.error('邮箱或密码错误，请重新输入')
      } else if (error?.response?.status === 429) {
        toast.error('登录尝试过于频繁，请稍后再试')
      } else if (error?.response?.status === 500) {
        toast.error('服务器错误，请稍后重试')
      } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
        toast.error('网络连接失败，请检查网络设置')
      } else {
        const errorMessage = error?.response?.data?.message || '登录失败，请稍后重试'
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setIsGuestLoading(true)
    try {
      await guestLogin()
      toast.success('游客登录成功，欢迎体验AI助手功能！')
      // 延迟1.5秒后跳转到首页，让用户看到成功提示
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (error: any) {
      console.error('游客登录错误:', error)
      
      // 根据错误类型显示不同的错误信息
      if (error?.response?.status === 429) {
        toast.error('请求过于频繁，请稍后再试')
      } else if (error?.response?.status === 500) {
        toast.error('服务器错误，请稍后重试')
      } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
        toast.error('网络连接失败，请检查网络设置')
      } else {
        const errorMessage = error?.response?.data?.message || '游客登录失败，请稍后重试'
        toast.error(errorMessage)
      }
    } finally {
      setIsGuestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            登录 AI助手
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            基于谷歌提示工程白皮书的专业AI助手
          </p>
        </div>

        {/* 游客登录按钮 */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="text-center mb-4">
            <UserCheck className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">快速体验</h3>
            <p className="text-sm text-gray-600">无需注册，立即体验AI助手功能</p>
          </div>
          
          {!user?.isGuest ? (
            <button
              onClick={handleGuestLogin}
              disabled={isGuestLoading}
              className="w-full flex justify-center py-3 px-4 border border-primary-300 rounded-md shadow-sm bg-primary-50 text-primary-700 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isGuestLoading ? '登录中...' : '游客登录'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <UserCheck className="w-4 h-4 mr-1" />
                  游客登录成功
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  您现在可以体验所有AI功能
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Link
                  to="/chat"
                  className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  开始对话
                </Link>
                <Link
                  to="/optimize"
                  className="flex items-center justify-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  提示词优化
                </Link>
                <Link
                  to="/analyze"
                  className="flex items-center justify-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  质量分析
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">或使用账户登录</span>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="请输入邮箱地址"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                记住我
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                忘记密码？
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              还没有账户？{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                立即注册
              </Link>
            </span>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">演示账户</span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>邮箱: demo@example.com</p>
            <p>密码: demo123</p>
          </div>
        </div>
      </div>
    </div>
  )
} 