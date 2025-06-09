import { useState } from 'react'
import { 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
  Copy,
  Download
} from 'lucide-react'
import { analyzeAPI } from '@/services/aiService'
import type { AnalysisResponse, QualityScore } from '@/types'
import toast from 'react-hot-toast'

// 质量评分可视化组件
function QualityRadarChart({ score }: { score: QualityScore }) {
  const metrics = [
    { name: '清晰度', value: score.clarity, color: 'text-blue-600' },
    { name: '具体性', value: score.specificity, color: 'text-green-600' },
    { name: '完整性', value: score.completeness, color: 'text-purple-600' },
    { name: '一致性', value: score.consistency, color: 'text-orange-600' },
    { name: '有效性', value: score.effectiveness, color: 'text-red-600' },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">质量评分详情</h3>
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className={`font-medium ${metric.color}`}>{metric.name}</span>
            <div className="flex items-center space-x-3 flex-1 ml-4">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    metric.value >= 8 ? 'bg-green-500' : 
                    metric.value >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(metric.value / 10) * 100}%` }}
                />
              </div>
              <span className="font-bold text-lg min-w-[3rem] text-right">
                {metric.value.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
        
        {/* 综合评分 */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900">综合评分</span>
            <div className="flex items-center space-x-3 flex-1 ml-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    score.overall >= 8 ? 'bg-green-500' : 
                    score.overall >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(score.overall / 10) * 100}%` }}
                />
              </div>
              <span className="font-bold text-xl min-w-[3rem] text-right">
                {score.overall.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 建议卡片组件
function SuggestionCard({ 
  title, 
  items, 
  icon: Icon, 
  color 
}: { 
  title: string
  items: string[]
  icon: any
  color: string 
}) {
  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon className={`w-5 h-5 ${color}`} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start space-x-2">
            <div className={`w-2 h-2 rounded-full mt-2 ${color.replace('text-', 'bg-')}`} />
            <span className="text-gray-700 text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AnalyzePage() {
  const [prompt, setPrompt] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 执行分析
  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      toast.error('请输入要分析的提示词')
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await analyzeAPI.analyzePrompt({
        prompt: prompt.trim()
      })

      setAnalysisResult(result)
      toast.success('分析完成！')
    } catch (error: any) {
      console.error('分析失败:', error)
      toast.error(error.message || '分析失败，请稍后重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 复制分析报告
  const copyReport = async () => {
    if (!analysisResult) return

    const report = `
提示词质量分析报告
==================

原始提示词：
${prompt}

质量评分：
- 清晰度：${analysisResult.qualityScore.clarity}/10
- 具体性：${analysisResult.qualityScore.specificity}/10
- 完整性：${analysisResult.qualityScore.completeness}/10
- 一致性：${analysisResult.qualityScore.consistency}/10
- 有效性：${analysisResult.qualityScore.effectiveness}/10
- 综合评分：${analysisResult.qualityScore.overall}/10

优势：
${analysisResult.strengths.map(s => `• ${s}`).join('\n')}

不足：
${analysisResult.weaknesses.map(w => `• ${w}`).join('\n')}

改进建议：
${analysisResult.suggestions.map(s => `• ${s}`).join('\n')}
    `.trim()

    try {
      await navigator.clipboard.writeText(report)
      toast.success('分析报告已复制到剪贴板')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  // 保存分析结果
  const saveAnalysis = async () => {
    if (!analysisResult) return

    try {
      await analyzeAPI.saveAnalysis({
        prompt,
        qualityScore: analysisResult.qualityScore,
        suggestions: analysisResult.suggestions
      })
      toast.success('分析结果已保存')
    } catch (error: any) {
      toast.error(error.message || '保存失败')
    }
  }

  // 获取评分等级
  const getScoreLevel = (score: number) => {
    if (score >= 8) return { text: '优秀', color: 'text-green-600 bg-green-50' }
    if (score >= 6) return { text: '良好', color: 'text-yellow-600 bg-yellow-50' }
    return { text: '需改进', color: 'text-red-600 bg-red-50' }
  }

  const overallLevel = analysisResult ? getScoreLevel(analysisResult.qualityScore.overall) : null

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">提示词质量分析</h1>
        <p className="text-gray-600">
          多维度分析您的提示词质量，提供专业的改进建议
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：输入区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 提示词输入 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">输入提示词</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入您想要分析的提示词..."
              className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                字符数：{prompt.length}
              </span>
              <button
                onClick={handleAnalyze}
                disabled={!prompt.trim() || isAnalyzing}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>{isAnalyzing ? '分析中...' : '开始分析'}</span>
              </button>
            </div>
          </div>

          {/* 分析结果 */}
          {analysisResult && (
            <div className="space-y-6">
              {/* 综合评分概览 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">分析结果</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyReport}
                      className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                      title="复制分析报告"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={saveAnalysis}
                      className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                      title="保存分析结果"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-center mb-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full ${overallLevel?.color}`}>
                      <BarChart3 className="w-5 h-5 mr-2" />
                      <span className="font-semibold">{overallLevel?.text}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {analysisResult.qualityScore.overall.toFixed(1)}
                      </span>
                      <span className="text-gray-500 ml-1">/10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 质量评分详情 */}
              <QualityRadarChart score={analysisResult.qualityScore} />

              {/* 优势、不足和建议 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SuggestionCard
                  title="优势"
                  items={analysisResult.strengths}
                  icon={CheckCircle}
                  color="text-green-600"
                />
                <SuggestionCard
                  title="不足"
                  items={analysisResult.weaknesses}
                  icon={AlertTriangle}
                  color="text-red-600"
                />
              </div>

              <SuggestionCard
                title="改进建议"
                items={analysisResult.suggestions}
                icon={Lightbulb}
                color="text-blue-600"
              />

              {/* 推荐优化策略 */}
              {analysisResult.optimizationRecommendations && 
               analysisResult.optimizationRecommendations.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Target className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">推荐优化策略</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.optimizationRecommendations.map((strategy, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        {strategy}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    建议使用这些策略来优化您的提示词，可以前往"提示词优化"页面进行具体操作。
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：分析指标说明 */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">评分标准</h2>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">清晰度 (1-10)</h4>
                <p className="text-sm text-gray-600">
                  提示词表达是否清晰明确，避免歧义和模糊表述
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">具体性 (1-10)</h4>
                <p className="text-sm text-gray-600">
                  是否提供了具体的要求、示例或约束条件
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">完整性 (1-10)</h4>
                <p className="text-sm text-gray-600">
                  是否包含了完成任务所需的所有必要信息
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">一致性 (1-10)</h4>
                <p className="text-sm text-gray-600">
                  提示词内部逻辑是否一致，没有自相矛盾
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">有效性 (1-10)</h4>
                <p className="text-sm text-gray-600">
                  预期能否有效引导AI产生期望的输出结果
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">评分等级</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div>
                  <span className="font-medium text-green-600">优秀 (8.0-10.0)</span>
                  <p className="text-sm text-gray-600">提示词质量很高，可以直接使用</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div>
                  <span className="font-medium text-yellow-600">良好 (6.0-7.9)</span>
                  <p className="text-sm text-gray-600">基本满足要求，建议适当优化</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div>
                  <span className="font-medium text-red-600">需改进 (0-5.9)</span>
                  <p className="text-sm text-gray-600">需要重点优化和改进</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 