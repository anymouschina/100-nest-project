<template>
  <wd-config-provider :themeVars="themeVars">
    <scroll-view scroll-y style="height: 100vh;">
      <wd-navbar 
        custom-style="background: transparent;" 
        fixed 
        placeholder 
        :bordered="false" 
        safeAreaInsetTop
        :left-arrow="showBackArrow"
        @click-left="handleBack"
      ></wd-navbar>
      <slot />
    </scroll-view>
    <wd-toast />
    <wd-message-box />
    <privacy-popup />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import type { ConfigProviderThemeVars } from 'wot-design-uni'
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const themeVars: ConfigProviderThemeVars = {
  // colorTheme: 'red',
  // buttonPrimaryBgColor: '#07c160',
  // buttonPrimaryColor: '#07c160',
}

// 是否显示返回箭头
const showBackArrow = ref(false)

// 检查当前页面是否为tab页面
const checkIsTabPage = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  
  if (!currentPage) return false
  
  // 获取当前页面路径
  const currentPath = `/${currentPage.route}`
  
  // 主tab页面列表，这里需要根据实际的tabBar配置来设置
  const tabPages = [
    '/pages/index/index', // 首页
    '/pages/appointment/index', // 一键预约
    '/pages/mine/index' // 我的
  ]
  
  // 判断当前页面是否为tab页面
  const isTabPage = tabPages.includes(currentPath)
  
  // 如果不是tab页面，且不是首页，则显示返回箭头
  showBackArrow.value = !isTabPage && pages.length > 1
}

// 返回按钮点击事件
const handleBack = () => {
  uni.navigateBack()
}

// 页面加载和显示时检查
onMounted(() => {
  checkIsTabPage()
})

onShow(() => {
  checkIsTabPage()
})
</script>
