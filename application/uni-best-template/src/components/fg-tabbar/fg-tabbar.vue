<template>
  <view class="fg-tabbar-container">
    <wd-tabbar v-model="activeTab" @change="handleChange" fixed safe-area-inset-bottom placeholder>
      <wd-tabbar-item name="home" title="首页" icon="home"></wd-tabbar-item>
      <wd-tabbar-item name="about" title="关于" icon="search"></wd-tabbar-item>
      <wd-tabbar-item name="mine" title="我的" icon="user"></wd-tabbar-item>
    </wd-tabbar>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, } from 'vue'
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
  about: '/pages/about/about',
  mine: '/pages/mine/index'
}

const handleChange = ({ value }: any) => {
  activeTab.value = value
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
}
</style> 