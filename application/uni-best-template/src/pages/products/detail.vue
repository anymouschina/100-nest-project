<route lang="json5">
{
  style: {
    navigationBarTitleText: '商品详情',
    navigationStyle: 'default',
  },
}
</route>

<template>
  <view class="product-detail" v-if="product">
    <!-- 商品图片轮播 -->
    <view class="image-section">
      <swiper class="image-swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500">
        <swiper-item v-for="(image, index) in product.images" :key="index">
          <image :src="image" class="product-image" mode="aspectFill" />
        </swiper-item>
      </swiper>
      <view class="image-indicator">
        <text class="indicator-text">{{ currentImageIndex }}/{{ product.images?.length || 1 }}</text>
      </view>
    </view>

    <!-- 商品信息 -->
    <view class="info-section">
      <view class="price-row">
        <text class="current-price">¥{{ product.price }}</text>
        <text class="original-price" v-if="product.originalPrice">¥{{ product.originalPrice }}</text>
        <view class="discount-badge" v-if="product.originalPrice">
          {{ Math.round((1 - product.price / product.originalPrice) * 100) }}折
        </view>
      </view>
      
      <view class="product-title">
        <text class="title-text">{{ product.title }}</text>
      </view>
      
      <view class="product-subtitle">
        <text class="subtitle-text">{{ product.subtitle }}</text>
      </view>

      <view class="product-tags">
        <text v-for="tag in product.tags" :key="tag" class="tag">{{ tag }}</text>
      </view>

      <view class="product-stats">
        <view class="stat-item">
          <text class="stat-label">月销量</text>
          <text class="stat-value">{{ product.sales || 0 }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">好评率</text>
          <text class="stat-value">{{ product.rating || 0 }}%</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">库存</text>
          <text class="stat-value">{{ product.stock || 0 }}{{ product.unit }}</text>
        </view>
      </view>
    </view>

    <!-- 商品规格选择 -->
    <view class="spec-section" v-if="product.specs && product.specs.length > 0">
      <view class="section-header">
        <text class="section-title">选择规格</text>
      </view>
      <view class="spec-list">
        <view 
          v-for="spec in product.specs" 
          :key="spec.id"
          class="spec-item"
          :class="{ active: selectedSpecs[spec.name] === spec.value }"
          @tap="selectSpec(spec.name, spec.value)"
        >
          {{ spec.value }}
        </view>
      </view>
    </view>

    <!-- 购买数量 -->
    <view class="quantity-section">
      <view class="section-header">
        <text class="section-title">购买数量</text>
        <text class="stock-info">库存{{ product.stock }}{{ product.unit }}</text>
      </view>
      <view class="quantity-selector">
        <wd-button
          size="small"
          type="text"
          :disabled="quantity <= (product.minPurchase || 1)"
          @tap="decreaseQuantity"
        >
          <wd-icon name="minus" size="24rpx" />
        </wd-button>
        <text class="quantity-text">{{ quantity }}</text>
        <wd-button
          size="small"
          type="text"
          :disabled="quantity >= Math.min(product.stock, product.maxPurchase || product.stock)"
          @tap="increaseQuantity"
        >
          <wd-icon name="plus" size="24rpx" />
        </wd-button>
      </view>
    </view>

    <!-- 商品详情 -->
    <view class="detail-section">
      <view class="section-header">
        <text class="section-title">商品详情</text>
      </view>
      <view class="detail-content">
        <rich-text :nodes="product.description || '暂无商品详情'"></rich-text>
      </view>
    </view>

    <!-- 用户评价 -->
    <view class="reviews-section" v-if="reviews.length > 0">
      <view class="section-header">
        <text class="section-title">用户评价</text>
        <text class="review-count">{{ reviews.length }}条评价</text>
      </view>
      <view class="review-list">
        <view v-for="review in reviews.slice(0, 3)" :key="review.id" class="review-item">
          <view class="review-header">
            <image :src="review.avatar" class="reviewer-avatar" />
            <view class="reviewer-info">
              <text class="reviewer-name">{{ review.name }}</text>
              <view class="rating">
                <wd-icon v-for="i in 5" :key="i" :name="i <= review.rating ? 'star-filled' : 'star'" size="20rpx" color="#FFD700" />
              </view>
            </view>
          </view>
          <text class="review-content">{{ review.content }}</text>
          <view class="review-images" v-if="review.images">
            <image v-for="img in review.images" :key="img" :src="img" class="review-image" mode="aspectFill" />
          </view>
        </view>
      </view>
      <view class="view-all-reviews" v-if="reviews.length > 3" @tap="goToReviews">
        <text>查看全部评价</text>
        <wd-icon name="arrow-right" size="24rpx" />
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="left-actions">
        <view class="action-item" @tap="addToFavorite">
          <wd-icon :name="isFavorite ? 'heart-filled' : 'heart'" size="48rpx" :color="isFavorite ? '#ff4757' : '#666'" />
          <text class="action-text">收藏</text>
        </view>
        <view class="action-item" @tap="goToCart">
          <wd-icon name="shopping-cart" size="48rpx" color="#666" />
          <text class="action-text">购物车</text>
          <view class="cart-badge" v-if="cartCount > 0">{{ cartCount }}</view>
        </view>
      </view>
      <view class="right-actions">
        <wd-button
          size="large"
          type="secondary"
          :disabled="!canAddToCart"
          @tap="addToCart"
        >
          加入购物车
        </wd-button>
        <wd-button
          size="large"
          type="primary"
          :disabled="!canBuyNow"
          @tap="buyNow"
        >
          立即购买
        </wd-button>
      </view>
    </view>

    <!-- 规格选择弹窗 -->
    <wd-action-sheet v-model="showSpecSheet" title="选择规格">
      <view class="spec-sheet-content">
        <view class="spec-product-info">
          <image :src="product.images[0]" class="spec-product-image" />
          <view class="spec-product-detail">
            <text class="spec-product-price">¥{{ product.price }}</text>
            <text class="spec-product-stock">库存{{ product.stock }}{{ product.unit }}</text>
            <text class="spec-product-selected">已选：{{ selectedSpecText }}</text>
          </view>
        </view>
        
        <view class="spec-options" v-if="product.specs">
          <view v-for="specGroup in groupedSpecs" :key="specGroup.name" class="spec-group">
            <text class="spec-group-title">{{ specGroup.name }}</text>
            <view class="spec-group-options">
              <view
                v-for="option in specGroup.options"
                :key="option"
                class="spec-option"
                :class="{ active: selectedSpecs[specGroup.name] === option }"
                @tap="selectSpec(specGroup.name, option)"
              >
                {{ option }}
              </view>
            </view>
          </view>
        </view>

        <view class="spec-quantity">
          <text class="spec-quantity-label">数量</text>
          <view class="spec-quantity-selector">
            <wd-button
              size="small"
              type="text"
              :disabled="quantity <= (product.minPurchase || 1)"
              @tap="decreaseQuantity"
            >
              <wd-icon name="minus" size="24rpx" />
            </wd-button>
            <text class="spec-quantity-text">{{ quantity }}</text>
            <wd-button
              size="small"
              type="text"
              :disabled="quantity >= Math.min(product.stock, product.maxPurchase || product.stock)"
              @tap="increaseQuantity"
            >
              <wd-icon name="plus" size="24rpx" />
            </wd-button>
          </view>
        </view>

        <view class="spec-actions">
          <wd-button
            size="large"
            type="secondary"
            :disabled="!canAddToCart"
            @tap="addToCart"
          >
            加入购物车
          </wd-button>
          <wd-button
            size="large"
            type="primary"
            :disabled="!canBuyNow"
            @tap="buyNow"
          >
            立即购买
          </wd-button>
        </view>
      </view>
    </wd-action-sheet>
  </view>

  <!-- 加载状态 -->
  <view class="loading" v-else>
    <wd-loading />
    <text>加载中...</text>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getProductDetail, type IProduct } from '@/api/products'

// 商品数据
const product = ref<IProduct | null>(null)
const reviews = ref([])
const loading = ref(true)

// 选择状态
const quantity = ref(1)
const selectedSpecs = ref<Record<string, string>>({})
const isFavorite = ref(false)
const cartCount = ref(0)
const showSpecSheet = ref(false)
const currentImageIndex = ref(1)

// 计算属性
const canAddToCart = computed(() => {
  return product.value && product.value.stock > 0
})

const canBuyNow = computed(() => {
  return product.value && product.value.stock > 0
})

const selectedSpecText = computed(() => {
  const specs = Object.entries(selectedSpecs.value)
    .map(([key, value]) => value)
    .join('、')
  return specs || '默认规格'
})

const groupedSpecs = computed(() => {
  if (!product.value?.specs) return []
  
  const groups: Record<string, { name: string, options: string[] }> = {}
  product.value.specs.forEach(spec => {
    if (!groups[spec.name]) {
      groups[spec.name] = { name: spec.name, options: [] }
    }
    if (!groups[spec.name].options.includes(spec.value)) {
      groups[spec.name].options.push(spec.value)
    }
  })
  return Object.values(groups)
})

// 方法
const loadProductDetail = async (productId: string) => {
  try {
    loading.value = true
    const data = await getProductDetail(productId)
    product.value = {
      ...data,
      images: data.images || [data.image],
      specs: data.specs || []
    }
    
    // 模拟加载评价数据
    loadReviews()
  } catch (error) {
    console.error('加载商品详情失败:', error)
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const loadReviews = () => {
  reviews.value = [
    {
      id: 1,
      name: '张先生',
      avatar: '/static/images/avatar1.jpg',
      rating: 5,
      content: '质量很好，做工精细，价格实惠，推荐购买！',
      images: []
    },
    {
      id: 2,
      name: '李女士',
      avatar: '/static/images/avatar2.jpg',
      rating: 4,
      content: '商品不错，物流很快，包装完好，满意！',
      images: []
    }
  ]
}

const selectSpec = (name: string, value: string) => {
  selectedSpecs.value[name] = value
}

const increaseQuantity = () => {
  if (product.value && quantity.value < Math.min(product.value.stock, product.value.maxPurchase || product.value.stock)) {
    quantity.value++
  }
}

const decreaseQuantity = () => {
  if (quantity.value > (product.value?.minPurchase || 1)) {
    quantity.value--
  }
}

const addToCart = () => {
  if (!canAddToCart.value) return
  
  uni.showToast({
    title: '已加入购物车',
    icon: 'success'
  })
  cartCount.value++
  showSpecSheet.value = false
}

const buyNow = () => {
  if (!canBuyNow.value) return
  
  uni.navigateTo({
    url: '/pages/products/checkout'
  })
  showSpecSheet.value = false
}

const addToFavorite = () => {
  isFavorite.value = !isFavorite.value
  uni.showToast({
    title: isFavorite.value ? '已收藏' : '取消收藏',
    icon: 'success'
  })
}

const goToCart = () => {
  uni.switchTab({
    url: '/pages/cart/index'
  })
}

const goToReviews = () => {
  uni.navigateTo({
    url: `/pages/products/reviews?id=${product.value?.id}`
  })
}

const onSwiperChange = (e: any) => {
  currentImageIndex.value = e.detail.current + 1
}

onLoad((options: any) => {
  const { id } = options
  if (id) {
    loadProductDetail(id)
  } else {
    uni.showToast({
      title: '商品ID不存在',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

onMounted(() => {
  // 获取购物车数量
  cartCount.value = uni.getStorageSync('cart_count') || 0
})
</script>

<style lang="scss" scoped>
.product-detail {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 120rpx;
}

.image-section {
  position: relative;
  height: 750rpx;

  .image-swiper {
    height: 100%;
  }

  .product-image {
    width: 100%;
    height: 100%;
  }

  .image-indicator {
    position: absolute;
    right: 30rpx;
    bottom: 30rpx;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
  }
}

.info-section {
  padding: 30rpx;
  background: #fff;
  margin-bottom: 20rpx;

  .price-row {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 20rpx;

    .current-price {
      font-size: 48rpx;
      font-weight: bold;
      color: #ff4757;
    }

    .original-price {
      font-size: 32rpx;
      color: #999;
      text-decoration: line-through;
    }

    .discount-badge {
      background: #ff4757;
      color: #fff;
      padding: 4rpx 12rpx;
      border-radius: 16rpx;
      font-size: 24rpx;
    }
  }

  .product-title {
    margin-bottom: 16rpx;

    .title-text {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      line-height: 1.4;
    }
  }

  .product-subtitle {
    margin-bottom: 20rpx;

    .subtitle-text {
      font-size: 28rpx;
      color: #666;
      line-height: 1.5;
    }
  }

  .product-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-bottom: 30rpx;

    .tag {
      background: rgba(44, 114, 44, 0.1);
      color: #2c722c;
      padding: 8rpx 16rpx;
      border-radius: 16rpx;
      font-size: 24rpx;
    }
  }

  .product-stats {
    display: flex;
    justify-content: space-between;
    padding-top: 30rpx;
    border-top: 1rpx solid #eee;

    .stat-item {
      text-align: center;

      .stat-label {
        display: block;
        font-size: 24rpx;
        color: #999;
        margin-bottom: 8rpx;
      }

      .stat-value {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }
  }
}

.spec-section,
.quantity-section,
.detail-section,
.reviews-section {
  background: #fff;
  margin-bottom: 20rpx;
  padding: 30rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
}

.spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;

  .spec-item {
    padding: 12rpx 24rpx;
    border: 1rpx solid #ddd;
    border-radius: 8rpx;
    font-size: 28rpx;
    color: #666;

    &.active {
      border-color: #2c722c;
      color: #2c722c;
      background: rgba(44, 114, 44, 0.1);
    }
  }
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 20rpx;

  .quantity-text {
    min-width: 60rpx;
    text-align: center;
    font-size: 32rpx;
    font-weight: bold;
  }
}

.detail-content {
  font-size: 28rpx;
  line-height: 1.6;
  color: #666;
}

.review-list {
  .review-item {
    padding: 24rpx 0;
    border-bottom: 1rpx solid #eee;

    &:last-child {
      border-bottom: none;
    }

    .review-header {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 16rpx;

      .reviewer-avatar {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
      }

      .reviewer-info {
        .reviewer-name {
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
        }
      }
    }

    .review-content {
      font-size: 28rpx;
      color: #666;
      line-height: 1.5;
      margin-bottom: 16rpx;
    }

    .review-images {
      display: flex;
      gap: 12rpx;
      flex-wrap: wrap;

      .review-image {
        width: 160rpx;
        height: 160rpx;
        border-radius: 8rpx;
      }
    }
  }
}

.view-all-reviews {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx;
  color: #007AFF;
  font-size: 28rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.1);

  .left-actions {
    display: flex;
    gap: 40rpx;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4rpx;
      position: relative;

      .action-text {
        font-size: 20rpx;
        color: #666;
      }

      .cart-badge {
        position: absolute;
        top: -8rpx;
        right: -8rpx;
        background: #ff4757;
        color: #fff;
        width: 32rpx;
        height: 32rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20rpx;
      }
    }
  }

  .right-actions {
    display: flex;
    gap: 16rpx;

    .wd-button {
      min-width: 200rpx;
    }
  }
}

.spec-sheet-content {
  padding: 30rpx;

  .spec-product-info {
    display: flex;
    gap: 20rpx;
    margin-bottom: 30rpx;
    padding-bottom: 30rpx;
    border-bottom: 1rpx solid #eee;

    .spec-product-image {
      width: 160rpx;
      height: 160rpx;
      border-radius: 8rpx;
    }

    .spec-product-detail {
      flex: 1;

      .spec-product-price {
        font-size: 36rpx;
        font-weight: bold;
        color: #ff4757;
        margin-bottom: 8rpx;
      }

      .spec-product-stock {
        font-size: 24rpx;
        color: #999;
        margin-bottom: 8rpx;
      }

      .spec-product-selected {
        font-size: 24rpx;
        color: #666;
      }
    }
  }

  .spec-group {
    margin-bottom: 30rpx;

    .spec-group-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 16rpx;
    }

    .spec-group-options {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;

      .spec-option {
        padding: 12rpx 24rpx;
        border: 1rpx solid #ddd;
        border-radius: 8rpx;
        font-size: 28rpx;
        color: #666;

        &.active {
          border-color: #2c722c;
          color: #2c722c;
          background: rgba(44, 114, 44, 0.1);
        }
      }
    }
  }

  .spec-quantity {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .spec-quantity-label {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
    }

    .spec-quantity-selector {
      display: flex;
      align-items: center;
      gap: 20rpx;

      .spec-quantity-text {
        min-width: 60rpx;
        text-align: center;
        font-size: 32rpx;
        font-weight: bold;
      }
    }
  }

  .spec-actions {
    display: flex;
    gap: 16rpx;

    .wd-button {
      flex: 1;
    }
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 20rpx;
  color: #999;
  font-size: 28rpx;
}
</style>