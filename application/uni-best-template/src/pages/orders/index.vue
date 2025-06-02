<route lang="json5">
{
  style: {
    navigationBarTitleText: '我的订单',
    navigationStyle:'custom'
  },
}
</route>

<template>
  <view class="orders-container">
    <!-- 订单状态选项卡 -->
    <wd-tabs v-model="activeTab" sticky offset-top="44px">
      <wd-tab title="全部订单" name="all"></wd-tab>
      <wd-tab title="待接单" name="pending"></wd-tab>
      <wd-tab title="已接单" name="accepted"></wd-tab>
      <wd-tab title="施工中" name="processing"></wd-tab>
      <wd-tab title="已完成" name="completed"></wd-tab>
    </wd-tabs>
    
    <!-- 订单列表 -->
    <view class="orders-list" v-if="filteredOrders.length > 0">
      <view 
        class="order-card" 
        v-for="(order, index) in filteredOrders" 
        :key="index"
        @click="goToOrderDetail(order.id)"
      >
        <view class="order-header">
          <view class="order-type">{{ order.serviceType === 'repair' ? '防水补漏' : '新房防水施工' }}</view>
          <view class="order-status" :class="'status-' + order.status">{{ getStatusText(order.status) }}</view>
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
              <wd-button size="small" @click.stop="cancelOrder(order.id)">取消订单</wd-button>
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
    </view>
    
    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <view class="empty-icon">
        <wd-icon name="notes" size="80rpx" color="#ccc"></wd-icon>
      </view>
      <view class="empty-text">暂无相关订单</view>
      <wd-button size="small" type="primary" @click="goToAppointment">立即预约</wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useToast } from 'wot-design-uni'

const toast = useToast()

// 活动选项卡
const activeTab = ref('all')

// 模拟订单数据
const orders = ref([
  {
    id: '1001',
    orderNo: 'FW20230601001',
    serviceType: 'repair',
    status: 'pending',
    appointmentTime: '2023-06-01 14:00',
    address: '广州市天河区天河路385号',
    price: 280.00,
    createTime: '2023-06-01 09:12:33'
  },
  {
    id: '1002',
    orderNo: 'FW20230602001',
    serviceType: 'new',
    status: 'accepted',
    appointmentTime: '2023-06-02 10:00',
    address: '广州市海珠区新港中路122号',
    price: 3800.00,
    createTime: '2023-05-30 16:28:45'
  },
  {
    id: '1003',
    orderNo: 'FW20230528001',
    serviceType: 'repair',
    status: 'processing',
    appointmentTime: '2023-05-28 15:30',
    address: '广州市越秀区建设大马路12号',
    price: 560.00,
    createTime: '2023-05-27 14:22:10'
  },
  {
    id: '1004',
    orderNo: 'FW20230520001',
    serviceType: 'repair',
    status: 'completed',
    appointmentTime: '2023-05-20 09:00',
    address: '广州市白云区机场路788号',
    price: 420.00,
    createTime: '2023-05-19 18:33:42'
  }
])

// 根据tab筛选订单
const filteredOrders = computed(() => {
  if (activeTab.value === 'all') {
    return orders.value
  } else {
    return orders.value.filter(order => order.status === activeTab.value)
  }
})

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '待接单',
    'accepted': '已接单',
    'processing': '施工中',
    'completed': '已完成'
  }
  return statusMap[status] || status
}

// 跳转到订单详情
const goToOrderDetail = (orderId: string) => {
  uni.navigateTo({
    url: `/pages/orders/detail?id=${orderId}`
  })
}

// 取消订单
const cancelOrder = (orderId: string) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消该订单吗？',
    success: (res) => {
      if (res.confirm) {
        // 模拟取消订单操作
        toast.success('订单已取消')
        // 更新订单状态
        const orderIndex = orders.value.findIndex(o => o.id === orderId)
        if (orderIndex !== -1) {
          // 实际项目中应该调用API
          orders.value.splice(orderIndex, 1)
        }
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
  if (options.status) {
    activeTab.value = options.status
  }
})
</script>

<style lang="scss" scoped>
.orders-container {
  min-height: 100vh;
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
</style> 