<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>推广统计数据</span>
          <div>
            <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
              <el-radio-button label="week">最近一周</el-radio-button>
              <el-radio-button label="month">最近一个月</el-radio-button>
              <el-radio-button label="year">最近一年</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
        <el-form-item label="用户ID" prop="userId">
          <el-input
            v-model="queryParams.userId"
            placeholder="请输入用户ID"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="日期范围" prop="dateRange">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="statistics-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover" class="statistics-card">
              <template #header>
                <div class="card-header">
                  <span>总推广引用码数</span>
                </div>
              </template>
              <div class="statistics-value">{{ statisticsData.totalReferrals || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="statistics-card">
              <template #header>
                <div class="card-header">
                  <span>总使用次数</span>
                </div>
              </template>
              <div class="statistics-value">{{ statisticsData.totalUsage || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="statistics-card">
              <template #header>
                <div class="card-header">
                  <span>转化用户数</span>
                </div>
              </template>
              <div class="statistics-value">{{ statisticsData.conversionCount || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="statistics-card">
              <template #header>
                <div class="card-header">
                  <span>转化率</span>
                </div>
              </template>
              <div class="statistics-value">{{ statisticsData.conversionRate || '0%' }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <el-divider />

      <!-- 时间趋势图表 -->
      <div ref="usageChartRef" class="chart-container"></div>

      <el-divider />

      <!-- 引用码使用排行 -->
      <div class="ranking-title">引用码使用排行</div>
      <el-table :data="rankingList" style="width: 100%">
        <el-table-column label="排名" width="80">
          <template #default="scope">
            <span>{{ scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="refCode" label="引用码" />
        <el-table-column prop="createdBy" label="创建用户" />
        <el-table-column prop="usageCount" label="使用次数" />
        <el-table-column prop="conversionCount" label="转化用户数" />
        <el-table-column prop="conversionRate" label="转化率" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="ReferralStatistics">
import { getReferralStatistics } from "@/api/referral";
import { parseTime } from '@/utils/mei-mei';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { 
  TitleComponent, 
  TooltipComponent, 
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册 ECharts 必须的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  BarChart,
  CanvasRenderer,
  ToolboxComponent,
  DataZoomComponent
]);

const { proxy } = getCurrentInstance();

const usageChartRef = ref(null);
let usageChart = null;

const loading = ref(true);
const showSearch = ref(true);
const dateRange = ref([]);
const timeRange = ref('week');
const statisticsData = ref({
  dates: [],
  usageCounts: [],
  conversionCounts: [],
  totalReferrals: 0,
  totalUsage: 0,
  conversionCount: 0,
  conversionRate: '0%'
});
const rankingList = ref([]);

const queryParams = ref({
  userId: undefined,
  timeRange: 'week'
});

/** 获取统计数据 */
function getStatisticsData() {
  loading.value = true;
  
  const query = {
    ...queryParams.value,
    timeRange: timeRange.value,
    startDate: dateRange.value && dateRange.value[0],
    endDate: dateRange.value && dateRange.value[1]
  };
  
  getReferralStatistics(query).then(response => {
    if (response && response.data) {
      statisticsData.value = response.data.statistics || {
        dates: [],
        usageCounts: [],
        conversionCounts: [],
        totalReferrals: 0,
        totalUsage: 0,
        conversionCount: 0,
        conversionRate: '0%'
      };
      
      rankingList.value = response.data.rankings || [];
    } else {
      statisticsData.value = {
        dates: [],
        usageCounts: [],
        conversionCounts: [],
        totalReferrals: 0,
        totalUsage: 0,
        conversionCount: 0,
        conversionRate: '0%'
      };
      
      rankingList.value = [];
    }
    
    loading.value = false;
    
    // 渲染图表
    nextTick(() => {
      renderUsageChart();
    });
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  getStatisticsData();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  proxy.$resetForm("queryRef");
  timeRange.value = 'week';
  handleQuery();
}

/** 时间范围切换 */
function handleTimeRangeChange() {
  dateRange.value = []; // 清空日期范围选择
  getStatisticsData();
}

/** 渲染使用趋势图表 */
function renderUsageChart() {
  if (!usageChartRef.value) return;
  
  if (usageChart) {
    usageChart.dispose();
  }
  
  usageChart = echarts.init(usageChartRef.value);
  
  const option = {
    title: {
      text: '推广引用码使用趋势'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['使用次数', '转化人数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: statisticsData.value.dates || []
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '使用次数',
        type: 'bar',
        data: statisticsData.value.usageCounts || []
      },
      {
        name: '转化人数',
        type: 'line',
        data: statisticsData.value.conversionCounts || []
      }
    ]
  };
  
  usageChart.setOption(option);
  
  // 窗口大小变化时重新调整图表大小
  window.addEventListener('resize', () => {
    usageChart.resize();
  });
}

onMounted(() => {
  getStatisticsData();
});

onBeforeUnmount(() => {
  if (usageChart) {
    usageChart.dispose();
    usageChart = null;
  }
  
  window.removeEventListener('resize', () => {
    if (usageChart) {
      usageChart.resize();
    }
  });
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-divider {
  margin: 24px 0;
}

.statistics-overview {
  margin-top: 20px;
}

.statistics-card {
  text-align: center;
}

.statistics-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin: 15px 0;
}

.chart-container {
  width: 100%;
  height: 400px;
  margin-top: 20px;
}

.ranking-title {
  font-size: 18px;
  font-weight: bold;
  margin: 15px 0;
}
</style>
