<route lang="json5">
{
  style: {
    navigationBarTitleText: '订单详情',
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <view class="order-detail-container">
    <!-- MessageBox 组件 -->
    <wd-message-box></wd-message-box>

    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <wd-loading color="#2c722c" />
      <text>加载中...</text>
    </view>

    <!-- 错误提示 -->
    <view class="error-container" v-else-if="error">
      <wd-icon name="warning-fill" size="80rpx" color="#fa4350"></wd-icon>
      <text>{{ errorMessage }}</text>
      <wd-button type="primary" size="small" @click="fetchOrderDetail">重新加载</wd-button>
    </view>

    <!-- 订单详情内容 -->
    <template v-else>
      <!-- 订单状态卡片 -->
      <view class="status-card">
        <view class="status-header" :class="'bg-' + orderDetail.status">
          <view class="status-text">{{ orderDetail.statusName }}</view>
          <view class="status-desc">{{ getStatusDesc(orderDetail.status) }}</view>
        </view>

        <!-- 使用 wd-steps 组件替换原来的自定义进度条 -->
        <view class="progress-steps-container">
          <wd-steps :active="getActiveStep(orderDetail.status)" align-center>
            <wd-step title="待接单" description="订单已提交" />
            <wd-step title="已接单" description="工程师已接单" />
            <wd-step title="施工中" description="正在为您施工" />
            <wd-step title="已完成" description="服务已完成" />
          </wd-steps>
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
            <text class="value">
              {{ orderDetail.serviceType === 'repair' ? '防水补漏' : '新房防水施工' }}
            </text>
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
            <wd-img
              src="/static/images/engineer.png"
              width="120rpx"
              height="120rpx"
              radius="50%"
            ></wd-img>
          </view>
          <view class="engineer-details">
            <view class="engineer-name">{{ orderDetail.engineer.name }}</view>
            <view class="engineer-id">工号: {{ orderDetail.engineer.id }}</view>
            <view class="engineer-star">
              <wd-icon
                name="star-fill"
                size="24rpx"
                color="#faad14"
                v-for="i in 5"
                :key="i"
              ></wd-icon>
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
          <view
            v-for="(line, index) in orderDetail.description.split('\n')"
            :key="index"
            class="description-line"
          >
            {{ line }}
          </view>
        </view>
      </view>

      <!-- 底部操作按钮 -->
      <view class="bottom-actions">
        <template v-if="orderDetail.status === 'pending'">
          <wd-button type="info" @click="handleButtonClick($event, 'contact')">联系客服</wd-button>
          <wd-button type="danger" @click="handleButtonClick($event, 'cancel')">取消订单</wd-button>
        </template>

        <template v-if="orderDetail.status === 'accepted'">
          <wd-button type="info" @click="handleButtonClick($event, 'contact')">联系客服</wd-button>
          <wd-button type="primary" @click="handleButtonClick($event, 'location')">
            查看位置
          </wd-button>
        </template>

        <template v-if="orderDetail.status === 'processing'">
          <wd-button type="info" @click="handleButtonClick($event, 'contact')">联系客服</wd-button>
          <wd-button type="primary" @click="handleButtonClick($event, 'progress')">
            查看进度
          </wd-button>
        </template>

        <template v-if="orderDetail.status === 'completed'">
          <wd-button type="info" @click="handleButtonClick($event, 'contact')">联系客服</wd-button>
          <wd-button type="success" @click="handleButtonClick($event, 'review')">
            评价服务
          </wd-button>
        </template>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useToast, useMessage } from 'wot-design-uni'
import { getOrderDetail, cancelOrder, type IOrderDetail } from '@/api/orders'
import {
  getServiceTypeName as getServiceTypeNameUtil,
  formatProblemDescription,
} from '@/utils/problemTypes'

// API返回的订单详情类型
interface ApiOrderDetail {
  orderId?: number
  total?: number
  status?: string
  createdAt?: string
  userId?: number
  appointmentId?: number
  appointmentInfo?: {
    name?: string
    phone?: string
    region?: string
    address?: string
    latitude?: number
    longitude?: number
    location?: string
    imageUrls?: string[]
    sceneType?: string[]
    description?: string
    serviceType?: string
  }
  paymentStatus?: string
  buyerAddress?: string
  items?: any[]
  engineerInfo?: {
    name?: string
    id?: string
    phone?: string
    rating?: number
  }
}

const toast = useToast()
const message = useMessage()

// 订单ID
const orderId = ref('')

// 加载状态
const loading = ref(false)
const error = ref(false)
const errorMessage = ref('加载失败，请重试')

// 取消订单相关
const cancelReason = ref('')
const cancelLoading = ref(false)

// 订单详情数据
const orderDetail = ref<IOrderDetail>({
  id: '',
  orderNo: '',
  serviceType: '',
  serviceTypeName: '',
  status: 'pending',
  statusName: '',
  appointmentTime: '',
  address: '',
  price: 0,
  createTime: '',
  contactName: '',
  contactPhone: '',
  paymentMethod: '',
  description: '',
  statusHistory: [],
})

// 格式化日期
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch (e) {
    return dateString
  }
}

// 获取服务类型名称 - 使用统一的工具函数
const getServiceTypeName = (type: string) => {
  return getServiceTypeNameUtil(type)
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待接单',
    accepted: '已接单',
    processing: '施工中',
    completed: '已完成',
  }
  return statusMap[status] || status
}

// 获取状态描述
const getStatusDesc = (status: string) => {
  const descMap: Record<string, string> = {
    pending: '您的订单已提交，正在等待工程师接单',
    accepted: '工程师已接单，将按约定时间上门',
    processing: '工程师正在为您进行施工，请耐心等待',
    completed: '服务已完成，感谢您的信任',
  }
  return descMap[status] || ''
}

// 获取当前活动步骤索引
const getActiveStep = (status: string) => {
  const statusOrder = ['pending', 'accepted', 'processing', 'completed']
  return statusOrder.indexOf(status)
}

// 拨打电话
const makePhoneCall = (phoneNumber: string) => {
  uni.makePhoneCall({
    phoneNumber,
    fail: () => {
      toast.error('拨打电话失败')
    },
  })
}

// 联系客服
const contactCustomerService = () => {
  uni.makePhoneCall({
    phoneNumber: '400-998-0618',
    fail: () => {
      toast.error('拨打电话失败')
    },
  })
}

// 显示取消订单弹窗
const showCancelDialog = () => {
  message
    .prompt({
      title: '取消订单',
      msg: '请输入取消原因',
      inputValue: cancelReason.value,
      inputPlaceholder: '请输入取消原因',
      confirmButtonText: '确认取消',
      cancelButtonText: '再想想',
    })
    .then(({ value }) => {
      // 用户点击确定
      cancelReason.value = String(value || '用户取消')
      handleCancelOrder()
    })
    .catch(() => {
      // 用户点击取消，不做任何操作
    })
}

// 处理取消订单
const handleCancelOrder = async () => {
  if (!cancelReason.value.trim()) {
    toast.error('请输入取消原因')
    return
  }

  cancelLoading.value = true
  try {
    const res = await cancelOrder(orderId.value, { reason: cancelReason.value })
    if (res.code === 0 || res.code === 200) {
      toast.success('订单已取消')
      // 刷新订单详情
      fetchOrderDetail()
    } else {
      toast.error(res.msg || '取消订单失败')
    }
  } catch (err) {
    toast.error('取消订单失败，请重试')
    console.error('取消订单失败:', err)
  } finally {
    cancelLoading.value = false
  }
}

// 查看工程师位置
const checkEngineerLocation = () => {
  toast.success('功能开发中')
}

// 查看进度
const checkProgress = () => {
  uni.navigateTo({
    url: `/pages/orders/progress?id=${orderDetail.value.id}`,
  })
}

// 评价服务
const reviewOrder = () => {
  uni.navigateTo({
    url: `/pages/orders/review?id=${orderDetail.value.id}`,
  })
}

// 处理按钮点击，统一处理事件
const handleButtonClick = (event: Event, action: string) => {
  // 阻止事件冒泡和默认行为
  event.stopPropagation()
  event.preventDefault()

  // 根据action类型调用对应的处理函数
  switch (action) {
    case 'contact':
      contactCustomerService()
      break
    case 'cancel':
      showCancelDialog()
      break
    case 'location':
      checkEngineerLocation()
      break
    case 'progress':
      checkProgress()
      break
    case 'review':
      reviewOrder()
      break
  }
}

// 获取订单详情
const fetchOrderDetail = async () => {
  if (!orderId.value) return

  loading.value = true
  error.value = false

  try {
    const res = await getOrderDetail(orderId.value)
    if (res.code === 0 || res.code === 200) {
      // 处理接口返回的数据
      const apiData = (res.data as ApiOrderDetail) || ({} as ApiOrderDetail)
      const appointmentInfo = apiData.appointmentInfo || ({} as ApiOrderDetail['appointmentInfo'])

      // 格式化订单详情数据
      orderDetail.value = {
        id: apiData.orderId?.toString() || '',
        orderNo: apiData.orderId?.toString() || '',
        serviceType: appointmentInfo.serviceType || 'repair',
        serviceTypeName: getServiceTypeName(appointmentInfo.serviceType || 'repair'),
        status: apiData.status?.toLowerCase() || 'pending',
        statusName: getStatusText(apiData.status?.toLowerCase() || 'pending'),
        appointmentTime: formatDate(apiData.createdAt || ''),
        address: appointmentInfo.address
          ? `${appointmentInfo.region || ''} ${appointmentInfo.address}`
          : '',
        price: apiData.total || 0,
        createTime: formatDate(apiData.createdAt || ''),
        contactName: appointmentInfo.name || '',
        contactPhone: appointmentInfo.phone || '',
        paymentMethod: apiData.paymentStatus === 'PAID' ? '已支付' : '未支付',
        description: formatProblemDescription(
          appointmentInfo.serviceType || 'repair',
          appointmentInfo.sceneType || [],
          appointmentInfo.description,
        ),
        // 如果有工程师信息，则添加
        ...(apiData.engineerInfo
          ? {
              engineer: {
                name: apiData.engineerInfo.name || '未分配',
                id: apiData.engineerInfo.id || '',
                phone: apiData.engineerInfo.phone || '',
                rating: apiData.engineerInfo.rating || 4.8,
              },
            }
          : {}),
        statusHistory: [],
      }
    } else {
      error.value = true
      errorMessage.value = res.msg || '获取订单详情失败，请重试'
    }
  } catch (err) {
    console.error('获取订单详情失败:', err)
    error.value = true
    errorMessage.value = '获取订单详情失败，请重试'
  } finally {
    loading.value = false
  }
}

// 页面加载
onLoad((options) => {
  if (options.id) {
    orderId.value = options.id
    fetchOrderDetail()
  } else {
    error.value = true
    errorMessage.value = '订单ID不存在，请返回重试'
  }
})
</script>

<style lang="scss" scoped>
.order-detail-container {
  min-height: 100vh;
  padding: 30rpx;
  background-color: #f7f8fa;
}

// 加载状态和错误提示样式
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 200rpx;

  text {
    margin: 30rpx 0;
    color: #999;
    font-size: 28rpx;
  }
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

/* 新增步骤条容器样式 */
.progress-steps-container {
  padding: 30rpx 20rpx;
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

  .description-line {
    margin-bottom: 8rpx;

    &:last-child {
      margin-bottom: 0;
    }

    &:empty {
      display: none;
    }
  }
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

// 取消订单弹窗内容样式
.cancel-dialog-content {
  padding: 20rpx;
}
</style>
