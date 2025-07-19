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
    <view class="appointment-center-btn" @click="handleAppointmentClick">
      <view class="btn-outer-ring">
        <view class="btn-inner-circle">
          <view class="btn-icon">
            <wd-icon name="plus" size="32" color="#FFFFFF" />
          </view>
        </view>
      </view>
    </view>

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

.appointment-center-btn {
  position: absolute;
  top: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 100;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  .btn-outer-ring {
    width: 100rpx;
    height: 100rpx;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 8rpx 32rpx rgba(0, 122, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    .btn-inner-circle {
      width: 80rpx;
      height: 80rpx;
      background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.3);
      transition: all 0.3s ease;

      .btn-icon {
        transition: all 0.3s ease;
      }
    }
  }

  .btn-label {
    margin-top: 8rpx;
    font-size: 24rpx;
    color: #007aff;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  &:active {
    transform: translateX(-50%) scale(0.95);

    .btn-outer-ring {
      transform: scale(0.95);
    }

    .btn-inner-circle {
      transform: scale(0.95);
    }
  }

  &:hover {
    .btn-outer-ring {
      box-shadow: 0 12rpx 48rpx rgba(0, 122, 255, 0.3);
    }
  }
}

.svg-container {
  width: 0;
  height: 0;
  visibility: hidden;
  position: absolute;
}

/* 过渡展示动画 */
.appointment-center-btn {
  animation: slideUpFade 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  opacity: 0;
  transform: translateX(-50%) translateY(20rpx);
  animation-delay: 0.3s;

  .btn-outer-ring {
    animation: scaleIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.4s;
    transform: scale(0);
  }

  .btn-inner-circle {
    animation: scaleIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.5s;
    transform: scale(0);
  }
}

@keyframes slideUpFade {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(20rpx);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
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

/* 悬浮时的心跳动画 */
.appointment-center-btn:hover .btn-outer-ring {
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.05);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(1);
  }
}
</style>
