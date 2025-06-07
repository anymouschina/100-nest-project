<template>
  <div class="app-container">
    <!-- 统计图表 -->
    <el-card class="box-card mb8">
      <template #header>
        <div class="card-header">
          <span>订单统计</span>
          <div>
            <el-radio-group v-model="timeRange" size="small" @change="getStatisticsData">
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
              <el-radio-button label="year">本年</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>
      <el-row :gutter="20">
        <!-- <el-col :span="12">
          <div ref="orderChartRef" style="width: 100%; height: 400px;"></div>
        </el-col> -->
        <el-col :span="12">
          <div ref="pieChartRef" style="width: 100%; height: 400px;"></div>
        </el-col>
      </el-row>
    </el-card>

    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item label="订单状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable>
          <el-option
            v-for="(value, key) in ORDER_STATUS"
            :key="key"
            :label="ORDER_STATUS_MAP[value]"
            :value="value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="服务类型" prop="serviceType">
        <el-select v-model="queryParams.serviceType" placeholder="请选择服务类型" clearable>
          <el-option
            v-for="(value, key) in SERVICE_TYPE"
            :key="key"
            :label="SERVICE_TYPE_MAP[value]"
            :value="value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="支付状态" prop="paymentStatus">
        <el-select v-model="queryParams.paymentStatus" placeholder="请选择支付状态" clearable>
          <el-option
            v-for="(value, key) in PAYMENT_STATUS"
            :key="key"
            :label="PAYMENT_STATUS_MAP[value]"
            :value="value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机号码" prop="phone">
        <el-input
          v-model="queryParams.phone"
          placeholder="请输入手机号码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="dateRange">
        <el-date-picker
          v-model="dateRange"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:order:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList">
      <el-table-column label="订单ID" align="center" prop="orderId" />
      <el-table-column label="用户信息" align="center" min-width="120">
        <template #default="scope">
          <div>姓名: {{ scope.row.user && scope.row.user.name || '-' }}</div>
          <div>手机: {{ scope.row.appointmentInfo && scope.row.appointmentInfo.phone || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="服务信息" align="center" min-width="120">
        <template #default="scope">
          <div>类型: {{ scope.row.appointmentInfo && SERVICE_TYPE_MAP[scope.row.appointmentInfo.serviceType] || '-' }}</div>
          <div>场景: {{ scope.row.appointmentInfo && scope.row.appointmentInfo.sceneType && scope.row.appointmentInfo.sceneType.join(', ') || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="图片" align="center" min-width="100">
        <template #default="scope">
          <div v-if="scope.row.appointmentInfo && scope.row.appointmentInfo.imageUrls && scope.row.appointmentInfo.imageUrls.length > 0" class="image-preview">
            <img 
              :src="scope.row.appointmentInfo.imageUrls[0]" 
              class="preview-image"
              @click="handlePreviewImage(scope.row.appointmentInfo.imageUrls)"
            />
            <span class="image-count" v-if="scope.row.appointmentInfo.imageUrls.length > 1">+{{ scope.row.appointmentInfo.imageUrls.length - 1 }}</span>
          </div>
          <span v-else>无图片</span>
        </template>
      </el-table-column>
      <el-table-column label="地址" align="center" min-width="180">
        <template #default="scope">
          <el-tooltip
            :content="(scope.row.appointmentInfo && scope.row.appointmentInfo.region || '') + (scope.row.appointmentInfo && scope.row.appointmentInfo.address || '')"
            placement="top"
            :show-after="500"
          >
            <div class="ellipsis">{{ scope.row.appointmentInfo && scope.row.appointmentInfo.region || '' }}{{ scope.row.appointmentInfo && scope.row.appointmentInfo.address || '' }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="订单金额" align="center" prop="total">
        <template #default="scope">
          ¥{{ scope.row.total || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center">
        <template #default="scope">
          <el-tag :type="getOrderStatusType(scope.row.status)">
            {{ getOrderStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付状态" align="center">
        <template #default="scope">
          <el-tag :type="getPaymentStatusType(scope.row.paymentStatus)">
            {{ getPaymentStatusText(scope.row.paymentStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createdAt" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="280" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="handleDetail(scope.row)" style="margin-right: 10px">查看</el-link>
          <el-link 
            v-if="scope.row.status === 'PENDING'" 
            type="success" 
            :underline="false" 
            @click="handleUpdateStatus(scope.row, 'ACCEPTED')" 
            style="margin-right: 10px"
          >接单</el-link>
          <el-link 
            v-if="scope.row.status === 'ACCEPTED'" 
            type="warning" 
            :underline="false" 
            @click="handleUpdateStatus(scope.row, 'PROCESSING')" 
            style="margin-right: 10px"
          >施工</el-link>
          <el-link 
            v-if="scope.row.status === 'PROCESSING'" 
            type="success" 
            :underline="false" 
            @click="handleUpdateStatus(scope.row, 'COMPLETED')" 
            style="margin-right: 10px"
          >完成</el-link>
          <el-link 
            v-if="scope.row.status === 'PENDING' || scope.row.status === 'ACCEPTED'" 
            type="danger" 
            :underline="false" 
            @click="handleCancel(scope.row)"
          >取消</el-link>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.page"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 取消订单对话框 -->
    <el-dialog title="取消订单" v-model="cancelDialogVisible" width="500px" append-to-body>
      <el-form ref="cancelFormRef" :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因" prop="cancelReason">
          <el-input
            v-model="cancelForm.cancelReason"
            type="textarea"
            placeholder="请输入取消原因"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitCancel">确 定</el-button>
        <el-button @click="cancelDialogVisible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览组件 -->
    <el-image-viewer
      v-if="showViewer"
      :url-list="previewImages"
      :initial-index="0"
      :z-index="10000"
      @close="closeViewer"
    />
  </div>
</template>

<script setup name="OrderList">
import { listOrders, updateOrderStatus, cancelOrder, getOrderStatistics } from "@/api/order";
import { parseTime } from '@/utils/mei-mei';
import { Picture } from '@element-plus/icons-vue';
import { ElImageViewer } from 'element-plus';
import * as echarts from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import { 
  TitleComponent, 
  TooltipComponent, 
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { 
  ORDER_STATUS, 
  ORDER_STATUS_MAP, 
  ORDER_STATUS_TAG_TYPE,
  PAYMENT_STATUS,
  PAYMENT_STATUS_MAP,
  PAYMENT_STATUS_TAG_TYPE,
  SERVICE_TYPE,
  SERVICE_TYPE_MAP
} from '@/constants/orderStatus';

// 注册 ECharts 必须的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  PieChart,
  CanvasRenderer,
  ToolboxComponent,
  DataZoomComponent
]);

const router = useRouter();
const { proxy } = getCurrentInstance();

const orderList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const dateRange = ref([]);
const cancelDialogVisible = ref(false);

// 图片预览相关
const showViewer = ref(false);
const previewImages = ref([]);

// 图表相关
const orderChartRef = ref(null);
const pieChartRef = ref(null);
let orderChart = null;
let pieChart = null;
const timeRange = ref('week');
const statisticsData = ref({
  dates: [],
  counts: [],
  ordersByStatus: {},
  totalAmount: 0,
  totalOrders: 0
});

const queryParams = ref({
  page: 1,
  pageSize: 10,
  status: undefined,
  userId: undefined,
  phone: undefined,
  serviceType: undefined,
  paymentStatus: undefined
});

const cancelForm = ref({
  orderId: null,
  cancelReason: ''
});

/** 查询订单列表 */
function getList() {
  loading.value = true;
  const query = {
    ...queryParams.value,
    createdAtStart: dateRange.value && dateRange.value[0],
    createdAtEnd: dateRange.value && dateRange.value[1]
  };
  
  listOrders(query).then(response => {
    orderList.value = response.orders || [];
    total.value = response.total || 0;
    loading.value = false;
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.page = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  proxy.$resetForm("queryRef");
  handleQuery();
}

/** 查看详情按钮操作 */
function handleDetail(row) {
  router.push({ path: `/system/order-detail/index/${row.orderId}` });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('order/export', {
    ...queryParams.value
  }, `订单列表_${new Date().getTime()}.xlsx`);
}

/** 更新订单状态 */
function handleUpdateStatus(row, status) {
  const statusText = ORDER_STATUS_MAP[status];
  
  proxy.$modal.confirm(`确认将订单状态修改为"${statusText}"吗？`).then(() => {
    updateOrderStatus(row.orderId, { status }).then(res => {
      proxy.$modal.msgSuccess("操作成功");
      getList();
    });
  }).catch(() => {});
}

/** 取消订单按钮操作 */
function handleCancel(row) {
  cancelForm.value.orderId = row.orderId;
  cancelForm.value.cancelReason = '';
  cancelDialogVisible.value = true;
}

/** 提交取消订单 */
function submitCancel() {
  if (!cancelForm.value.cancelReason) {
    proxy.$modal.msgError("请输入取消原因");
    return;
  }
  
  cancelOrder(cancelForm.value.orderId, {
    cancelReason: cancelForm.value.cancelReason
  }).then(res => {
    proxy.$modal.msgSuccess("取消订单成功");
    cancelDialogVisible.value = false;
    getList();
  });
}

/** 获取订单状态对应的标签类型 */
function getOrderStatusType(status) {
  return ORDER_STATUS_TAG_TYPE[status] || '';
}

/** 获取订单状态文本 */
function getOrderStatusText(status) {
  return ORDER_STATUS_MAP[status] || '';
}

/** 获取支付状态对应的标签类型 */
function getPaymentStatusType(status) {
  return PAYMENT_STATUS_TAG_TYPE[status] || '';
}

/** 获取支付状态文本 */
function getPaymentStatusText(status) {
  return PAYMENT_STATUS_MAP[status] || '';
}

/** 预览图片 */
function handlePreviewImage(imageUrls) {
  if (imageUrls && imageUrls.length > 0) {
    previewImages.value = imageUrls;
    showViewer.value = true;
  }
}

/** 关闭图片预览 */
function closeViewer() {
  showViewer.value = false;
}

/** 获取订单统计数据 */
function getStatisticsData() {
  getOrderStatistics({ timeRange: timeRange.value }).then(response => {
    console.log('统计数据响应:', response);
    
    if (response && response.code === 200) {
      // 处理订单数据 - 根据实际响应结构调整
      
      // 创建新的统计数据对象
      const newStatsData = {
        dates: [],
        counts: [],
        ordersByStatus: {},
        totalAmount: 0,
        totalOrders: response.totalOrders || 0
      };
      
      // 处理订单状态统计数据
      if (response.orderStatusStats && Array.isArray(response.orderStatusStats)) {
        response.orderStatusStats.forEach(item => {
          if (item.status && typeof item.count === 'number') {
            newStatsData.ordersByStatus[item.status] = item.count;
          }
        });
      }
      
      // 生成每日订单数量的模拟数据（因为API未提供）
      const today = new Date();
      const dates = [];
      const counts = [];
      
      // 根据选择的时间范围生成不同的日期范围
      let days = 7; // 默认一周
      if (timeRange.value === 'month') {
        days = 30;
      } else if (timeRange.value === 'year') {
        days = 12; // 按月显示
      }
      
      for (let i = 0; i < days; i++) {
        let date;
        if (timeRange.value === 'year') {
          // 年视图显示月份
          const month = new Date();
          month.setMonth(month.getMonth() - i);
          date = month.getFullYear() + '-' + (month.getMonth() + 1).toString().padStart(2, '0');
        } else {
          // 周和月视图显示日期
          const day = new Date();
          day.setDate(day.getDate() - i);
          date = day.getFullYear() + '-' + 
                (day.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                day.getDate().toString().padStart(2, '0');
        }
        
        dates.unshift(date);
        
        // 生成随机数量，实际项目中应该使用API提供的数据
        const randomCount = Math.floor(Math.random() * 5) + (newStatsData.totalOrders > 20 ? 2 : 0);
        counts.unshift(randomCount);
      }
      
      newStatsData.dates = dates;
      newStatsData.counts = counts;
      
      // 更新统计数据
      statisticsData.value = newStatsData;
      
      // 渲染图表
      setTimeout(() => {
        renderChart();
        renderPieChart();
      }, 0);
    }
  });
}

/** 渲染图表 */
function renderChart() {
  if (!orderChartRef.value) return;
  
  // 销毁旧图表实例
  if (orderChart) {
    orderChart.dispose();
  }
  
  // 初始化图表
  orderChart = echarts.init(orderChartRef.value);
  
  // 格式化金额
  let amountDisplay = '0.00';
  if (statisticsData.value.totalAmount) {
    const amount = parseFloat(String(statisticsData.value.totalAmount));
    if (!isNaN(amount)) {
      amountDisplay = amount.toFixed(2);
    }
  }
  
  // 获取总订单数
  const totalOrdersDisplay = statisticsData.value.totalOrders || 0;
  
  // 图表配置
  const option = {
    title: {
      text: '订单数量趋势',
      left: 'center',
      subtext: '总订单数: ' + totalOrdersDisplay,
      subtextStyle: {
        color: '#666',
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '80px',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      data: statisticsData.value.dates || [],
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      name: '订单数量',
      minInterval: 1
    },
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: statisticsData.value.counts || [],
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' }
            ])
          }
        }
      }
    ]
  };
  
  // 设置图表选项
  orderChart.setOption(option);
}

/** 渲染饼图 */
function renderPieChart() {
  if (!pieChartRef.value) return;
  
  // 销毁旧图表实例
  if (pieChart) {
    pieChart.dispose();
  }
  
  // 初始化图表
  pieChart = echarts.init(pieChartRef.value);
  
  // 从API数据中生成饼图数据
  const statusData = [];
  
  if (statisticsData.value.ordersByStatus) {
    // 遍历状态数据
    Object.keys(statisticsData.value.ordersByStatus).forEach(status => {
      statusData.push({
        name: ORDER_STATUS_MAP[status] || status,
        value: statisticsData.value.ordersByStatus[status]
      });
    });
  }
  
  // 如果没有数据，添加一个默认项
  if (statusData.length === 0) {
    statusData.push({ name: '暂无数据', value: 0 });
  }
  
  const pieOption = {
    title: {
      text: '订单状态分布',
      left: 'center',
      subtext: timeRange.value === 'week' ? '本周' : (timeRange.value === 'month' ? '本月' : '本年'),
      subtextStyle: {
        color: '#666',
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: '15%'
    },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: statusData,
        color: ['#409EFF', '#67C23A', '#E6A23C', '#909399', '#F56C6C', '#C71585', '#20B2AA', '#B8860B']
      }
    ]
  };
  
  pieChart.setOption(pieOption);
}

/** 处理窗口大小变化 */
function handleResize() {
  if (orderChart) {
    orderChart.resize();
  }
  if (pieChart) {
    pieChart.resize();
  }
}

onMounted(() => {
  getList();
  
  // 延迟执行，确保DOM已经渲染
  setTimeout(() => {
    // 初始化图表
    if (orderChartRef.value && !orderChart) {
      orderChart = echarts.init(orderChartRef.value);
    }
    
    if (pieChartRef.value && !pieChart) {
      pieChart = echarts.init(pieChartRef.value);
      renderPieChart();
    }
    
    // 获取统计数据并渲染图表
    getStatisticsData();
  }, 300);
  
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (orderChart) {
    orderChart.dispose();
    orderChart = null;
  }
  if (pieChart) {
    pieChart.dispose();
    pieChart = null;
  }
});
</script>

<style scoped>
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.preview-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.image-count {
  position: absolute;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 2px 6px;
  border-radius: 0 0 4px 0;
  font-size: 12px;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 20px;
}

/* 搜索表单样式 */
:deep(.el-form-item) {
  margin-bottom: 16px;
  margin-right: 16px;
}

:deep(.el-select),
:deep(.el-input) {
  width: 220px !important;
}

:deep(.el-date-editor.el-date-editor--daterange) {
  width: 380px !important;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

/* 提高图片预览的层级 */
:deep(.el-image-viewer__wrapper) {
  z-index: 9999 !important;
  transform: translate3d(0, 0, 0);
  position: fixed !important;
}

:deep(.el-image-viewer__mask) {
  z-index: 9998 !important;
  position: fixed !important;
}

/* 强制创建新的图层 */
:deep(.el-image-viewer__btn) {
  z-index: 10000 !important;
}

:deep(.el-image-viewer__canvas) {
  z-index: 10000 !important;
}

/* 确保预览按钮在最高层 */
:deep(.el-image-viewer__actions) {
  z-index: 10001 !important;
}

/* 修改图片预览样式 */
:deep(.el-image) {
  --el-image-viewer-z-index: 9999;
}

.mb8 {
  margin-bottom: 18px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.chart {
  width: 100%;
  height: 100%;
}
</style> 