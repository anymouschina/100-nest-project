<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '微信登录',
    navigationStyle: 'custom',
  },
}
</route>
<template>
  <view class="wx-callback-container">
    <view class="loading-container">
      <wd-loading size="large" />
      <text class="loading-text">正在处理微信登录...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { toast } from '@/utils/toast'
import { http } from '@/utils/http'

const userStore = useUserStore()

// 解析URL参数
const getQueryParam = (name: string): string | null => {
  const query = window.location.search.substring(1)
  const vars = query.split('&')
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=')
    if (pair[0] === name) {
      return decodeURIComponent(pair[1])
    }
  }
  return null
}

// 处理微信回调
const handleWechatCallback = async () => {
  try {
    // 获取URL参数
    const code = getQueryParam('code')
    const state = getQueryParam('state')
    const error = getQueryParam('error')

    if (error) {
      toast.error('用户取消授权')
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/login/index' })
      }, 1500)
      return
    }

    if (!code) {
      toast.error('授权失败')
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/login/index' })
      }, 1500)
      return
    }

    // 验证state
    const storedState = uni.getStorageSync('wx_oauth_state') || uni.getStorageSync('wx_qr_state')
    if (state !== storedState) {
      toast.error('授权验证失败')
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/login/index' })
      }, 1500)
      return
    }

    // 清除state
    uni.removeStorageSync('wx_oauth_state')
    uni.removeStorageSync('wx_qr_state')

    // 发送code到后端验证
    const res = await http.post('/user/wxWebLogin', { code })
    
    if (res.data) {
      // 登录成功
      userStore.setUserInfo(res.data)
      uni.setStorageSync('userInfo', res.data)
      uni.setStorageSync('token', res.data.token)
      toast.success('微信登录成功')
      
      // 跳转到首页或重定向页面
      setTimeout(() => {
        const redirect = uni.getStorageSync('redirect_after_login') || '/pages/index/index'
        uni.removeStorageSync('redirect_after_login')
        
        if (redirect.includes('tabbar')) {
          uni.switchTab({ url: redirect })
        } else {
          uni.redirectTo({ url: redirect })
        }
      }, 1000)
    } else {
      toast.error('登录失败')
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/login/index' })
      }, 1500)
    }
  } catch (error) {
    console.error('微信登录失败:', error)
    toast.error('微信登录失败')
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/login/index' })
    }, 1500)
  }
}

onLoad(() => {
  // 页面加载时处理微信回调
  handleWechatCallback()
})
</script>

<style lang="scss" scoped>
.wx-callback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #ffffff;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx;
}

.loading-text {
  font-size: 32rpx;
  color: #666666;
  margin-top: 20rpx;
}
</style>