import { User, LogOut, UserCheck, Crown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('登出失败:', error)
      // 即使登出失败也跳转到登录页
      navigate('/login')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">
            欢迎使用AI智能助手
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            基于谷歌提示工程白皮书的专业优化工具
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              user?.isGuest 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-purple-100 text-purple-600'
            }`}>
              {user?.isGuest ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <Crown className="w-4 h-4" />
              )}
            </div>
            <div className="text-sm">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-gray-900">{user?.name}</p>
                {user?.isGuest && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    游客
                  </span>
                )}
              </div>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          {user?.isGuest && (
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
            >
              升级账户
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={user?.isGuest ? '退出游客模式' : '退出登录'}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
} 