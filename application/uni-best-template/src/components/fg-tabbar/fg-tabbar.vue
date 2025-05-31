<template>
  <view class="fg-tabbar-container">
    <wd-tabbar v-model="activeTab" shape="round"  @change="handleChange" fixed safe-area-inset-bottom placeholder>
      <!-- 首页 -->
      <wd-tabbar-item name="home" title="首页" icon="home"></wd-tabbar-item>
      
      <!-- 一键预约 - 中间突出按钮 -->
      <wd-tabbar-item name="appointment" title="一键预约" custom-class="appointment-btn">
        <template #icon>
          <view class="appointment-icon-container">
            <wd-icon name="check-checked" size="22px" color="#fff"></wd-icon>
          </view>
        </template>
      </wd-tabbar-item>
      
      <!-- 我的 -->
      <wd-tabbar-item name="mine" title="我的" icon="user"></wd-tabbar-item>
    </wd-tabbar>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'

// 定义props
const props = defineProps({
  // 当前页面对应的tab
  current: {
    type: String,
    default: 'home'
  }
})

onShow(() => {
  activeTab.value = props.current
})

// 当前激活的tab名称
const activeTab = ref(props.current)

// tabbar路径映射
const tabRoutes = {
  home: '/pages/index/index',
  appointment: '/pages/appointment/index',
  mine: '/pages/mine/index'
}

const handleChange = ({ value }: any) => {
  activeTab.value = value
  
  // 如果是预约按钮，显示预约弹窗而不是跳转
  if (value === 'appointment') {
    uni.showModal({
      title: '一键预约',
      content: '是否预约三棵树防水修缮服务？',
      confirmColor: '#2c722c',
      success: (res) => {
        if (res.confirm) {
          uni.showToast({
            title: '预约成功，我们将尽快联系您',
            icon: 'none',
            duration: 2000
          })
        }
        // 预约操作后恢复原来的tab
        setTimeout(() => {
          activeTab.value = props.current
        }, 100)
      }
    })
    return
  }
  
  const url = tabRoutes[value]
  if (url) {
    uni.switchTab({
      url,
      fail: (err) => {
        console.error('switchTab失败:', err)
      }
    })
  }
}
</script>

<style lang="scss">
.fg-tabbar-container {
  position: relative;
  z-index: 999;
  
  :deep(.wd-tabbar) {
    height: 56px;
    background-color: #fff;
    border-top: 1px solid #f0f0f0;
    
    .wd-tabbar-item {
      color: #666;
      
      &.is-active {
        color: #2c722c;
      }
    }
    
    .appointment-btn {
      height: 100%;
      
      .appointment-icon-container {
        position: relative;
        top: -15px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #2c722c;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 2px 8px rgba(44, 114, 44, 0.4);
      }
      
      .wd-tabbar-item__title {
        margin-top: -5px;
      }
    }
  }
}
</style> 