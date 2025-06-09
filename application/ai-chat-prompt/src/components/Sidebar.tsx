import { NavLink } from 'react-router-dom'
import { 
  MessageCircle, 
  Wand2, 
  BarChart3, 
  History, 
  Settings, 
  Plus,
  Brain,
  FileSearch,
  Activity
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useChat } from '@/contexts/ChatContext'

const navigation = [
  { name: '智能对话', href: '/chat', icon: MessageCircle },
  { name: '提示词优化', href: '/optimize', icon: Wand2 },
  { name: '质量分析', href: '/analyze', icon: BarChart3 },
  { name: '会话历史', href: '/sessions', icon: History },
  { name: '日志分析', href: '/log-analysis', icon: FileSearch },
  { name: '用户日志', href: '/user-logs', icon: Activity },
  { name: '设置', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const { createSession } = useChat()

  const handleNewChat = async () => {
    try {
      await createSession()
    } catch (error) {
      console.error('创建新对话失败:', error)
    }
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AI助手</h1>
            <p className="text-xs text-gray-500">提示词优化专家</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>新建对话</span>
        </button>
      </div>

      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>基于谷歌提示工程白皮书</p>
          <p className="mt-1">Powered by Moonshot AI</p>
        </div>
      </div>
    </div>
  )
} 