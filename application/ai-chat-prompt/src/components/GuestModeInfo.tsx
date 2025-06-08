import { UserCheck, Crown, ArrowRight, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface GuestModeInfoProps {
  onClose?: () => void
  showUpgrade?: boolean
}

export default function GuestModeInfo({ onClose, showUpgrade = true }: GuestModeInfoProps) {
  const [isVisible, setIsVisible] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user?.isGuest || !isVisible) {
    return null
  }

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  const handleUpgrade = () => {
    navigate('/register')
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <UserCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              您正在使用游客模式
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>您可以体验所有AI功能，但数据不会永久保存。</p>
              {showUpgrade && (
                <div className="mt-2 flex items-center space-x-4">
                  <button
                    onClick={handleUpgrade}
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    升级为正式账户
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                  <span className="text-blue-500">•</span>
                  <span className="text-sm text-blue-600">
                    享受数据持久化和更多功能
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-blue-400 hover:text-blue-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
} 