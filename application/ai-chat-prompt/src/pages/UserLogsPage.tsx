import { useState } from 'react'
import { 
  Search, 
  Download, 
  RefreshCw, 
  User,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Zap
} from 'lucide-react'
import { logAnalysisAPI } from '@/services/logAnalysisService'
import type { UserLogEntry } from '@/types'
import toast from 'react-hot-toast'

// 日志级别图标映射
const levelIcons = {
  DEBUG: Info,
  INFO: Info,
  WARN: AlertTriangle,
  ERROR: XCircle,
  FATAL: Zap
}

// 日志级别颜色映射
const levelColors = {
  DEBUG: 'text-gray-600 bg-gray-50',
  INFO: 'text-blue-600 bg-blue-50',
  WARN: 'text-yellow-600 bg-yellow-50',
  ERROR: 'text-red-600 bg-red-50',
  FATAL: 'text-purple-600 bg-purple-50'
}

// 日志来源图标映射
const sourceColors = {
  backend: 'text-green-600 bg-green-50',
  frontend: 'text-blue-600 bg-blue-50',
  mobile: 'text-purple-600 bg-purple-50'
}

export default function UserLogsPage() {
  const [userId, setUserId] = useState('')
  const [logs, setLogs] = useState<UserLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  
  // 筛选参数
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    level: '',
    source: '',
    searchQuery: ''
  })

  // 获取用户日志
  const fetchUserLogs = async (page = 1) => {
    if (!userId.trim()) {
      toast.error('请输入用户ID')
      return
    }

    setIsLoading(true)
    try {
      const params = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        level: filters.level || undefined,
        source: filters.source || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize
      }

      const response = await logAnalysisAPI.getUserLogs(parseInt(userId), params)
      setLogs(response.logs)
      setTotal(response.total)
      setCurrentPage(page)
    } catch (error: any) {
      console.error('获取用户日志失败:', error)
      toast.error(error.message || '获取用户日志失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 导出日志
  const exportLogs = async () => {
    if (logs.length === 0) {
      toast.error('没有日志数据可导出')
      return
    }

    try {
      const csvContent = [
        'ID,用户ID,时间,级别,来源,服务,消息,元数据',
        ...logs.map(log => [
          log.id,
          log.userId,
          log.timestamp,
          log.level,
          log.source,
          log.service || '',
          `"${log.message.replace(/"/g, '""')}"`,
          log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : ''
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `user_${userId}_logs_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('日志已导出')
    } catch (error) {
      toast.error('导出失败')
    }
  }

  // 筛选日志
  const filteredLogs = logs.filter(log => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      return log.message.toLowerCase().includes(query) ||
             log.service?.toLowerCase().includes(query) ||
             (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(query))
    }
    return true
  })

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">用户历史日志</h1>
        <p className="text-gray-600">
          查看和分析特定用户的历史日志记录
        </p>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
          {/* 用户ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户ID</label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="输入用户ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* 开始日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* 结束日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* 日志级别 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日志级别</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">全部</option>
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="FATAL">FATAL</option>
            </select>
          </div>

          {/* 日志来源 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日志来源</label>
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">全部</option>
              <option value="backend">Backend</option>
              <option value="frontend">Frontend</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-end space-x-2">
            <button
              onClick={() => fetchUserLogs(1)}
              disabled={isLoading || !userId.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索日志内容、服务名称或元数据..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 结果统计和操作 */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} 条，
            共 {total} 条记录，筛选后 {filteredLogs.length} 条
          </div>
          <button
            onClick={exportLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>导出CSV</span>
          </button>
        </div>
      )}

      {/* 日志列表 */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-500">加载中...</span>
              </div>
            ) : userId.trim() ? (
              <div>
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">没有找到符合条件的日志记录</p>
              </div>
            ) : (
              <div>
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">请输入用户ID并点击搜索</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => {
              const LevelIcon = levelIcons[log.level as keyof typeof levelIcons] || Info
              return (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${levelColors[log.level as keyof typeof levelColors] || 'text-gray-600 bg-gray-50'}`}>
                        <LevelIcon className="w-3 h-3 mr-1" />
                        {log.level}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${sourceColors[log.source as keyof typeof sourceColors] || 'text-gray-600 bg-gray-50'}`}>
                        {log.source}
                      </span>
                      {log.service && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {log.service}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-900 mb-2 font-mono">
                    {log.message}
                  </div>
                  
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="text-xs text-gray-600">
                      <details className="mt-1">
                        <summary className="cursor-pointer text-primary-600 hover:text-primary-700">
                          查看元数据
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 分页 */}
      {total > pageSize && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            第 {currentPage} 页，共 {Math.ceil(total / pageSize)} 页
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchUserLogs(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              上一页
            </button>
            <button
              onClick={() => fetchUserLogs(currentPage + 1)}
              disabled={currentPage >= Math.ceil(total / pageSize) || isLoading}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}