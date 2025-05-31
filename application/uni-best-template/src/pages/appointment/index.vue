<route lang="json5">
{
  style: {
    navigationBarTitleText: '一键预约',
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <view class="appointment-container">
    <view class="appointment-header">
      <view class="header-title">
        <text class="title-text">服务预约</text>
      </view>
      <text class="header-desc">三棵树防水修缮专业服务</text>
    </view>
    
    <view class="appointment-form">
      <view class="form-item">
        <text class="form-label">服务类型</text>
        <view class="service-type-selector">
          <view 
            class="type-item" 
            :class="{ active: serviceType === 'repair' }"
            @click="serviceType = 'repair'"
          >
            防水补漏
          </view>
          <view 
            class="type-item" 
            :class="{ active: serviceType === 'new' }"
            @click="serviceType = 'new'"
          >
            新房防水施工
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="form-label">联系人</text>
        <input class="input-field" placeholder="请输入您的姓名" v-model="formData.name" />
      </view>
      
      <view class="form-item">
        <text class="form-label">手机号码</text>
        <input class="input-field" placeholder="请输入您的手机号" type="number" v-model="formData.phone" />
      </view>
      
      <view class="form-item">
        <text class="form-label">服务地址</text>
        <input class="input-field" placeholder="请输入详细地址" v-model="formData.address" />
      </view>
      
      <view class="form-item">
        <text class="form-label">预约时间</text>
        <picker mode="date" :start="startDate" :end="endDate" @change="onDateChange" class="date-picker">
          <view class="picker-value">{{ formData.date || '请选择预约日期' }}</view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="form-label">问题描述</text>
        <textarea class="textarea-field" placeholder="请简要描述您的防水需求" v-model="formData.description" />
      </view>
    </view>
    
    <view class="submit-section">
      <view class="submit-button" @click="submitAppointment">立即预约</view>
      <view class="service-guarantee">
        <text class="guarantee-text">服务承诺：1小时响应 | 专业团队 | 品质保障</text>
      </view>
    </view>
    
    <!-- 自定义tabbar -->
    <fg-tabbar current="appointment"></fg-tabbar>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import FgTabbar from '@/components/fg-tabbar/fg-tabbar.vue'

// 服务类型
const serviceType = ref('repair')

// 表单数据
const formData = reactive({
  name: '',
  phone: '',
  address: '',
  date: '',
  description: ''
})

// 预约日期范围
const startDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const endDate = computed(() => {
  const today = new Date()
  today.setMonth(today.getMonth() + 3)
  return today.toISOString().split('T')[0]
})

// 日期选择
const onDateChange = (e: any) => {
  formData.date = e.detail.value
}

// 提交预约
const submitAppointment = () => {
  // 表单验证
  if (!formData.name) {
    return uni.showToast({ title: '请输入联系人', icon: 'none' })
  }
  
  if (!formData.phone) {
    return uni.showToast({ title: '请输入手机号码', icon: 'none' })
  }
  
  if (!/^1\d{10}$/.test(formData.phone)) {
    return uni.showToast({ title: '请输入正确的手机号码', icon: 'none' })
  }
  
  if (!formData.address) {
    return uni.showToast({ title: '请输入服务地址', icon: 'none' })
  }
  
  if (!formData.date) {
    return uni.showToast({ title: '请选择预约时间', icon: 'none' })
  }
  
  // 提交表单
  uni.showLoading({ title: '提交中...' })
  
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({
      title: '预约成功，我们将尽快联系您',
      icon: 'none',
      duration: 2000
    })
    
    // 重置表单
    formData.name = ''
    formData.phone = ''
    formData.address = ''
    formData.date = ''
    formData.description = ''
    
    // 跳转到首页
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 2000)
  }, 1500)
}
</script>

<style lang="scss">
.appointment-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f9f5;
  padding-bottom: 100rpx;
}

.appointment-header {
  padding: 60rpx 40rpx 40rpx;
  background-color: #2c722c;
  
  .header-title {
    margin-bottom: 20rpx;
    
    .title-text {
      font-size: 48rpx;
      font-weight: bold;
      color: #fff;
    }
  }
  
  .header-desc {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.appointment-form {
  padding: 30rpx;
  background-color: #fff;
  margin: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  
  .form-item {
    margin-bottom: 40rpx;
    
    .form-label {
      display: block;
      font-size: 28rpx;
      color: #333;
      margin-bottom: 20rpx;
      font-weight: bold;
    }
    
    .input-field {
      width: 100%;
      height: 80rpx;
      border-radius: 8rpx;
      background-color: #f8f8f8;
      padding: 0 20rpx;
      box-sizing: border-box;
      font-size: 28rpx;
    }
    
    .textarea-field {
      width: 100%;
      height: 200rpx;
      border-radius: 8rpx;
      background-color: #f8f8f8;
      padding: 20rpx;
      box-sizing: border-box;
      font-size: 28rpx;
    }
    
    .service-type-selector {
      display: flex;
      justify-content: space-between;
      
      .type-item {
        width: 48%;
        height: 80rpx;
        border-radius: 8rpx;
        background-color: #f8f8f8;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 28rpx;
        color: #666;
        
        &.active {
          background-color: #e8f4e8;
          color: #2c722c;
          font-weight: bold;
          border: 2rpx solid #2c722c;
        }
      }
    }
    
    .date-picker {
      width: 100%;
      height: 80rpx;
      border-radius: 8rpx;
      background-color: #f8f8f8;
      padding: 0 20rpx;
      box-sizing: border-box;
      
      .picker-value {
        height: 80rpx;
        line-height: 80rpx;
        font-size: 28rpx;
        color: #333;
      }
    }
  }
}

.submit-section {
  padding: 0 30rpx;
  margin-top: 30rpx;
  
  .submit-button {
    height: 90rpx;
    border-radius: 45rpx;
    background-color: #2c722c;
    color: #fff;
    font-size: 32rpx;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .service-guarantee {
    margin-top: 30rpx;
    text-align: center;
    
    .guarantee-text {
      font-size: 24rpx;
      color: #999;
    }
  }
}
</style> 