<template>
  <wd-tabbar
    v-model="activeTab"
    shape="round"
    @change="handleChange"
    fixed
    safe-area-inset-bottom
    placeholder
    activeColor="#52c41a"
  >
    <!-- 首页 -->
    <wd-tabbar-item name="home" title="首页" icon="home"></wd-tabbar-item>

    <!-- 一键预约 - 中间突出按钮 -->
    <wd-button round size="large" custom-class="appointment-btn" @click="handleAppointmentClick">
      一键预约
    </wd-button>

    <!-- 我的 -->
    <wd-tabbar-item name="mine" title="我的" icon="user"></wd-tabbar-item>

    <!-- 边框指示器 -->
    <view class="menu__border" :style="borderStyle"></view>
  </wd-tabbar>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

// 定义props
const props = defineProps({
  // 当前页面对应的tab
  current: {
    type: String,
    default: 'home',
  },
})

onShow(() => {
  activeTab.value = props.current
  nextTick(() => {
    updateBorderPosition(props.current)
  })
})

// 当前激活的tab名称
const activeTab = ref(props.current)

// 边框样式
const borderStyle = ref({
  transform: 'translateX(0)',
})

// tabbar路径映射
const tabRoutes = {
  home: '/pages/index/index',
  mine: '/pages/mine/index',
}

// 一键预约点击事件
const handleAppointmentClick = () => {
  console.log('底部导航栏一键预约按钮点击')
  // 一键预约
  uni.navigateTo({
    url: '/pages/appointment/index?serviceType=unsure',
  })
}

// 更新边框位置
const updateBorderPosition = (tabName) => {
  if (tabName === 'home') {
    borderStyle.value = { transform: 'translateX(0)' }
  } else if (tabName === 'mine') {
    borderStyle.value = { transform: 'translateX(200%)' }
  }
}

const handleChange = ({ value }) => {
  activeTab.value = value
  updateBorderPosition(value)

  const url = tabRoutes[value]
  if (url) {
    uni.switchTab({
      url,
      fail: (err) => {
        console.error('switchTab失败:', err)
      },
    })
  }
}

onMounted(() => {
  nextTick(() => {
    updateBorderPosition(activeTab.value)
  })
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';
:root {
  --bgColorMenu: #ffffff;
  --duration: 0.7s;
  --timeOut: 0.7s;
}

.fg-tabbar-container {
  position: relative;
  z-index: 999;

  :deep(.wd-tabbar) {
    height: 60px;
    background-color: #fff;
    border-top: 1px solid #f0f0f0;
    position: relative;
    overflow: visible;

    .wd-tabbar-item {
      color: #666;
      font-size: 24rpx;

      &.is-active {
        color: #2c722c;
      }
    }

    // 边框指示器
    .menu__border {
      left: 0;
      bottom: 99%;
      width: 33.3%;
      height: 2.4em;
      position: absolute;
      clip-path: url(#menu);
      will-change: transform;
      background-color: #fff;
      transition: transform var(--timeOut, var(--duration));
      z-index: -1;
    }
  }
}

.appointment-btn {
  position: absolute !important;
  box-sizing: content-box;
  top: -15px !important;
  left: 50% !important;
  transform: translate(-50%, -28rpx);
  width: 60px !important;
  height: 60px !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, #2c722c 0%, #52c41a 100%) !important;
  font-weight: 600 !important;
  z-index: 10 !important;
  line-height: 1.1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  white-space: normal !important;
  word-break: break-all !important;
  padding: 10rpx !important;
  color: #fff;
  font-size: 44rpx;

  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(44, 114, 44, 0.15), rgba(82, 196, 26, 0.15));
    z-index: -1;
    animation: pulse-ring 2.5s ease-in-out infinite;
  }

  &:active {
    transform: translate(-50%, -28rpx) scale(0.95);
  }
}

.svg-container {
  width: 0;
  height: 0;
  visibility: hidden;
  position: absolute;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}
</style>
