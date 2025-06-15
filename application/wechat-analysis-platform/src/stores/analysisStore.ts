import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import AnalysisService from '../services/analysisService';
import type { AnalysisRequest, AnalysisResponse } from '../types/api';

interface AnalysisState {
  // 当前分析结果
  currentAnalysis: AnalysisResponse | null;
  // 分析历史
  analysisHistory: AnalysisResponse[];
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;
  
  // Actions
  startAnalysis: (request: AnalysisRequest) => Promise<void>;
  clearError: () => void;
  clearCurrentAnalysis: () => void;
  addToHistory: (analysis: AnalysisResponse) => void;
  removeFromHistory: (index: number) => void;
  clearHistory: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  devtools(
    (set, get) => ({
      currentAnalysis: null,
      analysisHistory: [],
      loading: false,
      error: null,

      startAnalysis: async (request: AnalysisRequest) => {
        set({ loading: true, error: null });
        
        try {
          const response = await AnalysisService.summarize(request);
          
          if (response.success) {
            set({ 
              currentAnalysis: response,
              loading: false 
            });
            
            // 添加到历史记录
            get().addToHistory(response);
          } else {
            set({ 
              error: response.error || '分析失败',
              loading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '网络错误',
            loading: false 
          });
        }
      },

      clearError: () => set({ error: null }),
      
      clearCurrentAnalysis: () => set({ currentAnalysis: null }),
      
      addToHistory: (analysis: AnalysisResponse) => {
        const { analysisHistory } = get();
        const newHistory = [analysis, ...analysisHistory].slice(0, 50); // 保留最近50条
        set({ analysisHistory: newHistory });
      },
      
      removeFromHistory: (index: number) => {
        const { analysisHistory } = get();
        const newHistory = analysisHistory.filter((_, i) => i !== index);
        set({ analysisHistory: newHistory });
      },
      
      clearHistory: () => set({ analysisHistory: [] }),
    }),
    {
      name: 'analysis-store',
    }
  )
); 