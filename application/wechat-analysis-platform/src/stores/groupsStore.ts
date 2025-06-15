import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import AnalysisService from '../services/analysisService';
import type { GroupInfo } from '../types/api';

interface GroupsState {
  // 群聊列表
  groups: GroupInfo[];
  // 选中的群聊
  selectedGroups: string[];
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;
  // 搜索关键词
  searchKeyword: string;
  
  // Actions
  fetchGroups: (keyword?: string) => Promise<void>;
  selectGroup: (groupName: string) => void;
  unselectGroup: (groupName: string) => void;
  selectAllGroups: () => void;
  clearSelection: () => void;
  setSearchKeyword: (keyword: string) => void;
  clearError: () => void;
}

export const useGroupsStore = create<GroupsState>()(
  devtools(
    (set, get) => ({
      groups: [],
      selectedGroups: [],
      loading: false,
      error: null,
      searchKeyword: '',

      fetchGroups: async (keyword?: string) => {
        set({ loading: true, error: null });
        
        try {
          const response = await AnalysisService.getGroups(keyword);
          
          if (response.success && response.data) {
            set({ 
              groups: response.data,
              loading: false 
            });
          } else {
            set({ 
              error: response.error || '获取群聊列表失败',
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

      selectGroup: (groupName: string) => {
        const { selectedGroups } = get();
        if (!selectedGroups.includes(groupName)) {
          set({ selectedGroups: [...selectedGroups, groupName] });
        }
      },

      unselectGroup: (groupName: string) => {
        const { selectedGroups } = get();
        set({ selectedGroups: selectedGroups.filter(name => name !== groupName) });
      },

      selectAllGroups: () => {
        const { groups } = get();
        set({ selectedGroups: groups.map(group => group.name) });
      },

      clearSelection: () => set({ selectedGroups: [] }),

      setSearchKeyword: (keyword: string) => {
        set({ searchKeyword: keyword });
        // 自动搜索
        get().fetchGroups(keyword);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'groups-store',
    }
  )
); 