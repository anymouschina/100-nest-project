<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page；推荐使用json5，更强大，且允许注释 -->
<route lang="json5" type="home">
{
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '首页',
  },
}
</route>
<template>
  <view class="page-container">
    <!-- 顶部横幅区域 -->
    <view class="banner-section">
      <!-- 品牌标志和名称 -->
      <view class="brand-header">
        <view class="brand-logo">
          <view class="logo-icon">
            <wd-icon name="home" size="24px" color="#2c722c"></wd-icon>
          </view>
          <text class="brand-name">三棵树防水修缮</text>
        </view>
        <view class="brand-subtitle">专业防水 · 品质保障</view>
      </view>
      
      <!-- 大幅品牌宣传图 -->
      <view class="banner-image-container">
        <view class="banner-content">
          <view class="worker-avatar">
            <wd-icon name="user" size="40px" color="#fff"></wd-icon>
          </view>
          <view class="banner-text">
            <text class="main-title">专业施工人员</text>
            <text class="sub-title">持证上岗 · 经验丰富</text>
          </view>
        </view>
        <view class="banner-decoration"></view>
      </view>
      
      <!-- 品牌认证标志 -->
      <view class="certification-badges">
        <view class="badge">
          <wd-icon name="check-checked" size="16px" color="#d4a01f"></wd-icon>
          <text>中国奥委会官方涂料独家供应商</text>
        </view>
        <view class="badge">
          <wd-icon name="shield" size="16px" color="#2c722c"></wd-icon>
          <text>质量保证 · 售后无忧</text>
        </view>
      </view>
    </view>

    <!-- 服务响应区域 -->
    <view class="services-section">
      <view class="section-title">
        <text class="title-text">专业服务</text>
        <text class="title-desc">一站式防水修缮解决方案</text>
      </view>
      
      <view class="service-cards">
        <!-- 防水补漏服务 -->
        <view class="service-card" @click="navigateToService('repair')">
          <view class="service-icon repair-icon">
            <wd-icon name="tools" size="28px" color="#2c722c"></wd-icon>
          </view>
          <view class="service-content">
            <view class="service-title">防水补漏</view>
            <view class="service-features">
              <view class="feature-item">
                <wd-icon name="check-checked" size="12px" color="#52c41a"></wd-icon>
                <text>专业师傅</text>
              </view>
              <view class="feature-item">
                <wd-icon name="check-checked" size="12px" color="#52c41a"></wd-icon>
                <text>免费上门</text>
              </view>
              <view class="feature-item">
                <wd-icon name="check-checked" size="12px" color="#52c41a"></wd-icon>
                <text>快速响应</text>
              </view>
            </view>
          </view>
          <view class="service-arrow">
            <wd-icon name="arrow-right" size="16px" color="#ccc"></wd-icon>
          </view>
        </view>

        <!-- 新房防水施工服务 -->
        <view class="service-card" @click="navigateToService('new')">
          <view class="service-icon construction-icon">
            <wd-icon name="building" size="28px" color="#409eff"></wd-icon>
          </view>
          <view class="service-content">
            <view class="service-title">新房防水施工</view>
            <view class="service-features">
              <view class="feature-item">
                <wd-icon name="check-checked" size="12px" color="#52c41a"></wd-icon>
                <text>包工包料</text>
              </view>
              <view class="feature-item">
                <wd-icon name="check-checked" size="12px" color="#52c41a"></wd-icon>
                <text>标准化施工</text>
              </view>
              <view class="feature-item">
                <wd-icon name="check-checked" size="12px" color="#52c41a"></wd-icon>
                <text>质保承诺</text>
              </view>
            </view>
          </view>
          <view class="service-arrow">
            <wd-icon name="arrow-right" size="16px" color="#ccc"></wd-icon>
          </view>
        </view>
      </view>
    </view>

    <!-- 品牌展示区域 -->
    <view class="brand-showcase">
      <view class="showcase-content">
        <!-- 品牌名称大字展示 -->
        <view class="brand-display">
          <view class="brand-logo-large">
            <wd-icon name="home" size="48px" color="#2c722c"></wd-icon>
          </view>
          <view class="brand-text">
            <text class="brand-main">三棵树</text>
            <text class="brand-sub">防水修缮</text>
          </view>
        </view>
        
        <!-- 服务店标识 -->
        <view class="service-store-badge">
          <text class="store-text">服务店</text>
          <view class="store-decoration"></view>
        </view>
        
        <!-- 简洁的品牌标识 -->
        <view class="brand-slogan">
          <text class="slogan-text">一站式防水修缮服务</text>
          <view class="slogan-highlights">
            <text class="highlight">专业</text>
            <text class="highlight">可靠</text>
            <text class="highlight">高效</text>
          </view>
        </view>
      </view>
    </view>
  
    <!-- 底部导航栏 -->
    <fg-tabbar current="home"></fg-tabbar>
  </view>
</template>

<script lang="ts" setup>
import FgTabbar from '@/components/fg-tabbar/fg-tabbar.vue'

defineOptions({
  name: 'Home',
})

// 服务项目导航
const navigateToService = (type: string) => {
  const serviceMap = {
    repair: '防水补漏',
    new: '新房防水施工'
  }
  
  uni.showModal({
    title: serviceMap[type],
    content: `即将为您提供${serviceMap[type]}服务，是否继续？`,
    confirmColor: '#2c722c',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: `正在为您安排${serviceMap[type]}服务`,
          icon: 'none',
          duration: 2000
        })
      }
    }
  })
}
</script>

<style lang="scss">
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f9f0 0%, #ffffff 100%);
}

// 顶部横幅区域
.banner-section {
  width: 100%;
  background: linear-gradient(135deg, #2c722c 0%, #52c41a 100%);
  color: white;
  
  .brand-header {
    padding: 40rpx 30rpx 20rpx;
    
    .brand-logo {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;
      
      .logo-icon {
        width: 60rpx;
        height: 60rpx;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 20rpx;
      }
      
      .brand-name {
        font-size: 40rpx;
        font-weight: bold;
        color: #fff;
      }
    }
    
    .brand-subtitle {
      font-size: 28rpx;
      color: rgba(255, 255, 255, 0.9);
      margin-left: 80rpx;
    }
  }
  
  .banner-image-container {
    position: relative;
    padding: 30rpx;
    margin: 0 30rpx 20rpx;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20rpx;
    backdrop-filter: blur(10px);
    
    .banner-content {
      display: flex;
      align-items: center;
      
      .worker-avatar {
        width: 100rpx;
        height: 100rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 30rpx;
      }
      
      .banner-text {
        flex: 1;
        
        .main-title {
          display: block;
          font-size: 36rpx;
          font-weight: bold;
          color: #fff;
          margin-bottom: 10rpx;
        }
        
        .sub-title {
          font-size: 26rpx;
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
    
    .banner-decoration {
      position: absolute;
      top: -10rpx;
      right: -10rpx;
      width: 40rpx;
      height: 40rpx;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
    }
  }
  
  .certification-badges {
    padding: 0 30rpx 30rpx;
    display: flex;
    flex-direction: column;
    gap: 15rpx;
    
    .badge {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.15);
      padding: 15rpx 20rpx;
      border-radius: 30rpx;
      
      text {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.9);
        margin-left: 15rpx;
      }
    }
  }
}

// 服务响应区域
.services-section {
  padding: 40rpx 30rpx;
  
  .section-title {
    text-align: center;
    margin-bottom: 40rpx;
    
    .title-text {
      display: block;
      font-size: 44rpx;
      font-weight: bold;
      color: #2c722c;
      margin-bottom: 15rpx;
    }
    
    .title-desc {
      font-size: 28rpx;
      color: #666;
    }
  }
  
  .service-cards {
    display: flex;
    flex-direction: column;
    gap: 25rpx;
    
    .service-card {
      background: #fff;
      border-radius: 24rpx;
      padding: 35rpx;
      display: flex;
      align-items: center;
      box-shadow: 0 8rpx 32rpx rgba(44, 114, 44, 0.08);
      border: 2rpx solid transparent;
      transition: all 0.3s ease;
      
      &:active {
        transform: scale(0.98);
        border-color: #2c722c;
      }
      
      .service-icon {
        width: 100rpx;
        height: 100rpx;
        border-radius: 20rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 30rpx;
        
        &.repair-icon {
          background: rgba(44, 114, 44, 0.1);
        }
        
        &.construction-icon {
          background: rgba(64, 158, 255, 0.1);
        }
      }
      
      .service-content {
        flex: 1;
        
        .service-title {
          font-size: 36rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 20rpx;
        }
        
        .service-features {
          display: flex;
          flex-direction: column;
          gap: 12rpx;
          
          .feature-item {
            display: flex;
            align-items: center;
            
            text {
              font-size: 26rpx;
              color: #666;
              margin-left: 12rpx;
            }
          }
        }
      }
      
      .service-arrow {
        margin-left: 20rpx;
      }
    }
  }
}

// 品牌展示区域
.brand-showcase {
  flex: 1;
  margin: 20rpx 30rpx 30rpx;
  background: linear-gradient(135deg, #e8f4e8 0%, #f0f9f0 100%);
  border-radius: 24rpx;
  overflow: hidden;
  
  .showcase-content {
    padding: 50rpx 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    
    .brand-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 40rpx;
      
      .brand-logo-large {
        width: 120rpx;
        height: 120rpx;
        background: rgba(44, 114, 44, 0.1);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 30rpx;
      }
      
      .brand-text {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .brand-main {
          font-size: 56rpx;
          font-weight: bold;
          color: #2c722c;
          line-height: 1.2;
        }
        
        .brand-sub {
          font-size: 40rpx;
          font-weight: 600;
          color: #52c41a;
          margin-top: 10rpx;
        }
      }
    }
    
    .service-store-badge {
      position: relative;
      margin-bottom: 40rpx;
      
      .store-text {
        font-size: 72rpx;
        font-weight: bold;
        color: #2c722c;
        text-shadow: 2rpx 2rpx 4rpx rgba(44, 114, 44, 0.1);
      }
      
      .store-decoration {
        position: absolute;
        bottom: -10rpx;
        left: 50%;
        transform: translateX(-50%);
        width: 80rpx;
        height: 6rpx;
        background: linear-gradient(90deg, #2c722c, #52c41a);
        border-radius: 3rpx;
      }
    }
    
    .brand-slogan {
      .slogan-text {
        display: block;
        font-size: 32rpx;
        color: #2c722c;
        margin-bottom: 30rpx;
        font-weight: 500;
      }
      
      .slogan-highlights {
        display: flex;
        justify-content: center;
        gap: 20rpx;
        
        .highlight {
          padding: 12rpx 24rpx;
          background: rgba(44, 114, 44, 0.1);
          color: #2c722c;
          font-size: 24rpx;
          border-radius: 20rpx;
          font-weight: 500;
        }
      }
    }
  }
}
</style>
