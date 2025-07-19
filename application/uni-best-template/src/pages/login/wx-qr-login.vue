<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '微信扫码登录',
    navigationStyle: 'custom',
  },
}
</route>
<template>
  <view class="qr-login-container">
    <view class="qr-header">
      <image class="logo" src="/static/logo.svg" mode="aspectFit" />
      <text class="title">微信扫码登录</text>
    </view>
    
    <view class="qr-content">
      <web-view 
        v-if="qrUrl" 
        :src="qrUrl" 
        class="qr-webview"
        @message="handleWebviewMessage"
      ></web-view>
    </view>
    
    <view class="qr-footer">
      <text class="tips">请使用微信扫描二维码登录</text>
      <view class="back-btn" @click="goBack">
        <wd-button type="info" plain size="small">返回登录页</wd-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'

const qrUrl = ref('')

onLoad((options) => {
  if (options.url) {
    qrUrl.value = decodeURIComponent(options.url)
  }
})

const goBack = () => {
  uni.navigateBack()
}

const handleWebviewMessage = (e: any) => {
  console.log('WebView消息:', e)
  // 处理web-view消息
}
</script>

<style lang="scss" scoped>
.qr-login-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #ffffff;
}

.qr-header {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 60rpx 0;
  
  .logo {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 20rpx;
  }
  
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333333;
  }
}

.qr-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .qr-webview {
    width: 100%;
    height: 100%;
    border: none;
  }
}

.qr-footer {
  padding: 40rpx 0;
  text-align: center;
  
  .tips {
    font-size: 28rpx;
    color: #666666;
    display: block;
    margin-bottom: 30rpx;
  }
  
  .back-btn {
    margin-top: 20rpx;
  }
}
</style>