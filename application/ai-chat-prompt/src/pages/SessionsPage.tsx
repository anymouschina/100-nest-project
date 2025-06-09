import { useState, useEffect } from 'react'
import { 
  MessageCircle, 
  Calendar, 
  Clock, 
  Trash2, 
  Edit3, 
  Search,
  Filter,
  MoreVertical,
  Eye,
  Download
} from 'lucide-react'
import { chatAPI } from '@/services/aiService'
import type { ChatSession } from '@/types'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// 会话卡片组件
function SessionCard({ 
  session, 
  onDelete, 
  onRename, 
  onView 
}: { 
  session: ChatSession
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onView: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [newTitle, setNewTitle] = useState(session.title)
  const [showMenu, setShowMenu] = useState(false)

  const handleRename = async () => {
    if (newTitle.trim() && newTitle !== session.title) {
      await onRename(session.id, newTitle.trim())
    }
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '今天'
    if (diffDays === 2) return '昨天'
    if (diffDays <= 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const getPreviewText = () => {
    if (session.messages.length === 0) return '暂无消息'
    const lastMessage = session.messages[session.messages.length - 1]
    return lastMessage.content.slice(0, 100) + (lastMessage.content.length > 100 ? '...' : '')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                  if (e.key === 'Escape') setIsEditing(false)
                }}
                autoFocus
              />
              <button
                onClick={handleRename}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
              >
                保存
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {session.title}
            </h3>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    onView(session.id)
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  查看详情
                </button>
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  重命名
                </button>
                <button
                  onClick={() => {
                    onDelete(session.id)
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {getPreviewText()}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{session.messages.length} 条消息</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(session.updatedAt)}</span>
          </div>
        </div>
        
        <button
          onClick={() => onView(session.id)}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          继续对话
        </button>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'messages'>('date')
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // 加载会话列表
  useEffect(() => {
    loadSessions()
  }, [])

  // 搜索和排序
  useEffect(() => {
    let filtered = sessions.filter(session =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.messages.some(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )

    // 排序
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      } else {
        return b.messages.length - a.messages.length
      }
    })

    setFilteredSessions(filtered)
  }, [sessions, searchQuery, sortBy])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const data = await chatAPI.getUserSessions()
      setSessions(data || [])
    } catch (error: any) {
      console.error('加载会话失败:', error)
      toast.error(error.message || '加载会话失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('确定要删除这个会话吗？此操作不可恢复。')) return

    try {
      await chatAPI.deleteSession(sessionId)
      setSessions(sessions.filter(s => s.id !== sessionId))
      toast.success('会话已删除')
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    }
  }

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    try {
      await chatAPI.updateSessionTitle(sessionId, newTitle)
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, title: newTitle } : s
      ))
      toast.success('会话已重命名')
    } catch (error: any) {
      toast.error(error.message || '重命名失败')
    }
  }

  const handleViewSession = (sessionId: string) => {
    navigate(`/chat?session=${sessionId}`)
  }

  const exportSessions = () => {
    const data = {
      exportTime: new Date().toISOString(),
      sessions: sessions.map(session => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messages.length,
        messages: session.messages
      }))
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-sessions-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('会话数据已导出')
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">会话历史</h1>
            <p className="text-gray-600">
              管理您的所有对话记录，随时回顾和继续之前的对话
            </p>
          </div>
          
          <button
            onClick={exportSessions}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>导出数据</span>
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索会话标题或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'messages')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="date">按时间排序</option>
              <option value="messages">按消息数排序</option>
            </select>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-600">总会话数</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{sessions.length}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">总消息数</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {sessions.reduce((total, session) => total + session.messages.length, 0)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">活跃天数</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {sessions.length > 0 ? 
                Math.ceil((new Date().getTime() - new Date(sessions[sessions.length - 1]?.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24)) : 0
              }
            </p>
          </div>
        </div>
      </div>

      {/* 会话列表 */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? '未找到匹配的会话' : '暂无会话记录'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? '尝试使用其他关键词搜索' : '开始您的第一次对话吧'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/chat')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              开始对话
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={handleDeleteSession}
              onRename={handleRenameSession}
              onView={handleViewSession}
            />
          ))}
        </div>
      )}
    </div>
  )
} 