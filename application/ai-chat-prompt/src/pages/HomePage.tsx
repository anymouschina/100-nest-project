import { Link } from 'react-router-dom'
import { MessageCircle, Wand2, BarChart3, Sparkles, Target, Zap } from 'lucide-react'
import GuestModeInfo from '@/components/GuestModeInfo'

const features = [
  {
    name: '智能对话',
    description: '支持上下文记忆的多轮对话，提供专业的AI咨询服务',
    icon: MessageCircle,
    href: '/chat',
    color: 'bg-blue-500',
  },
  {
    name: '提示词优化',
    description: '基于谷歌提示工程白皮书的六大核心策略进行专业优化',
    icon: Wand2,
    href: '/optimize',
    color: 'bg-purple-500',
  },
  {
    name: '质量分析',
    description: '多维度评估提示词质量，提供详细的改进建议',
    icon: BarChart3,
    href: '/analyze',
    color: 'bg-green-500',
  },
]

const strategies = [
  {
    name: '基础优化',
    description: '明确性、结构化、上下文增强',
    icon: Target,
  },
  {
    name: '角色扮演',
    description: '专业角色定义和背景设定',
    icon: Sparkles,
  },
  {
    name: 'Few-shot学习',
    description: '示例驱动的格式指导',
    icon: Zap,
  },
]

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Guest Mode Info */}
      <GuestModeInfo />

      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block">AI智能助手</span>
          <span className="block gradient-text mt-2">提示词优化专家</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
          基于《谷歌提示工程白皮书》的专业AI助手模块，集成Moonshot AI，
          提供提示词优化和智能对话功能。
        </p>
        <div className="mt-8">
          <Link
            to="/chat"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            开始对话
            <MessageCircle className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">核心功能</h2>
          <p className="mt-4 text-lg text-gray-600">
            专业的AI工具集，助力您的创作和思考
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.name}
              to={feature.href}
              className="relative group bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {feature.name}
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Optimization Strategies */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">优化策略</h2>
          <p className="mt-4 text-lg text-gray-600">
            基于谷歌提示工程白皮书的专业优化方法
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <div
              key={strategy.name}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <strategy.icon className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  {strategy.name}
                </h3>
              </div>
              <p className="text-gray-600">{strategy.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          开始优化您的提示词
        </h2>
        <p className="text-gray-600 mb-6">
          体验专业的AI提示词优化服务，提升您的AI交互效果
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/optimize"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            提示词优化
            <Wand2 className="ml-2 w-5 h-5" />
          </Link>
          <Link
            to="/analyze"
            className="inline-flex items-center px-6 py-3 border border-primary-300 text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 transition-colors"
          >
            质量分析
            <BarChart3 className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
} 