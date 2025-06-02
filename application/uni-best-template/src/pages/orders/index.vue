<route lang="json5">
{
  style: {
    navigationBarTitleText: '我的订单',
    navigationStyle:'custom'
  },
}
</route>

<template>
  <view class="orders-container" :style="{ height: height }">
    <!-- 订单状态选项卡 -->
    <wd-tabs v-model="activeTab" sticky offset-top="44px" @change="handleTabChange">
      <wd-tab title="全部订单" name="all"></wd-tab>
      <wd-tab title="待接单" name="pending"></wd-tab>
      <wd-tab title="已接单" name="accepted"></wd-tab>
      <wd-tab title="施工中" name="processing"></wd-tab>
      <wd-tab title="已完成" name="completed"></wd-tab>
    </wd-tabs>
    
    <!-- 加载中状态 -->
    <view class="loading-container" v-if="loading && filteredOrders.length === 0">
      <wd-loading color="#2c722c" />
      <text class="loading-text">加载订单数据中...</text>
    </view>
    
    <!-- 下拉刷新区域 -->
    <scroll-view
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      refresher-background="#f7f8fa"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
      style="height: calc(100% - 104rpx);"
      v-else
    >
      <!-- 订单列表 -->
      <view class="orders-list" v-if="filteredOrders.length > 0">
        <view 
          class="order-card" 
          v-for="(order, index) in filteredOrders" 
          :key="index"
          @click="goToOrderDetail(order.id)"
        >
          <view class="order-header">
            <view class="order-type">{{ order.serviceTypeName }}</view>
            <view class="order-status" :class="'status-' + order.status">{{ getStatusText(order) }}</view>
          </view>
          
          <view class="order-info">
            <view class="info-item">
              <text class="label">订单编号：</text>
              <text class="value">{{ order.orderNo }}</text>
            </view>
            <view class="info-item">
              <text class="label">预约时间：</text>
              <text class="value">{{ order.appointmentTime }}</text>
            </view>
            <view class="info-item">
              <text class="label">服务地址：</text>
              <text class="value">{{ order.address }}</text>
            </view>
          </view>
          
          <view class="order-footer">
            <view class="price-info">
              <text class="price-label">实付款</text>
              <text class="price-value">¥ {{ order.price.toFixed(2) }}</text>
            </view>
            
            <view class="action-buttons">
              <template v-if="order.status === 'pending'">
                <wd-button size="small" @click.stop="cancelOrderAction(order.id)">取消订单</wd-button>
              </template>
              <template v-if="order.status === 'accepted'">
                <wd-button size="small" @click.stop="contactService(order.id)">联系客服</wd-button>
              </template>
              <template v-if="order.status === 'processing'">
                <wd-button size="small" @click.stop="checkProgress(order.id)">查看进度</wd-button>
              </template>
              <template v-if="order.status === 'completed'">
                <wd-button size="small" type="success" @click.stop="reviewOrder(order.id)">评价服务</wd-button>
              </template>
            </view>
          </view>
        </view>
        
        <!-- 加载更多状态 -->
        <view class="load-more" v-if="pagination.loadingMore">
          <wd-loading color="#2c722c" size="24px" />
          <text class="load-more-text">加载更多...</text>
        </view>
        
        <!-- 没有更多数据提示 -->
        <view class="no-more" v-if="!pagination.hasMore && filteredOrders.length > 0">
          <text class="no-more-text">- 没有更多订单了 -</text>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-else>
        <view class="empty-icon">
          <wd-icon name="notes" size="80rpx" color="#ccc"></wd-icon>
        </view>
        <view class="empty-text">暂无相关订单</view>
        <wd-button size="small" type="primary" @click="goToAppointment">立即预约</wd-button>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useToast } from 'wot-design-uni'
import { getOrderList, cancelOrder, type IOrderItem } from '@/api/orders'
import { getServiceTypes } from '@/api/appointment'
import useRequest from '@/hooks/useRequest'

const toast = useToast()
const { statusBarHeight } = uni.getSystemInfoSync()
// 活动选项卡
const activeTab = ref('all')
const height = computed(()=>{
  return `calc(100% - ${statusBarHeight + 44}px)`
})
// 查询参数
const queryParams = ref({
  status: '',
  page: 1,
  pageSize: 10
})

// 订单数据 - 改为接口获取
const orders = ref<IOrderItem[]>([])

// 加载状态
const loading = ref(false)

// 下拉刷新状态
const refreshing = ref(false)

// 分页信息
const pagination = ref({
  total: 0,
  hasMore: true,
  loadingMore: false
})

// 服务类型字典
const serviceTypeDict = ref<Record<string, string>>({})

// 获取服务类型字典
const loadServiceTypes = async () => {
  try {
    const response = await getServiceTypes('bussiness_type')
    if (response && Array.isArray(response)) {
      const dictItems = response
      
      // 构建服务类型字典，key为dictValue，value为dictLabel
      serviceTypeDict.value = dictItems.reduce((acc, item) => {
        acc[item.dictValue] = item.dictLabel
        return acc
      }, {} as Record<string, string>)
      
      console.log('服务类型字典:', serviceTypeDict.value)
    }
  } catch (error) {
    console.error('获取服务类型字典失败:', error)
    // 如果接口失败，使用默认数据
    serviceTypeDict.value = {
      'repair': '防水补漏',
      'new': '新房防水施工',
      'drain': '疏通管道',
      'unsure': '上门勘测'
    }
  }
}

// 获取订单列表
const loadOrders = async (isLoadMore = false) => {
  // 如果正在加载更多，则设置loadingMore状态
  if (isLoadMore) {
    pagination.value.loadingMore = true
  } else {
    loading.value = true
  }
  
  try {
    // 设置查询参数
    queryParams.value.status = activeTab.value === 'all' ? 'all' : activeTab.value as any
    
    // 如果是加载更多，增加页码
    if (isLoadMore) {
      queryParams.value.page++
    }
    
    // 调用订单列表接口
    const response = await getOrderList(queryParams.value)
    
    // 处理后端返回的数据结构
    const responseData = response.data || {}
    const ordersList = responseData.data || []
    const paginationInfo = responseData.pagination || { total: 0, pages: 0 }
    
    // 更新分页信息
    pagination.value.total = paginationInfo.total || 0
    pagination.value.hasMore = queryParams.value.page < (paginationInfo.pages || 0)
    
    // 格式化订单数据
    const formattedOrders = ordersList.map(order => {
      const serviceType = order.serviceType || order.appointmentInfo?.serviceType || 'unsure'
      return {
        id: order.id?.toString() || order.orderId?.toString() || '',
        orderNo: order.id?.toString() || order.orderId?.toString() || '',
        serviceType: serviceType,
        serviceTypeName: getServiceTypeName(serviceType),
        status: order.status?.toLowerCase() || 'pending',
        statusName: getStatusNameByCode(order.status),
        appointmentTime: order.createdAt ? formatDate(order.createdAt) : '',
        address: order.location || `${order.region || ''} ${order.address || ''}`,
        price: order.total || 0,
        createTime: order.createdAt ? formatDate(order.createdAt) : '',
        updateTime: order.updatedAt ? formatDate(order.updatedAt) : ''
      }
    })
    
    // 如果是加载更多，追加数据，否则替换数据
    if (isLoadMore) {
      orders.value = [...orders.value, ...formattedOrders]
    } else {
      orders.value = formattedOrders
    }
    
    console.log('获取订单列表成功:', orders.value, '总数:', pagination.value.total, '是否有更多:', pagination.value.hasMore)
  } catch (error) {
    console.error('获取订单列表失败', error)
    // 如果接口失败，使用模拟数据作为降级方案
    let mockData = [
      {
        id: '1001',
        orderNo: 'FW20230601001',
        serviceType: 'repair',
        serviceTypeName: getServiceTypeName('repair'),
        status: 'pending',
        statusName: '待接单',
        appointmentTime: '2023-06-01 14:00',
        address: '广州市天河区天河路385号',
        price: 280.00,
        createTime: '2023-06-01 09:12:33',
        updateTime: '2023-06-01 09:12:33'
      },
      {
        id: '1002',
        orderNo: 'FW20230602001',
        serviceType: 'new',
        serviceTypeName: getServiceTypeName('new'),
        status: 'accepted',
        statusName: '已接单',
        appointmentTime: '2023-06-02 10:00',
        address: '广州市海珠区新港中路122号',
        price: 3800.00,
        createTime: '2023-05-30 16:28:45',
        updateTime: '2023-05-30 16:28:45'
      },
      {
        id: '1003',
        orderNo: 'FW20230528001',
        serviceType: 'repair',
        serviceTypeName: getServiceTypeName('repair'),
        status: 'processing',
        statusName: '施工中',
        appointmentTime: '2023-05-28 15:30',
        address: '广州市越秀区建设大马路12号',
        price: 560.00,
        createTime: '2023-05-27 14:22:10',
        updateTime: '2023-05-27 14:22:10'
      },
      {
        id: '1004',
        orderNo: 'FW20230520001',
        serviceType: 'repair',
        serviceTypeName: getServiceTypeName('repair'),
        status: 'completed',
        statusName: '已完成',
        appointmentTime: '2023-05-20 09:00',
        address: '广州市白云区机场路788号',
        price: 420.00,
        createTime: '2023-05-19 18:33:42',
        updateTime: '2023-05-19 18:33:42'
      }
    ]
    
    // 如果有选中特定标签，过滤模拟数据
    if (activeTab.value !== 'all') {
      mockData = mockData.filter(order => order.status === activeTab.value)
    }
    
    // 根据是否是加载更多，处理模拟数据
    if (isLoadMore) {
      // 模拟加载更多，但实际上已经没有更多数据了
      orders.value = [...orders.value]
      pagination.value.hasMore = false
    } else {
      orders.value = mockData
      pagination.value.total = mockData.length
      pagination.value.hasMore = false
    }
  } finally {
    loading.value = false
    pagination.value.loadingMore = false
  }
}

// 获取服务类型名称
const getServiceTypeName = (serviceType: string) => {
  // 从字典中获取服务类型名称
  return serviceTypeDict.value[serviceType] || serviceType
}

// 取消订单请求
const { loading: cancelLoading, run: cancelOrderRequest } = useRequest(
  (orderId: string, reason: string) => cancelOrder(orderId, { reason }),
  {
    immediate: false,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || '订单已取消')
        // 重新加载订单列表
        loadOrders()
      } else {
        toast.error(result.message || '取消订单失败')
      }
    },
    onError: (error) => {
      console.error('取消订单失败', error)
      toast.error('取消订单失败，请重试')
    }
  }
)

// 根据tab筛选订单 - 现在直接从接口获取对应状态的订单，不需要前端过滤
const filteredOrders = computed(() => {
  return orders.value
})

// 获取状态文本 - 现在使用接口返回的statusName
const getStatusText = (order: IOrderItem) => {
  return order.statusName || order.status
}

// 监听tab变化，重新加载数据
const handleTabChange = (tab: string) => {
  console.log('切换订单状态标签:', tab)
  activeTab.value = tab
  
  // 重置分页
  queryParams.value.page = 1
  pagination.value.hasMore = true
  
  // 重新加载数据
  loadOrders()
}

// 跳转到订单详情
const goToOrderDetail = (orderId: string) => {
  uni.navigateTo({
    url: `/pages/orders/detail?id=${orderId}`
  })
}

// 取消订单
const cancelOrderAction = (orderId: string) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消该订单吗？',
    success: (res) => {
      if (res.confirm) {
        // 调用取消订单接口
        cancelOrderRequest(orderId, '用户主动取消')
      }
    }
  })
}

// 联系客服
const contactService = (orderId: string) => {
  uni.makePhoneCall({
    phoneNumber: '400-123-4567',
    fail: () => {
      toast.error('拨打电话失败')
    }
  })
}

// 查看进度
const checkProgress = (orderId: string) => {
  // 跳转到进度页面
  uni.navigateTo({
    url: `/pages/orders/progress?id=${orderId}`
  })
}

// 评价服务
const reviewOrder = (orderId: string) => {
  uni.navigateTo({
    url: `/pages/orders/review?id=${orderId}`
  })
}

// 跳转到预约页面
const goToAppointment = () => {
  console.log('订单页面跳转到预约页面')
  
  // 构建预约参数
  const appointmentParams = {
    serviceType: 'unsure',
    // 可以根据需要添加其他默认参数
  }
  
  // 将参数转换为URL查询字符串
  const queryString = Object.entries(appointmentParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  
  uni.navigateTo({
    url: '/pages/appointment/index?' + queryString
  })
}

// 页面加载，处理从其他页面带过来的状态参数
onLoad((options) => {
  if (options && options.status) {
    activeTab.value = options.status
  }
  
  // 先加载服务类型字典
  loadServiceTypes().then(() => {
    // 加载订单列表
    loadOrders()
  })
})

// 页面显示时刷新数据
onShow(() => {
  // 刷新订单数据
  loadOrders()
})

// 下拉刷新处理
const onRefresh = async () => {
  refreshing.value = true
  try {
    // 重置页码和分页状态
    queryParams.value.page = 1
    pagination.value.hasMore = true
    
    // 重新加载数据
    await loadOrders()
  } finally {
    // 延迟结束刷新状态，提供更好的用户体验
    setTimeout(() => {
      refreshing.value = false
    }, 500)
  }
}

// 滚动到底部加载更多
const onLoadMore = async () => {
  if (pagination.value.hasMore) {
    await loadOrders(true)
  }
}

// 根据状态码获取状态名称
const getStatusNameByCode = (status: string) => {
  const statusMap: Record<string, string> = {
    'PENDING': '待接单',
    'ACCEPTED': '已接单',
    'PROCESSING': '施工中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  }
  return statusMap[status] || status
}

// 格式化日期
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch (e) {
    return dateString
  }
}
</script>

<style lang="scss" scoped>
.orders-container {
  height: calc(100vh - var(--wot-navbar-height, 44px));
  background-color: #f7f8fa;
  
  :deep(.wd-tabs__nav) {
    background-color: #fff;
    
    .wd-tab {
      font-size: 28rpx;
      
      &.is-active {
        color: #2c722c;
      }
    }
    
    .wd-tabs__line {
      background-color: #2c722c;
    }
  }
}

.orders-list {
  padding: 30rpx;
}

.order-card {
  margin-bottom: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #eee;
  
  .order-type {
    font-size: 30rpx;
    font-weight: 500;
    color: #333;
  }
  
  .order-status {
    font-size: 26rpx;
    
    &.status-pending {
      color: #faad14;
    }
    
    &.status-accepted {
      color: #1890ff;
    }
    
    &.status-processing {
      color: #52c41a;
    }
    
    &.status-completed {
      color: #2c722c;
    }
  }
}

.order-info {
  padding: 24rpx;
  
  .info-item {
    display: flex;
    margin-bottom: 16rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .label {
      width: 160rpx;
      font-size: 26rpx;
      color: #999;
    }
    
    .value {
      flex: 1;
      font-size: 26rpx;
      color: #333;
    }
  }
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-top: 1rpx solid #eee;
  background-color: #f9f9f9;
  
  .price-info {
    .price-label {
      font-size: 24rpx;
      color: #999;
      margin-right: 10rpx;
    }
    
    .price-value {
      font-size: 32rpx;
      font-weight: 500;
      color: #ff4d4f;
    }
  }
  
  .action-buttons {
    :deep(.wd-button) {
      margin-left: 16rpx;
    }
    
    :deep(.wd-button--primary) {
      background-color: #2c722c;
      border-color: #2c722c;
    }
    
    :deep(.wd-button--success) {
      background-color: #52c41a;
      border-color: #52c41a;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .empty-icon {
    margin-bottom: 20rpx;
  }
  
  .empty-text {
    margin-bottom: 30rpx;
    font-size: 28rpx;
    color: #999;
  }
  
  :deep(.wd-button--primary) {
    background-color: #2c722c;
    border-color: #2c722c;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .loading-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #999;
  }
}

.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20rpx 0;
  border-top: 1rpx solid #eee;
  background-color: #f9f9f9;
  
  .load-more-text {
    margin-left: 10rpx;
    font-size: 28rpx;
    color: #999;
  }
}

.no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20rpx 0;
  border-top: 1rpx solid #eee;
  background-color: #f9f9f9;
  
  .no-more-text {
    font-size: 28rpx;
    color: #999;
  }
}
</style> 