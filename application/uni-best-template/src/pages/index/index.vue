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
  <view class="service-homepage">
    <!-- 状态栏 -->
    <view class="status-bar"></view>

    <!-- 1️⃣ 顶部搜索+定位区域 -->
    <view class="header-section">
      <view class="location-search-bar">
        <view class="location-cell" @click="selectLocation">
          <wd-icon name="location" size="20" color="#007AFF" />
          <text class="location-text">{{ currentLocation || '获取位置...' }}</text>
          <wd-icon name="arrow-down" size="16" color="#8E8E93" />
        </view>
        <view class="search-cell" @click="goToSearch">
          <view class="search-input">
            <wd-icon name="search" size="18" color="#8E8E93" />
            <text class="search-placeholder">搜索服务或商品</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 2️⃣ 服务分类快捷入口 -->
    <view class="categories-section">
      <view class="category-grid">
        <view 
          v-for="category in categories" 
          :key="category.id"
          class="category-item"
          @click="navigateToCategory(category.id)"
        >
          <view class="category-icon" :style="{ background: category.gradient }">
            <wd-icon :name="category.icon" size="28" color="#fff" />
          </view>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </view>
    </view>

    <!-- 3️⃣ 轮播图广告位 -->
    <view class="banner-section">
      <view class="banner-container">
        <view class="banner-card">
          <view class="banner-content">
            <text class="banner-title">春季大促</text>
            <text class="banner-subtitle">全场8折起，立即预约</text>
            <view class="banner-action">立即查看</view>
          </view>
          <view class="banner-visual">
            <view class="color-burst"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 4️⃣ 热门服务推荐 -->
    <view class="services-section">
      <view class="section-header">
        <text class="section-title">热门服务</text>
        <text class="section-subtitle">专业技师，30分钟上门</text>
      </view>
      <scroll-view class="services-scroll" scroll-x="true" :show-scrollbar="false">
        <view class="service-cards">
          <view 
            v-for="service in hotServices" 
            :key="service.id"
            class="service-card"
            @click="bookService(service.id)"
          >
            <view class="service-image" :style="{ background: service.color }">
              <wd-icon :name="service.icon" size="40" color="#fff" />
            </view>
            <view class="service-info">
              <text class="service-title">{{ service.title }}</text>
              <text class="service-price">¥{{ service.price }}起</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 5️⃣ 器材商城精选 -->
    <view class="products-section">
      <view class="section-header">
        <text class="section-title">器材商城</text>
        <text class="section-subtitle">专业工具，品质保证</text>
      </view>
      <view class="products-grid">
        <view 
          v-for="product in featuredProducts" 
          :key="product.id"
          class="product-card"
          @click="viewProduct(product.id)"
        >
          <view class="product-image" :style="{ background: product.color }">
            <view class="product-badge" v-if="product.badge">{{ product.badge }}</view>
          </view>
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-desc">{{ product.desc }}</text>
            <view class="product-price-row">
              <text class="product-price">¥{{ product.price }}</text>
              <text class="product-original" v-if="product.original">¥{{ product.original }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 6️⃣ 限时促销+优惠券 -->
    <view class="promo-section">
      <view class="promo-card">
        <view class="promo-content">
          <text class="promo-title">新人专享</text>
          <text class="promo-subtitle">首次下单立减50元</text>
          <view class="promo-code">立即领取</view>
        </view>
        <view class="promo-visual">
          <view class="promo-glow"></view>
        </view>
      </view>
    </view>

    <!-- 7️⃣ 服务保障+用户评价 -->
    <view class="trust-section">
      <view class="trust-grid">
        <view class="trust-item">
          <view class="trust-icon">
            <wd-icon name="shield-check" size="32" color="#007AFF" />
          </view>
          <text class="trust-text">正品保障</text>
        </view>
        <view class="trust-item">
          <view class="trust-icon">
            <wd-icon name="clock" size="32" color="#007AFF" />
          </view>
          <text class="trust-text">极速上门</text>
        </view>
        <view class="trust-item">
          <view class="trust-icon">
            <wd-icon name="star" size="32" color="#007AFF" />
          </view>
          <text class="trust-text">好评如潮</text>
        </view>
      </view>
    </view>

    <!-- 8️⃣ 底部悬浮预约按钮 - 已隐藏 -->
    <!-- <view class="floating-action">
      <view class="action-button" @click="quickAppointment">
        <wd-icon name="plus" size="24" color="#fff" />
        <text class="action-text">立即预约</text>
      </view>
    </view> -->

    <!-- 底部导航栏 -->
    <fg-tabbar current="home"></fg-tabbar>
  </view>
</template>

<script lang="ts" setup>
import FgTabbar from '@/components/fg-tabbar/fg-tabbar.vue'
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

defineOptions({
  name: 'ServiceHome',
})

// 当前位置
const currentLocation = ref('北京市朝阳区')

// 服务分类
const categories = ref([
  { id: 'repair', name: '维修服务', icon: 'setting', gradient: 'linear-gradient(135deg, #007AFF, #5856D6)' },
  { id: 'install', name: '安装服务', icon: 'add-circle', gradient: 'linear-gradient(135deg, #34C759, #30D158)' },
  { id: 'clean', name: '清洁服务', icon: 'brush', gradient: 'linear-gradient(135deg, #FF9500, #FF6B35)' },
  { id: 'maintain', name: '保养服务', icon: 'time', gradient: 'linear-gradient(135deg, #AF52DE, #BF5AF2)' },
  { id: 'tools', name: '工具器材', icon: 'tools', gradient: 'linear-gradient(135deg, #007AFF, #5856D6)' },
  { id: 'materials', name: '材料配件', icon: 'box', gradient: 'linear-gradient(135deg, #FF3B30, #FF453A)' },
])

// 热门服务
const hotServices = ref([
  { id: 1, title: '空调维修', price: 120, icon: 'setting', color: 'linear-gradient(135deg, #007AFF, #5856D6)' },
  { id: 2, title: '水管疏通', price: 80, icon: 'filter', color: 'linear-gradient(135deg, #34C759, #30D158)' },
  { id: 3, title: '电路检修', price: 150, icon: 'lightning', color: 'linear-gradient(135deg, #FF9500, #FF6B35)' },
  { id: 4, title: '家具安装', price: 200, icon: 'add-circle', color: 'linear-gradient(135deg, #AF52DE, #BF5AF2)' },
])

// 精选产品
const featuredProducts = ref([
  { id: 1, name: '专业工具箱', desc: '一站式维修套装', price: 299, original: 399, color: '#007AFF', badge: '热销' },
  { id: 2, name: '防水材料', desc: '卫生间防水专用', price: 89, color: '#34C759' },
  { id: 3, name: '电工胶布', desc: '绝缘防水耐用', price: 15, color: '#FF9500', badge: '特价' },
  { id: 4, name: '疏通工具', desc: '管道疏通神器', price: 45, color: '#AF52DE' },
])

// 方法定义
const selectLocation = () => {
  uni.chooseLocation({
    success: (res) => {
      currentLocation.value = res.name
    }
  })
}

const goToSearch = () => {
  uni.navigateTo({ url: '/pages/search/index' })
}

const navigateToCategory = (categoryId: string) => {
  uni.navigateTo({ url: `/pages/category/index?id=${categoryId}` })
}

const bookService = (serviceId: number) => {
  uni.navigateTo({ url: `/pages/booking/index?serviceId=${serviceId}` })
}

const viewProduct = (productId: number) => {
  uni.navigateTo({ url: `/pages/product/index?id=${productId}` })
}

const quickAppointment = () => {
  uni.navigateTo({ url: '/pages/booking/index' })
}

onLoad(() => {
  // 获取用户位置
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      // 这里可以调用逆地理编码API获取位置名称
    }
  })
})
</script>

<style lang="scss" scoped>
.service-homepage {
  min-height: 100vh;
  background: linear-gradient(180deg, #F2F2F7 0%, #FFFFFF 100%);
  padding-bottom: 200rpx;
}

// 状态栏
.status-bar {
  height: var(--status-bar-height);
  background: transparent;
}

// 1️⃣ 顶部搜索+定位区域
.header-section {
  padding: 32rpx 40rpx 24rpx;
  background: #FFFFFF;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  .location-search-bar {
    display: flex;
    align-items: center;
    gap: 24rpx;

    .location-cell {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 16rpx 24rpx;
      background: #F2F2F7;
      border-radius: 20rpx;

      .location-text {
        font-size: 26rpx;
        color: #007AFF;
        font-weight: 500;
        max-width: 200rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .search-cell {
      flex: 1;

      .search-input {
        display: flex;
        align-items: center;
        gap: 12rpx;
        padding: 16rpx 24rpx;
        background: #F2F2F7;
        border-radius: 20rpx;

        .search-placeholder {
          font-size: 26rpx;
          color: #8E8E93;
        }
      }
    }
  }
}

// 2️⃣ 服务分类快捷入口
.categories-section {
  padding: 40rpx 40rpx 0;

  .category-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32rpx;

    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16rpx;

      .category-icon {
        width: 100rpx;
        height: 100rpx;
        border-radius: 24rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;

        &:active {
          transform: scale(0.95);
        }
      }

      .category-name {
        font-size: 26rpx;
        color: #1D1D1F;
        font-weight: 500;
      }
    }
  }
}

// 3️⃣ 轮播图广告位
.banner-section {
  padding: 40rpx 40rpx 0;

  .banner-container {
    .banner-card {
      height: 320rpx;
      background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
      border-radius: 28rpx;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      padding: 0 48rpx;

      .banner-content {
        flex: 1;
        color: #FFFFFF;

        .banner-title {
          font-size: 40rpx;
          font-weight: 700;
          display: block;
          margin-bottom: 8rpx;
        }

        .banner-subtitle {
          font-size: 28rpx;
          opacity: 0.9;
          display: block;
          margin-bottom: 24rpx;
        }

        .banner-action {
          display: inline-block;
          padding: 12rpx 28rpx;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20rpx;
          font-size: 26rpx;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }
      }

      .banner-visual {
        .color-burst {
          width: 200rpx;
          height: 200rpx;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          position: absolute;
          right: -50rpx;
          top: -50rpx;
        }
      }
    }
  }
}

// 4️⃣ 热门服务推荐
.services-section {
  padding: 40rpx 40rpx 0;

  .section-header {
    margin-bottom: 32rpx;

    .section-title {
      font-size: 36rpx;
      font-weight: 700;
      color: #1D1D1F;
      display: block;
      margin-bottom: 8rpx;
    }

    .section-subtitle {
      font-size: 26rpx;
      color: #8E8E93;
    }
  }

  .services-scroll {
    .service-cards {
      display: flex;
      gap: 24rpx;
      padding-right: 40rpx;

      .service-card {
        flex-shrink: 0;
        width: 220rpx;
        background: #FFFFFF;
        border-radius: 24rpx;
        padding: 32rpx 24rpx;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
        text-align: center;

        .service-image {
          width: 80rpx;
          height: 80rpx;
          border-radius: 20rpx;
          margin: 0 auto 20rpx;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-info {
          .service-title {
            font-size: 28rpx;
            font-weight: 600;
            color: #1D1D1F;
            display: block;
            margin-bottom: 8rpx;
          }

          .service-price {
            font-size: 24rpx;
            color: #007AFF;
            font-weight: 600;
          }
        }
      }
    }
  }
}

// 5️⃣ 器材商城精选
.products-section {
  padding: 40rpx 40rpx 0;

  .section-header {
    margin-bottom: 32rpx;

    .section-title {
      font-size: 36rpx;
      font-weight: 700;
      color: #1D1D1F;
      display: block;
      margin-bottom: 8rpx;
    }

    .section-subtitle {
      font-size: 26rpx;
      color: #8E8E93;
    }
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx;

    .product-card {
      background: #FFFFFF;
      border-radius: 24rpx;
      overflow: hidden;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

      .product-image {
        height: 200rpx;
        position: relative;

        .product-badge {
          position: absolute;
          top: 12rpx;
          right: 12rpx;
          padding: 4rpx 12rpx;
          background: #FF3B30;
          color: #FFFFFF;
          font-size: 20rpx;
          border-radius: 12rpx;
          font-weight: 600;
        }
      }

      .product-info {
        padding: 24rpx;

        .product-name {
          font-size: 28rpx;
          font-weight: 600;
          color: #1D1D1F;
          display: block;
          margin-bottom: 8rpx;
          line-height: 1.4;
        }

        .product-desc {
          font-size: 24rpx;
          color: #8E8E93;
          display: block;
          margin-bottom: 16rpx;
          line-height: 1.3;
        }

        .product-price-row {
          display: flex;
          align-items: center;
          gap: 12rpx;

          .product-price {
            font-size: 28rpx;
            font-weight: 700;
            color: #007AFF;
          }

          .product-original {
            font-size: 22rpx;
            color: #8E8E93;
            text-decoration: line-through;
          }
        }
      }
    }
  }
}

// 6️⃣ 限时促销+优惠券
.promo-section {
  padding: 40rpx 40rpx 0;

  .promo-card {
    height: 200rpx;
    background: linear-gradient(135deg, #FF3B30 0%, #FF453A 100%);
    border-radius: 24rpx;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 0 48rpx;

    .promo-content {
      flex: 1;
      color: #FFFFFF;

      .promo-title {
        font-size: 36rpx;
        font-weight: 700;
        display: block;
        margin-bottom: 8rpx;
      }

      .promo-subtitle {
        font-size: 26rpx;
        opacity: 0.9;
        display: block;
        margin-bottom: 16rpx;
      }

      .promo-code {
        display: inline-block;
        padding: 8rpx 24rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 20rpx;
        font-size: 24rpx;
        font-weight: 600;
        backdrop-filter: blur(10px);
      }
    }

    .promo-visual {
      .promo-glow {
        width: 120rpx;
        height: 120rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        position: absolute;
        right: -30rpx;
        top: -30rpx;
      }
    }
  }
}

// 7️⃣ 服务保障+用户评价
.trust-section {
  padding: 40rpx 40rpx 0;

  .trust-grid {
    display: flex;
    justify-content: space-around;
    background: #FFFFFF;
    border-radius: 24rpx;
    padding: 40rpx 0;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

    .trust-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12rpx;

      .trust-icon {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        background: rgba(0, 122, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .trust-text {
        font-size: 24rpx;
        color: #1D1D1F;
        font-weight: 500;
      }
    }
  }
}

// 8️⃣ 底部悬浮预约按钮
.floating-action {
  position: fixed;
  bottom: 140rpx;
  right: 40rpx;
  z-index: 100;

  .action-button {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 24rpx 40rpx;
    background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
    border-radius: 50rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 122, 255, 0.4);
    color: #FFFFFF;
    font-weight: 600;
    font-size: 28rpx;
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.95);
    }
  }
}

// 触摸反馈
.category-item,
.service-card,
.product-card,
.banner-card,
.promo-card {
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.98);
  }
}
</style>