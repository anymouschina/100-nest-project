import { useState, useEffect } from 'react'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

// 设置项组件
function SettingSection({ 
  title, 
  description, 
  icon: Icon, 
  children 
}: { 
  title: string
  description: string
  icon: any
  children: React.ReactNode 
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="w-5 h-5 text-primary-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    language: 'zh',
    theme: 'light',
    responseStyle: 'professional',
    maxResponseLength: 2000,
    notifications: {
      email: true,
      browser: false,
      updates: true
    },
    privacy: {
      saveHistory: true,
      analytics: false,
      shareData: false
    }
  })
  const [isSaving, setIsSaving] = useState(false)

  // 加载用户设置
  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      // 这里应该从API加载用户设置
      // const userSettings = await settingsAPI.getUserSettings()
      // setSettings(userSettings)
      
      // 暂时从localStorage加载
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) })
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      // 这里应该保存到API
      // await settingsAPI.updateUserSettings(settings)
      
      // 暂时保存到localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings))
      toast.success('设置已保存')
    } catch (error: any) {
      toast.error(error.message || '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const exportData = () => {
    const data = {
      user: user,
      settings: settings,
      exportTime: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('数据已导出')
  }

  const clearData = () => {
    if (!confirm('确定要清除所有本地数据吗？此操作不可恢复。')) return

    localStorage.removeItem('userSettings')
    localStorage.removeItem('chatHistory')
    toast.success('本地数据已清除')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">设置</h1>
        <p className="text-gray-600">
          个性化您的AI助手体验，管理账户和隐私设置
        </p>
      </div>

      <div className="space-y-6">
        {/* 用户信息 */}
        <SettingSection
          title="用户信息"
          description="管理您的个人资料和账户信息"
          icon={User}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{user?.name || '未知用户'}</h4>
                <p className="text-sm text-gray-600">{user?.email || '未设置邮箱'}</p>
                <p className="text-xs text-gray-500">
                  {user?.isGuest ? '游客账户' : '正式用户'}
                </p>
              </div>
            </div>
            
            {user?.isGuest && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  您当前使用的是游客账户。注册正式账户可以享受数据同步、个性化设置等更多功能。
                </p>
                <button className="mt-2 text-sm text-yellow-700 hover:text-yellow-900 font-medium">
                  立即注册 →
                </button>
              </div>
            )}
          </div>
        </SettingSection>

        {/* 界面设置 */}
        <SettingSection
          title="界面设置"
          description="自定义界面语言、主题和显示偏好"
          icon={Palette}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                语言
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                主题
              </label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                回答风格
              </label>
              <select
                value={settings.responseStyle}
                onChange={(e) => setSettings({ ...settings, responseStyle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="professional">专业</option>
                <option value="casual">随意</option>
                <option value="detailed">详细</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大回答长度
              </label>
              <input
                type="number"
                min="500"
                max="5000"
                step="100"
                value={settings.maxResponseLength}
                onChange={(e) => setSettings({ ...settings, maxResponseLength: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </SettingSection>

        {/* 通知设置 */}
        <SettingSection
          title="通知设置"
          description="管理各种通知和提醒"
          icon={Bell}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">邮件通知</h4>
                <p className="text-sm text-gray-600">接收重要更新和功能通知</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">浏览器通知</h4>
                <p className="text-sm text-gray-600">在浏览器中显示通知</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.browser}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, browser: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">产品更新</h4>
                <p className="text-sm text-gray-600">接收新功能和改进通知</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.updates}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, updates: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </SettingSection>

        {/* 隐私设置 */}
        <SettingSection
          title="隐私设置"
          description="控制数据收集和使用方式"
          icon={Shield}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">保存对话历史</h4>
                <p className="text-sm text-gray-600">在服务器上保存您的对话记录</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.saveHistory}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, saveHistory: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">使用分析</h4>
                <p className="text-sm text-gray-600">帮助我们改进产品体验</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.analytics}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, analytics: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">数据共享</h4>
                <p className="text-sm text-gray-600">与第三方服务共享匿名数据</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.shareData}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, shareData: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </SettingSection>

        {/* 数据管理 */}
        <SettingSection
          title="数据管理"
          description="导出或清除您的数据"
          icon={Download}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={exportData}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>导出数据</span>
            </button>
            
            <button
              onClick={clearData}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>清除本地数据</span>
            </button>
          </div>
        </SettingSection>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? '保存中...' : '保存设置'}</span>
          </button>
        </div>
      </div>
    </div>
  )
} 