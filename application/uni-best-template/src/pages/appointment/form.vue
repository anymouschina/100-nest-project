<route lang="json5">
{
  style: {
    navigationBarTitleText: '服务预约',
    navigationStyle: 'custom'
  },
}
</route>

<template>
  <view class="form-container">    
    <view class="banner">
      <view class="banner-text">
        <view class="cn-text">中 国 奥 委 会</view>
        <view class="supplier-text">官方涂料独家供应商</view>
      </view>
    </view>
    
    <view class="form-content">
      <view class="form-item">
        <text class="required">*</text>
        <text class="label">选择服务类型</text>
        <view class="service-options">
          <view 
            class="service-option" 
            :class="{ active: serviceType === 'repair' }"
            @click="serviceType = 'repair'"
          >
            防水补漏
          </view>
          <view 
            class="service-option" 
            :class="{ active: serviceType === 'new' }"
            @click="serviceType = 'new'"
          >
            新房防水施工
          </view>
          <view 
            class="service-option" 
            :class="{ active: serviceType === 'unsure' }"
            @click="serviceType = 'unsure'"
          >
            我不清楚
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="required">*</text>
        <text class="label">选择场景类型</text>
        <wd-cell title-width="0" custom-class="scene-cell" @click="showSceneSelector">
          <view class="placeholder">{{ formData.sceneType || '请选择' }}</view>
        </wd-cell>
      </view>
      
      <view class="form-item">
        <text class="required">*</text>
        <text class="label">业主姓名</text>
        <wd-input v-model="formData.name" placeholder="请填写" custom-class="custom-input"></wd-input>
      </view>
      
      <view class="form-item">
        <text class="required">*</text>
        <text class="label">联系电话</text>
        <wd-input v-model="formData.phone" placeholder="请填写" type="number" custom-class="custom-input"></wd-input>
      </view>
      
      <view class="form-item">
        <text class="required">*</text>
        <text class="label">小区位置</text>
        <wd-cell title-width="0" custom-class="location-cell" @click="chooseLocation">
          <view class="location-field">
            <view class="placeholder">可使用定位功能直接选择</view>
            <view class="location-icon">
              <wd-icon name="location" size="40rpx" color="#2c722c"></wd-icon>
            </view>
          </view>
        </wd-cell>
      </view>
      
      <view class="form-item">
        <text class="required">*</text>
        <text class="label">选择省市区</text>
        <wd-input v-model="formData.region" placeholder="请填写" custom-class="custom-input"></wd-input>
      </view>
      
      <view class="form-item">
        <text class="label">详细地址</text>
        <wd-input v-model="formData.address" placeholder="请填写" custom-class="custom-input"></wd-input>
      </view>
      
      <!-- 添加底部占位，防止内容被提交按钮遮挡 -->
      <view style="height: 160rpx;"></view>
    </view>
    
    <view class="submit-wrapper">
      <wd-button size="large" type="primary" block custom-class="submit-btn" @click="submitForm">确认预约</wd-button>
      <view class="safe-area-inset-bottom"></view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'

// 服务类型
const serviceType = ref('repair')

// 安全距离
const safeAreaBottom = ref(0)

onMounted(() => {
  // 获取安全区域信息
  uni.getSystemInfo({
    success: (res) => {
      console.log('系统信息', res)
      if (res.safeAreaInsets) {
        safeAreaBottom.value = res.safeAreaInsets.bottom || 0
      }
    }
  })
})

// 表单数据
const formData = reactive({
  name: '',
  phone: '',
  region: '',
  address: '',
  sceneType: ''
})

// 场景选择器
const showSceneSelector = () => {
  uni.showActionSheet({
    itemList: ['客厅', '厨房', '卫生间', '阳台', '卧室', '其他'],
    success: (res) => {
      const sceneTypes = ['客厅', '厨房', '卫生间', '阳台', '卧室', '其他']
      formData.sceneType = sceneTypes[res.tapIndex]
    }
  })
}

// 选择位置
const chooseLocation = () => {
  // #ifdef MP-WEIXIN
  uni.chooseLocation({
    success: (res) => {
      console.log('选择位置成功', res)
      // 自动填充省市区和详细地址
      formData.region = res.address.split(',')[0] || ''
      formData.address = res.address || ''
    },
    fail: (err) => {
      console.log('选择位置失败', err)
      uni.showToast({
        title: '请授权位置权限',
        icon: 'none'
      })
    }
  })
  // #endif
  
  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '仅微信小程序支持此功能',
    icon: 'none'
  })
  // #endif
}

// 提交表单
const submitForm = () => {
  // 表单验证
  if (!serviceType.value) {
    return uni.showToast({ title: '请选择服务类型', icon: 'none' })
  }
  
  if (!formData.sceneType) {
    return uni.showToast({ title: '请选择场景类型', icon: 'none' })
  }
  
  if (!formData.name) {
    return uni.showToast({ title: '请输入业主姓名', icon: 'none' })
  }
  
  if (!formData.phone) {
    return uni.showToast({ title: '请输入联系电话', icon: 'none' })
  }
  
  if (!/^1\d{10}$/.test(formData.phone)) {
    return uni.showToast({ title: '请输入正确的手机号码', icon: 'none' })
  }
  
  if (!formData.region) {
    return uni.showToast({ title: '请选择省市区', icon: 'none' })
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
    
    // 跳转到首页
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 2000)
  }, 1500)
}
</script>

<style lang="scss" scoped>
.form-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f7f8fa;
  position: relative;
}

.banner {
  position: relative;
  width: 100%;
  height: 140rpx;
  background: linear-gradient(to right, #3d9c40, #67c541);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  
  .banner-text {
    text-align: center;
    color: #fff;
    
    .cn-text {
      font-size: 36rpx;
      letter-spacing: 12rpx;
      margin-bottom: 10rpx;
      font-weight: bold;
    }
    
    .supplier-text {
      font-size: 30rpx;
    }
  }
}

.form-content {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
  
  .required {
    color: #ff4d4f;
    margin-right: 6rpx;
    font-size: 30rpx;
  }
  
  .label {
    color: #333;
    font-size: 30rpx;
    margin-bottom: 15rpx;
    display: inline-block;
  }
  
  .service-options {
    display: flex;
    flex-wrap: wrap;
    margin-top: 20rpx;
    
    .service-option {
      width: 30%;
      height: 80rpx;
      background-color: #f1f1f1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10rpx;
      margin-right: 3%;
      margin-bottom: 20rpx;
      color: #666;
      font-size: 28rpx;
      
      &.active {
        background-color: #e8f5e9;
        color: #2c722c;
        border: 2rpx solid #2c722c;
      }
    }
  }
  
  .placeholder {
    width: 100%;
    height: 90rpx;
    line-height: 90rpx;
    font-size: 28rpx;
    color: #999;
  }
  
  .location-field {
    display: flex;
    align-items: center;
    width: 100%;
    
    .placeholder {
      flex: 1;
      margin-top: 0;
      padding: 0;
    }
    
    .location-icon {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.scene-cell, .location-cell {
  padding: 0 20rpx;
  border-radius: 10rpx;
  margin-top: 15rpx;
  background-color: #fff;
}

:deep(.custom-input) {
  margin-top: 15rpx;
  border-radius: 10rpx;
  overflow: hidden;
  
  .wd-input__inner {
    border-radius: 10rpx;
    background-color: #fff;
    height: 90rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
  }
}

.submit-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  z-index: 99;
  background-color: #fff;
  box-shadow: 0 -4rpx 10rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
  height: 90rpx;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 45rpx;
  margin: 0;
  background-color: #3d9c40 !important;
  border-color: #3d9c40 !important;
}

.safe-area-inset-bottom {
  height: v-bind('safeAreaBottom + "px"');
}
</style> 