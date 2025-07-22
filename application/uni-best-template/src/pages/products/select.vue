<route lang="json5">
{
  style: {
    navigationBarTitleText: '商品挑选',
    navigationStyle: 'default',
  },
}
</route>

<template>
  <view class="select-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <wd-search
        v-model="keyword"
        placeholder="搜索商品"
        clearable
        @search="handleSearch"
        @clear="handleClear"
      />
    </view>

    <!-- 分类标签 -->
    <view class="category-tabs">
      <scroll-view scroll-x class="tab-scroll">
        <view class="tab-list">
          <view
            v-for="category in categories"
            :key="category.id"
            class="tab-item"
            :class="{ active: currentCategory === category.id }"
            @tap="changeCategory(category.id)"
          >
            {{ category.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 商品列表 -->
    <scroll-view
      class="product-list"
      scroll-y
      @scrolltolower="loadMore"
      refresher-enabled
      @refresherrefresh="onRefresh"
      :refresher-triggered="refreshing"
    >
      <view class="product-grid">
        <view v-for="product in products" :key="product.id" class="product-card" @tap="goToProductDetail(product)">
          <view class="product-image-wrapper">
            <image :src="product.image" class="product-image" mode="aspectFill" />
            <view class="discount-badge" v-if="product.originalPrice">
              {{ Math.round((1 - product.price / product.originalPrice) * 100) }}折
            </view>
            <view class="sales-badge">月销{{ product.sales }}</view>
          </view>
          <view class="product-info">
            <text class="product-title">{{ product.title }}</text>
            <text class="product-subtitle">{{ product.subtitle }}</text>
            <view class="product-tags">
              <text v-for="tag in product.tags" :key="tag" class="tag">{{ tag }}</text>
            </view>
            <view class="product-price">
              <text class="price">¥{{ product.price }}</text>
              <text class="unit">/{{ product.unit }}</text>
              <text class="original-price" v-if="product.originalPrice">¥{{ product.originalPrice }}</text>
            </view>
            <view class="product-rating">
              <wd-icon name="star-filled" size="24rpx" color="#FFD700" />
              <text class="rating-text">{{ product.rating }}%</text>
              <text class="sales-text">月销{{ product.sales }}</text>
            </view>
            <view class="product-actions">
              <view class="quantity-selector">
                <wd-button
                  size="mini"
                  type="text"
                  :disabled="getQuantity(product.id) <= 0"
                  @click.stop="decreaseQuantity(product)"
                >
                  <wd-icon name="minus" size="32rpx" />
                </wd-button>
                <text class="quantity">{{ getQuantity(product.id) }}</text>
                <wd-button
                  size="mini"
                  type="text"
                  :disabled="getQuantity(product.id) >= product.stock"
                  @click.stop="increaseQuantity(product)"
                >
                  <wd-icon name="plus" size="32rpx" />
                </wd-button>
              </view>
              <wd-button
                size="mini"
                type="primary"
                :disabled="product.stock <= 0"
                @click.stop="addToCart(product)"
              >
                加入购物车
              </wd-button>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-more" v-if="loading">
        <wd-loading />
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="!hasMore && products.length > 0">没有更多了</view>
      <view class="empty" v-if="products.length === 0 && !loading">
        <wd-icon name="shopping-bag" size="120rpx" color="#ddd" />
        <text>暂无商品</text>
      </view>
    </scroll-view>

    <!-- 购物车预览 -->
    <view class="cart-preview" :class="{ expanded: cartExpanded }" v-if="cart.items.length > 0">
      <view class="cart-header" @tap="toggleCart">
        <view class="cart-info">
          <wd-icon name="shopping-cart" size="48rpx" color="#fff" />
          <text class="cart-count">{{ cart.totalCount }}</text>
        </view>
        <view class="cart-amount">
          <text class="amount">¥{{ cart.totalAmount.toFixed(2) }}</text>
          <text class="delivery-fee" v-if="cart.totalAmount > 0">另需配送费¥{{ deliveryFee }}</text>
        </view>
        <view class="cart-toggle">
          <wd-icon :name="cartExpanded ? 'arrow-down' : 'arrow-up'" size="32rpx" color="#fff" />
        </view>
      </view>

      <!-- 购物车详情 -->
      <view class="cart-details" v-if="cartExpanded">
        <view class="cart-title">
          <text>已选商品</text>
          <wd-button type="text" @click="clearCart">清空</wd-button>
        </view>
        <scroll-view class="cart-items" scroll-y>
          <view v-for="item in cart.items" :key="item.product.id" class="cart-item">
            <image :src="item.product.image" class="item-image" />
            <view class="item-info">
              <text class="item-title">{{ item.product.title }}</text>
              <text class="item-price">¥{{ item.product.price }}/{{ item.product.unit }}</text>
            </view>
            <view class="item-quantity">
              <wd-button size="mini" type="text" @click="decreaseQuantity(item.product)">
                <wd-icon name="minus" size="24rpx" />
              </wd-button>
              <text class="quantity">{{ item.quantity }}</text>
              <wd-button size="mini" type="text" @click="increaseQuantity(item.product)">
                <wd-icon name="plus" size="24rpx" />
              </wd-button>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 结算按钮 -->
    <view class="checkout-bar" :class="{ 'has-cart': cart.items.length > 0 }">
      <view class="checkout-info">
        <text class="total-text">合计：</text>
        <text class="total-amount">¥{{ finalAmount.toFixed(2) }}</text>
      </view>
      <wd-button
        type="primary"
        size="large"
        :disabled="cart.items.length === 0"
        @click="goToCheckout"
      >
        去结算 ({{ cart.totalCount }})
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { searchProducts, getCategories, type IProduct, type ICategory } from '@/api/products'

// 分类和商品
const categories = ref<ICategory[]>([
  { id: 'all', name: '全部', icon: 'all' },
  { id: 'waterproof', name: '防水补漏', icon: 'waterproof' },
  { id: 'wall', name: '墙面翻新', icon: 'wall' },
  { id: 'tile', name: '瓷砖修复', icon: 'tile' },
  { id: 'decoration', name: '全屋装修', icon: 'decoration' },
])

// 静态商品数据
const staticProducts: IProduct[] = [
  {
    id: '1',
    title: '专业防水补漏套装',
    subtitle: '卫生间厨房专用，快速止漏',
    price: 89,
    originalPrice: 129,
    unit: '套',
    image: '/static/images/products/waterproof-kit.jpg',
    tags: ['热销', '防水'],
    rating: 98,
    sales: 1250,
    category: 'waterproof',
    description: '专业级防水补漏套装，包含防水涂料、密封胶、工具等全套配件，适用于卫生间、厨房、阳台等区域的防水补漏工程。',
    stock: 50,
    minPurchase: 1,
    maxPurchase: 10,
  },
  {
    id: '2',
    title: '墙面翻新喷漆',
    subtitle: '环保无味，即喷即住',
    price: 45,
    originalPrice: 65,
    unit: '瓶',
    image: '/static/images/products/wall-paint.jpg',
    tags: ['环保', '快速'],
    rating: 96,
    sales: 890,
    category: 'wall',
    description: '环保型墙面翻新喷漆，采用进口原料，无毒无味，遮盖力强，适用于各种墙面翻新工程。',
    stock: 100,
    minPurchase: 1,
    maxPurchase: 20,
  },
  {
    id: '3',
    title: '瓷砖修复胶',
    subtitle: '强力粘合，修复破损瓷砖',
    price: 35,
    originalPrice: 50,
    unit: '支',
    image: '/static/images/products/tile-glue.jpg',
    tags: ['强力', '修复'],
    rating: 94,
    sales: 680,
    category: 'tile',
    description: '专业瓷砖修复胶，强力粘合，可用于修复破损瓷砖、填补缝隙，固化后坚固耐用。',
    stock: 80,
    minPurchase: 1,
    maxPurchase: 15,
  },
  {
    id: '4',
    title: '全屋装修工具箱',
    subtitle: '专业级工具套装，一应俱全',
    price: 299,
    originalPrice: 399,
    unit: '套',
    image: '/static/images/products/toolkit.jpg',
    tags: ['专业', '全套'],
    rating: 99,
    sales: 450,
    category: 'decoration',
    description: '专业级全屋装修工具箱，包含电钻、锤子、螺丝刀、水平仪等30余种工具，满足各种装修需求。',
    stock: 30,
    minPurchase: 1,
    maxPurchase: 5,
  },
  {
    id: '5',
    title: '防水涂料',
    subtitle: '高分子材料，持久防水',
    price: 128,
    originalPrice: 168,
    unit: '桶',
    image: '/static/images/products/waterproof-coating.jpg',
    tags: ['高分子', '持久'],
    rating: 97,
    sales: 720,
    category: 'waterproof',
    description: '高分子防水涂料，具有良好的附着力和弹性，可有效防止渗漏，适用于各种基面。',
    stock: 60,
    minPurchase: 1,
    maxPurchase: 8,
  },
  {
    id: '6',
    title: '墙面修补膏',
    subtitle: '快速修补，平整如新',
    price: 25,
    originalPrice: 35,
    unit: '袋',
    image: '/static/images/products/wall-patch.jpg',
    tags: ['快速', '平整'],
    rating: 93,
    sales: 1560,
    category: 'wall',
    description: '快速墙面修补膏，可填补裂缝、孔洞，干燥后可直接打磨上漆，修复效果平整如新。',
    stock: 200,
    minPurchase: 1,
    maxPurchase: 50,
  },
  {
    id: '7',
    title: '瓷砖美缝剂',
    subtitle: '防水防霉，美观耐用',
    price: 58,
    originalPrice: 78,
    unit: '组',
    image: '/static/images/products/tile-sealer.jpg',
    tags: ['防水', '美观'],
    rating: 95,
    sales: 920,
    category: 'tile',
    description: '专业瓷砖美缝剂，防水防霉，颜色丰富，可美化瓷砖缝隙，提升整体装修效果。',
    stock: 120,
    minPurchase: 1,
    maxPurchase: 25,
  },
  {
    id: '8',
    title: '装修保护膜',
    subtitle: '保护家具，防止污染',
    price: 15,
    originalPrice: 25,
    unit: '卷',
    image: '/static/images/products/protective-film.jpg',
    tags: ['保护', '防污'],
    rating: 91,
    sales: 2100,
    category: 'decoration',
    description: '装修专用保护膜，可保护家具、地板等不被污染，使用方便，撕除无残留。',
    stock: 300,
    minPurchase: 1,
    maxPurchase: 100,
  },
]

const products = ref<IProduct[]>([])
const currentCategory = ref('all')
const keyword = ref('')

// 分页加载
const page = ref(1)
const loading = ref(false)
const hasMore = ref(true)
const refreshing = ref(false)

// 购物车
const cart = reactive({
  items: [] as Array<{ product: IProduct; quantity: number }>,
  get totalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0)
  },
  get totalAmount() {
    return this.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  },
})
const cartExpanded = ref(false)
const deliveryFee = ref(5) // 配送费

// 计算最终金额
const finalAmount = computed(() => {
  return cart.totalAmount + (cart.totalAmount > 0 ? deliveryFee.value : 0)
})

// 获取商品数量
const getQuantity = (productId: string) => {
  const item = cart.items.find((item) => item.product.id === productId)
  return item ? item.quantity : 0
}

// 增加数量
const increaseQuantity = (product: IProduct) => {
  const existingItem = cart.items.find((item) => item.product.id === product.id)
  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++
    }
  } else {
    if (product.stock > 0) {
      cart.items.push({ product, quantity: 1 })
    }
  }
}

// 减少数量
const decreaseQuantity = (product: IProduct) => {
  const index = cart.items.findIndex((item) => item.product.id === product.id)
  if (index > -1) {
    const item = cart.items[index]
    if (item.quantity > 1) {
      item.quantity--
    } else {
      cart.items.splice(index, 1)
    }
  }
}

// 添加到购物车
const addToCart = (product: IProduct) => {
  increaseQuantity(product)
  uni.showToast({
    title: '已加入购物车',
    icon: 'success',
  })
}

// 清空购物车
const clearCart = () => {
  cart.items = []
  cartExpanded.value = false
}

// 切换购物车展开状态
const toggleCart = () => {
  if (cart.items.length > 0) {
    cartExpanded.value = !cartExpanded.value
  }
}

// 使用静态数据搜索商品
const searchProducts = () => {
  if (loading.value) return

  loading.value = true
  
  // 模拟网络延迟
  setTimeout(() => {
    try {
      let filteredProducts = [...staticProducts]
      
      // 按分类筛选
      if (currentCategory.value !== 'all') {
        filteredProducts = filteredProducts.filter(
          product => product.category === currentCategory.value
        )
      }
      
      // 按关键词搜索
      if (keyword.value.trim()) {
        const searchTerm = keyword.value.toLowerCase()
        filteredProducts = filteredProducts.filter(
          product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.subtitle.toLowerCase().includes(searchTerm) ||
            product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        )
      }
      
      // 模拟分页
      const startIndex = (page.value - 1) * 10
      const endIndex = startIndex + 10
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
      
      if (page.value === 1) {
        products.value = paginatedProducts
      } else {
        products.value.push(...paginatedProducts)
      }
      
      hasMore.value = endIndex < filteredProducts.length
    } catch (error) {
      console.error('加载商品失败', error)
      uni.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }, 800) // 模拟网络延迟800ms
}

// 切换分类
const changeCategory = (categoryId: string) => {
  if (currentCategory.value === categoryId) return

  currentCategory.value = categoryId
  page.value = 1
  products.value = []
  searchProducts()
}

// 搜索
const handleSearch = () => {
  page.value = 1
  products.value = []
  searchProducts()
}

const handleClear = () => {
  keyword.value = ''
  page.value = 1
  searchProducts()
}

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return
  page.value++
  searchProducts()
}

// 下拉刷新
const onRefresh = () => {
  page.value = 1
  products.value = []
  searchProducts()
}

// 跳转到商品详情
const goToProductDetail = (product: IProduct) => {
  uni.navigateTo({
    url: `/pages/products/detail?id=${product.id}`,
  })
}

// 去结算
const goToCheckout = () => {
  if (cart.items.length === 0) return

  const cartData = {
    items: cart.items,
    totalAmount: finalAmount.value,
    deliveryFee: deliveryFee.value,
  }

  uni.setStorageSync('cart_data', cartData)
  uni.navigateTo({
    url: '/pages/products/checkout',
  })
}

onLoad((options) => {
  if (options.category) {
    currentCategory.value = options.category
  }
  if (options.keyword) {
    keyword.value = options.keyword
  }
  searchProducts()
})

onMounted(() => {
  // 页面加载时直接显示全部商品
  searchProducts()
})
</script>

<style lang="scss" scoped>
.select-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: 20rpx;
  background-color: #fff;
}

.category-tabs {
  background-color: #fff;
  border-bottom: 1rpx solid #eee;

  .tab-scroll {
    white-space: nowrap;
  }

  .tab-list {
    display: flex;
    padding: 0 20rpx;
  }

  .tab-item {
    padding: 20rpx 40rpx;
    font-size: 28rpx;
    color: #666;
    position: relative;
    white-space: nowrap;

    &.active {
      color: #3d9c40;
      font-weight: bold;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background-color: #3d9c40;
        border-radius: 2rpx;
      }
    }
  }
}

.product-list {
  flex: 1;
  padding: 20rpx;
  padding-bottom: 240rpx;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.product-card {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  .product-image-wrapper {
    position: relative;
    width: 100%;
    height: 240rpx;

    .product-image {
      width: 100%;
      height: 100%;
    }

    .discount-badge {
      position: absolute;
      top: 12rpx;
      right: 12rpx;
      background: linear-gradient(135deg, #ff4757, #ff6b7a);
      color: #fff;
      padding: 4rpx 12rpx;
      border-radius: 12rpx;
      font-size: 20rpx;
      font-weight: bold;
    }

    .sales-badge {
      position: absolute;
      top: 12rpx;
      left: 12rpx;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      padding: 4rpx 8rpx;
      border-radius: 8rpx;
      font-size: 20rpx;
    }
  }

  .product-info {
    padding: 20rpx;

    .product-title {
      display: block;
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 8rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-subtitle {
      display: block;
      font-size: 24rpx;
      color: #666;
      margin-bottom: 12rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;
      margin-bottom: 12rpx;

      .tag {
        padding: 4rpx 8rpx;
        background: rgba(44, 114, 44, 0.1);
        color: #2c722c;
        font-size: 20rpx;
        border-radius: 12rpx;
      }
    }

    .product-price {
      display: flex;
      align-items: baseline;
      gap: 8rpx;
      margin-bottom: 12rpx;

      .price {
        font-size: 32rpx;
        font-weight: bold;
        color: #ff4757;
      }

      .unit {
        font-size: 24rpx;
        color: #999;
      }

      .original-price {
        font-size: 24rpx;
        color: #999;
        text-decoration: line-through;
      }
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-bottom: 16rpx;

      .rating-text {
        font-size: 22rpx;
        color: #666;
      }

      .sales-text {
        font-size: 22rpx;
        color: #999;
        margin-left: 8rpx;
      }
    }

    .product-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .quantity-selector {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .quantity {
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
          min-width: 40rpx;
          text-align: center;
        }
      }
    }
  }
}

.cart-preview {
  position: fixed;
  bottom: 120rpx;
  left: 20rpx;
  right: 20rpx;
  background-color: #333;
  border-radius: 48rpx;
  color: #fff;
  z-index: 1000;
  transition: all 0.3s ease;
  max-height: 80rpx;
  overflow: hidden;

  &.expanded {
    max-height: 600rpx;
    border-radius: 24rpx 24rpx 0 0;
    bottom: 100rpx;
  }

  .cart-header {
    display: flex;
    align-items: center;
    padding: 20rpx 30rpx;
    height: 80rpx;

    .cart-info {
      display: flex;
      align-items: center;
      gap: 16rpx;

      .cart-count {
        background-color: #ff4757;
        color: #fff;
        border-radius: 50%;
        width: 40rpx;
        height: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24rpx;
        font-weight: bold;
      }
    }

    .cart-amount {
      flex: 1;
      margin-left: 30rpx;

      .amount {
        font-size: 32rpx;
        font-weight: bold;
      }

      .delivery-fee {
        font-size: 24rpx;
        color: #ccc;
        margin-left: 16rpx;
      }
    }

    .cart-toggle {
      display: flex;
      align-items: center;
    }
  }

  .cart-details {
    .cart-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx 30rpx;
      border-top: 1rpx solid rgba(255, 255, 255, 0.1);
      font-size: 28rpx;
    }

    .cart-items {
      max-height: 400rpx;
      padding: 0 30rpx;

      .cart-item {
        display: flex;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);

        &:last-child {
          border-bottom: none;
        }

        .item-image {
          width: 80rpx;
          height: 80rpx;
          border-radius: 8rpx;
          margin-right: 20rpx;
          background-color: #fff;
        }

        .item-info {
          flex: 1;
          min-width: 0;

          .item-title {
            display: block;
            font-size: 28rpx;
            margin-bottom: 8rpx;
            color: #fff;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .item-price {
            font-size: 24rpx;
            color: #ccc;
          }
        }

        .item-quantity {
          display: flex;
          align-items: center;
          gap: 16rpx;
          flex-shrink: 0;

          .quantity {
            font-size: 28rpx;
            font-weight: bold;
            color: #fff;
            min-width: 40rpx;
            text-align: center;
          }
        }
      }
    }
  }
}

.checkout-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.1);
  z-index: 999;
  transition: all 0.3s ease;

  &.has-cart {
    bottom: 0;
  }

  .checkout-info {
    .total-text {
      font-size: 28rpx;
      color: #666;
    }

    .total-amount {
      font-size: 36rpx;
      font-weight: bold;
      color: #ff4757;
    }
  }
}

.loading-more,
.no-more,
.empty {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}
</style>
