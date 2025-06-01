<route lang="json5">
{
  style: {
    navigationBarTitleText: '订单详情',
  },
}
</route>

<template>
  <view class="order-detail-container">
    <!-- 订单状态卡片 -->
    <view class="status-card">
      <view class="status-header" :class="'bg-' + orderDetail.status">
        <view class="status-text">{{ getStatusText(orderDetail.status) }}</view>
        <view class="status-desc">{{ getStatusDesc(orderDetail.status) }}</view>
      </view>
      
      <!-- 订单进度条 -->
      <view class="progress-steps">
        <view 
          class="step-item" 
          v-for="(step, index) in progressSteps" 
          :key="index"
          :class="{ 'active': isStepActive(step.status), 'current': isCurrentStep(step.status) }"
        >
          <view class="step-icon">
            <wd-icon :name="step.icon" size="36rpx" custom-class="icon"></wd-icon>
          </view>
          <view class="step-content">
            <view class="step-name">{{ step.name }}</view>
            <view class="step-time" v-if="step.time">{{ step.time }}</view>
          </view>
          <view class="step-line" v-if="index < progressSteps.length - 1"></view>
        </view>
      </view>
    </view>
    
    <!-- 订单信息卡片 -->
    <view class="info-card">
      <view class="card-title">
        <wd-icon name="notes" size="32rpx" color="#2c722c"></wd-icon>
        <text>订单信息</text>
      </view>
      
      <view class="info-list">
        <view class="info-item">
          <text class="label">订单编号</text>
          <text class="value">{{ orderDetail.orderNo }}</text>
        </view>
        <view class="info-item">
          <text class="label">服务类型</text>
          <text class="value">{{ orderDetail.serviceType === 'repair' ? '防水补漏' : '新房防水施工' }}</text>
        </view>
        <view class="info-item">
          <text class="label">预约时间</text>
          <text class="value">{{ orderDetail.appointmentTime }}</text>
        </view>
        <view class="info-item">
          <text class="label">下单时间</text>
          <text class="value">{{ orderDetail.createTime }}</text>
        </view>
        <view class="info-item">
          <text class="label">支付方式</text>
          <text class="value">{{ orderDetail.paymentMethod }}</text>
        </view>
        <view class="info-item">
          <text class="label">订单金额</text>
          <text class="value price">¥ {{ orderDetail.price.toFixed(2) }}</text>
        </view>
      </view>
    </view>
    
    <!-- 联系人信息 -->
    <view class="info-card">
      <view class="card-title">
        <wd-icon name="user" size="32rpx" color="#2c722c"></wd-icon>
        <text>联系人信息</text>
      </view>
      
      <view class="info-list">
        <view class="info-item">
          <text class="label">联系人</text>
          <text class="value">{{ orderDetail.contactName }}</text>
        </view>
        <view class="info-item">
          <text class="label">联系电话</text>
          <text class="value">{{ orderDetail.contactPhone }}</text>
          <view class="action-icon" @click="makePhoneCall(orderDetail.contactPhone)">
            <wd-icon name="phone" size="36rpx" color="#2c722c"></wd-icon>
          </view>
        </view>
        <view class="info-item">
          <text class="label">服务地址</text>
          <text class="value">{{ orderDetail.address }}</text>
        </view>
      </view>
    </view>
    
    <!-- 服务工程师信息 -->
    <view class="info-card" v-if="orderDetail.status !== 'pending'">
      <view class="card-title">
        <wd-icon name="person" size="32rpx" color="#2c722c"></wd-icon>
        <text>服务工程师</text>
      </view>
      
      <view class="engineer-info">
        <view class="engineer-avatar">
          <wd-img src="/static/images/engineer.png" width="120rpx" height="120rpx" radius="50%"></wd-img>
        </view>
        <view class="engineer-details">
          <view class="engineer-name">{{ orderDetail.engineer.name }}</view>
          <view class="engineer-id">工号: {{ orderDetail.engineer.id }}</view>
          <view class="engineer-star">
            <wd-icon name="star-fill" size="24rpx" color="#faad14" v-for="i in 5" :key="i"></wd-icon>
            <text class="rating">{{ orderDetail.engineer.rating }}</text>
          </view>
        </view>
        <view class="engineer-contact" @click="makePhoneCall(orderDetail.engineer.phone)">
          <wd-icon name="phone" size="40rpx" color="#2c722c"></wd-icon>
        </view>
      </view>
    </view>
    
    <!-- 订单问题描述 -->
    <view class="info-card">
      <view class="card-title">
        <wd-icon name="warning" size="32rpx" color="#2c722c"></wd-icon>
        <text>问题描述</text>
      </view>
      
      <view class="description-box">
        {{ orderDetail.description }}
      </view>
    </view>
    
    <!-- 底部操作按钮 -->
    <view class="bottom-actions">
      <template v-if="orderDetail.status === 'pending'">
        <wd-button type="info" @click="contactCustomerService">联系客服</wd-button>
        <wd-button type="danger" @click="cancelOrder">取消订单</wd-button>
      </template>
      
      <template v-if="orderDetail.status === 'accepted'">
        <wd-button type="info" @click="contactCustomerService">联系客服</wd-button>
        <wd-button type="primary" @click="checkEngineerLocation">查看位置</wd-button>
      </template>
      
      <template v-if="orderDetail.status === 'processing'">
        <wd-button type="info" @click="contactCustomerService">联系客服</wd-button>
        <wd-button type="primary" @click="checkProgress">查看进度</wd-button>
      </template>
      
      <template v-if="orderDetail.status === 'completed'">
        <wd-button type="info" @click="contactCustomerService">联系客服</wd-button>
        <wd-button type="success" @click="reviewOrder">评价服务</wd-button>
      </template>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useToast } from 'wot-design-uni'

const toast = useToast()

// 订单ID
const orderId = ref('')

// 模拟订单详情数据
const orderDetail = ref({
  id: '1001',
  orderNo: 'FW20230601001',
  serviceType: 'repair',
  status: 'processing',
  appointmentTime: '2023-06-01 14:00',
  address: '广州市天河区天河路385号',
  price: 280.00,
  createTime: '2023-06-01 09:12:33',
  contactName: '张先生',
  contactPhone: '13800138000',
  paymentMethod: '微信支付',
  description: '卫生间墙角渗水，大约有50cm x 30cm的面积受潮发霉，需要专业防水处理。',
  engineer: {
    name: '李工程师',
    id: 'ENG10086',
    phone: '13900139000',
    rating: 4.9
  },
  statusHistory: [
    { status: 'pending', time: '2023-06-01 09:12:33' },
    { status: 'accepted', time: '2023-06-01 10:25:45' },
    { status: 'processing', time: '2023-06-01 14:05:22' },
    { status: 'completed', time: '' }
  ]
})

// 进度步骤
const progressSteps = ref([
  { name: '已下单', status: 'pending', icon: 'notes', time: orderDetail.value.statusHistory[0]?.time || '' },
  { name: '已接单', status: 'accepted', icon: 'check-circle', time: orderDetail.value.statusHistory[1]?.time || '' },
  { name: '施工中', status: 'processing', icon: 'brush', time: orderDetail.value.statusHistory[2]?.time || '' },
  { name: '已完成', status: 'completed', icon: 'check', time: orderDetail.value.statusHistory[3]?.time || '' }
])

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

// 获取状态描述
const getStatusDesc = (status: string) => {
  const descMap: Record<string, string> = {
    'pending': '您的订单已提交，正在等待工程师接单',
    'accepted': '工程师已接单，将按约定时间上门',
    'processing': '工程师正在为您进行施工，请耐心等待',
    'completed': '服务已完成，感谢您的信任'
  }
  return descMap[status] || ''
}

// 判断步骤是否激活
const isStepActive = (stepStatus: string) => {
  const statusOrder = ['pending', 'accepted', 'processing', 'completed']
  const currentIndex = statusOrder.indexOf(orderDetail.value.status)
  const stepIndex = statusOrder.indexOf(stepStatus)
  
  return stepIndex <= currentIndex
}

// 判断是否当前步骤
const isCurrentStep = (stepStatus: string) => {
  return stepStatus === orderDetail.value.status
}

// 拨打电话
const makePhoneCall = (phoneNumber: string) => {
  uni.makePhoneCall({
    phoneNumber,
    fail: () => {
      toast.error('拨打电话失败')
    }
  })
}

// 联系客服
const contactCustomerService = () => {
  uni.makePhoneCall({
    phoneNumber: '400-123-4567',
    fail: () => {
      toast.error('拨打电话失败')
    }
  })
}

// 取消订单
const cancelOrder = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消该订单吗？',
    success: (res) => {
      if (res.confirm) {
        toast.success('订单已取消')
        // 返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    }
  })
}

// 查看工程师位置
const checkEngineerLocation = () => {
  toast.success('功能开发中')
}

// 查看进度
const checkProgress = () => {
  uni.navigateTo({
    url: `/pages/orders/progress?id=${orderDetail.value.id}`
  })
}

// 评价服务
const reviewOrder = () => {
  uni.navigateTo({
    url: `/pages/orders/review?id=${orderDetail.value.id}`
  })
}

// 页面加载
onLoad((options) => {
  if (options.id) {
    orderId.value = options.id
    // 实际项目中应该根据ID从API获取详情
    console.log('加载订单详情，ID:', orderId.value)
  }
})
</script>

<style lang="scss" scoped>
.order-detail-container {
  min-height: 100vh;
  padding: 30rpx;
  background-color: #f7f8fa;
}

.status-card {
  margin-bottom: 30rpx;
  overflow: hidden;
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.status-header {
  padding: 40rpx 30rpx;
  color: #fff;
  
  &.bg-pending {
    background: linear-gradient(135deg, #ff9500, #faad14);
  }
  
  &.bg-accepted {
    background: linear-gradient(135deg, #1890ff, #40a9ff);
  }
  
  &.bg-processing {
    background: linear-gradient(135deg, #52c41a, #73d13d);
  }
  
  &.bg-completed {
    background: linear-gradient(135deg, #2c722c, #52c41a);
  }
  
  .status-text {
    margin-bottom: 10rpx;
    font-size: 36rpx;
    font-weight: 500;
  }
  
  .status-desc {
    font-size: 28rpx;
    opacity: 0.9;
  }
}

.progress-steps {
  display: flex;
  padding: 40rpx 20rpx;
  
  .step-item {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    
    .step-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60rpx;
      height: 60rpx;
      margin-bottom: 16rpx;
      background-color: #f0f0f0;
      border-radius: 50%;
      z-index: 2;
      
      .icon {
        color: #999;
      }
    }
    
    .step-content {
      text-align: center;
      
      .step-name {
        margin-bottom: 6rpx;
        font-size: 24rpx;
        color: #999;
      }
      
      .step-time {
        font-size: 20rpx;
        color: #999;
      }
    }
    
    .step-line {
      position: absolute;
      top: 30rpx;
      right: -50%;
      width: 100%;
      height: 2rpx;
      background-color: #f0f0f0;
      z-index: 1;
    }
    
    &.active {
      .step-icon {
        background-color: rgba(44, 114, 44, 0.1);
        
        .icon {
          color: #2c722c;
        }
      }
      
      .step-content {
        .step-name {
          color: #333;
        }
        
        .step-time {
          color: #666;
        }
      }
      
      .step-line {
        background-color: #2c722c;
      }
    }
    
    &.current {
      .step-icon {
        background-color: #2c722c;
        
        .icon {
          color: #fff;
        }
      }
    }
  }
}

.info-card {
  margin-bottom: 30rpx;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  text {
    margin-left: 12rpx;
    font-size: 30rpx;
    font-weight: 500;
    color: #333;
  }
}

.info-list {
  .info-item {
    position: relative;
    display: flex;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .label {
      width: 140rpx;
      font-size: 26rpx;
      color: #999;
    }
    
    .value {
      flex: 1;
      font-size: 26rpx;
      color: #333;
      
      &.price {
        color: #ff4d4f;
        font-weight: 500;
      }
    }
    
    .action-icon {
      padding: 0 10rpx;
    }
  }
}

.engineer-info {
  display: flex;
  align-items: center;
  
  .engineer-avatar {
    margin-right: 30rpx;
  }
  
  .engineer-details {
    flex: 1;
    
    .engineer-name {
      margin-bottom: 8rpx;
      font-size: 30rpx;
      font-weight: 500;
      color: #333;
    }
    
    .engineer-id {
      margin-bottom: 8rpx;
      font-size: 24rpx;
      color: #999;
    }
    
    .engineer-star {
      display: flex;
      align-items: center;
      
      .rating {
        margin-left: 10rpx;
        font-size: 24rpx;
        color: #faad14;
      }
    }
  }
  
  .engineer-contact {
    padding: 16rpx;
  }
}

.description-box {
  padding: 20rpx;
  font-size: 26rpx;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8rpx;
  line-height: 1.6;
}

.bottom-actions {
  display: flex;
  justify-content: space-between;
  padding: 30rpx 0 60rpx;
  
  :deep(.wd-button) {
    flex: 1;
    margin: 0 10rpx;
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
</style> 