import { useState, useEffect } from 'react'
import { 
  Wand2, 
  Lightbulb, 
  Target, 
  Users, 
  BookOpen, 
  Brain, 
  Image, 
  Copy, 
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { optimizeAPI, knowledgeAPI } from '@/services/aiService'
import type { OptimizationType, OptimizationResponse, QualityScore } from '@/types'
import toast from 'react-hot-toast'

// 优化策略配置
const OPTIMIZATION_STRATEGIES = [
  {
    type: 'basic' as OptimizationType,
    name: '基础优化',
    icon: Target,
    description: '提升提示词的明确性、结构化和上下文增强',
    color: 'bg-blue-500',
    features: ['明确性增强', '结构化组织', '上下文补充']
  },
  {
    type: 'rolePlay' as OptimizationType,
    name: '角色扮演',
    icon: Users,
    description: '定义专业角色和背景设定，提升回答的专业性',
    color: 'bg-green-500',
    features: ['专业角色定义', '背景设定', '专业术语优化']
  },
  {
    type: 'fewShot' as OptimizationType,
    name: 'Few-shot学习',
    icon: BookOpen,
    description: '通过示例驱动的格式指导，提升输出质量',
    color: 'bg-purple-500',
    features: ['示例引导', '格式规范', '输出模板']
  },
  {
    type: 'chainOfThought' as OptimizationType,
    name: '思维链推理',
    icon: Brain,
    description: '引导AI进行步骤化的推理过程',
    color: 'bg-orange-500',
    features: ['逻辑推理', '步骤分解', '思考过程']
  },
  {
    type: 'domainSpecific' as OptimizationType,
    name: '领域专业化',
    icon: Lightbulb,
    description: '针对特定领域进行专业化优化',
    color: 'bg-red-500',
    features: ['领域知识', '专业术语', '行业标准']
  },
  {
    type: 'multiModal' as OptimizationType,
    name: '多模态支持',
    icon: Image,
    description: '支持文本、图像等多种输入类型的优化',
    color: 'bg-indigo-500',
    features: ['多媒体支持', '跨模态理解', '综合分析']
  }
]

// 质量评分组件
function QualityScoreCard({ score, title }: { score: number; title: string }) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50'
    if (score >= 6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 8) return CheckCircle
    if (score >= 6) return AlertCircle
    return AlertCircle
  }

  const Icon = getScoreIcon(score)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex items-center space-x-2">
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score.toFixed(1)}
        </span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function OptimizePage() {
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizationType>('basic')
  const [domain, setDomain] = useState('')
  const [context, setContext] = useState('')

  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [examples, setExamples] = useState<any[]>([])
  
  // 角色扮演相关状态
  const [role, setRole] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('')
  
  // Few-shot学习相关状态
  const [exampleInputs, setExampleInputs] = useState<string[]>([''])
  const [exampleOutputs, setExampleOutputs] = useState<string[]>([''])

  // 加载示例模板
  useEffect(() => {
    loadExamples()
  }, [selectedStrategy])

  const loadExamples = async () => {
    try {
      const data = await knowledgeAPI.getExampleTemplates(selectedStrategy)
      setExamples(data || [])
    } catch (error) {
      console.error('加载示例失败:', error)
    }
  }



  // 执行优化
  const handleOptimize = async () => {
    if (!originalPrompt.trim()) {
      toast.error('请输入原始提示词')
      return
    }

    setIsOptimizing(true)
    try {
      // 构建additionalParams
      const additionalParams: any = {}
      
      if (selectedStrategy === 'rolePlay') {
        if (role) additionalParams.role = role
        if (audience) additionalParams.audience = audience
        if (tone) additionalParams.tone = tone
      } else if (selectedStrategy === 'fewShot') {
        const examples = exampleInputs.map((input, index) => ({
          input: input.trim(),
          output: exampleOutputs[index]?.trim() || ''
        })).filter(ex => ex.input && ex.output)
        if (examples.length > 0) additionalParams.examples = examples
      } else if (selectedStrategy === 'chainOfThought') {
        additionalParams.stepByStep = true
        additionalParams.showReasoning = true
      } else if (selectedStrategy === 'domainSpecific') {
        if (domain) additionalParams.domain = domain
        additionalParams.expertiseLevel = '高级'
        additionalParams.technicalTerms = true
      } else if (selectedStrategy === 'multiModal') {
        additionalParams.modalities = ['text']
        additionalParams.detailLevel = 'detailed'
      }

      const result = await optimizeAPI.optimizePrompt({
        prompt: originalPrompt.trim(),
        optimizationType: selectedStrategy,
        context: context.trim() || undefined,
        additionalParams: Object.keys(additionalParams).length > 0 ? additionalParams : undefined
      })

      setOptimizationResult(result)
      toast.success('优化完成！')
    } catch (error: any) {
      console.error('优化失败:', error)
      toast.error(error.message || '优化失败，请稍后重试')
    } finally {
      setIsOptimizing(false)
    }
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制到剪贴板')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  // 保存优化结果
  const saveOptimization = async () => {
    if (!optimizationResult) return

    try {
      await optimizeAPI.saveOptimization({
        originalPrompt,
        optimizedPrompt: optimizationResult.optimizedPrompt,
        optimizationType: selectedStrategy,
        qualityScore: optimizationResult.qualityScore
      })
      toast.success('优化结果已保存')
    } catch (error: any) {
      toast.error(error.message || '保存失败')
    }
  }

  // 使用示例
  const useExample = (example: any) => {
    setOriginalPrompt(example.prompt || '')
    if (example.domain) setDomain(example.domain)
    if (example.context) setContext(example.context)
    if (example.role) setRole(example.role)
    if (example.audience) setAudience(example.audience)
    if (example.tone) setTone(example.tone)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">提示词优化</h1>
        <p className="text-gray-600">
          基于谷歌提示工程白皮书的六大核心策略，智能优化您的提示词
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：输入区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 原始提示词输入 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">原始提示词</h2>
            <textarea
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              placeholder="请输入您想要优化的提示词..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 优化策略选择 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">优化策略</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OPTIMIZATION_STRATEGIES.map((strategy) => {
                const Icon = strategy.icon
                return (
                  <div
                    key={strategy.type}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedStrategy === strategy.type
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedStrategy(strategy.type)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${strategy.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{strategy.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {strategy.features.map((feature, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 高级选项 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">高级选项</h2>
            <div className="space-y-4">
              {/* 上下文设置 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上下文信息 (可选)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="提供相关的背景信息或使用场景..."
                  className="w-full h-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 角色扮演特定选项 */}
              {selectedStrategy === 'rolePlay' && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-800">角色扮演配置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        角色
                      </label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="如：资深物理学教授"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        目标受众
                      </label>
                      <input
                        type="text"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="如：高中生"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        语调风格
                      </label>
                      <input
                        type="text"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        placeholder="如：通俗易懂"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Few-shot学习特定选项 */}
              {selectedStrategy === 'fewShot' && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-medium text-purple-800">Few-shot示例配置</h3>
                  {exampleInputs.map((input, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          示例输入 {index + 1}
                        </label>
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => {
                            const newInputs = [...exampleInputs]
                            newInputs[index] = e.target.value
                            setExampleInputs(newInputs)
                          }}
                          placeholder="输入示例..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          期望输出 {index + 1}
                        </label>
                        <input
                          type="text"
                          value={exampleOutputs[index] || ''}
                          onChange={(e) => {
                            const newOutputs = [...exampleOutputs]
                            newOutputs[index] = e.target.value
                            setExampleOutputs(newOutputs)
                          }}
                          placeholder="期望的输出..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setExampleInputs([...exampleInputs, ''])
                      setExampleOutputs([...exampleOutputs, ''])
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + 添加示例
                  </button>
                </div>
              )}

              {/* 领域专业化特定选项 */}
              {selectedStrategy === 'domainSpecific' && (
                <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-medium text-red-800">领域专业化配置</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      专业领域
                    </label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="如：医疗、法律、教育、技术等"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 优化按钮 */}
          <div className="flex justify-center">
            <button
              onClick={handleOptimize}
              disabled={!originalPrompt.trim() || isOptimizing}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isOptimizing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              <span>{isOptimizing ? '优化中...' : '开始优化'}</span>
            </button>
          </div>
        </div>

        {/* 右侧：示例和结果 */}
        <div className="space-y-6">
          {/* 示例模板 */}
          {examples.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">示例模板</h2>
              <div className="space-y-3">
                {examples.slice(0, 3).map((example, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => useExample(example)}
                  >
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {example.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {example.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 优化结果 */}
          {optimizationResult && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">优化结果</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(optimizationResult.optimizedPrompt)}
                    className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    title="复制优化后的提示词"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={saveOptimization}
                    className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    title="保存优化结果"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 优化后的提示词 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">优化后的提示词</h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {optimizationResult.optimizedPrompt}
                  </p>
                </div>
              </div>

              {/* 质量评分 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">质量评分</h3>
                <div className="grid grid-cols-2 gap-3">
                  <QualityScoreCard score={optimizationResult.qualityScore.clarity} title="清晰度" />
                  <QualityScoreCard score={optimizationResult.qualityScore.specificity} title="具体性" />
                  <QualityScoreCard score={optimizationResult.qualityScore.completeness} title="完整性" />
                  <QualityScoreCard score={optimizationResult.qualityScore.consistency} title="一致性" />
                  <QualityScoreCard score={optimizationResult.qualityScore.effectiveness} title="有效性" />
                  <div className="col-span-2">
                    <QualityScoreCard score={optimizationResult.qualityScore.overall} title="综合评分" />
                  </div>
                </div>
              </div>

              {/* 优化说明 */}
              {optimizationResult.explanation && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">优化说明</h3>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">{optimizationResult.explanation}</p>
                  </div>
                </div>
              )}

              {/* 改进建议 */}
              {optimizationResult.suggestions && optimizationResult.suggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">改进建议</h3>
                  <ul className="space-y-2">
                    {optimizationResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 