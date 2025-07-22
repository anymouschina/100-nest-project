<route lang="json5">
{
  style: {
    navigationBarTitleText: '商品搜索',
    navigationStyle: 'default',
  },
}
</route>

<template>
  <view class="search-container">
    <!-- 搜索栏 -->
    <view class="search-header">
      <view class="search-bar">
        <wd-search
          v-model="keyword"
          placeholder="搜索商品或服务"
          clearable
          @search="handleSearch"
          @clear="handleClear"
          @input="handleInput"
        />
      </view>
      <wd-button size="small" type="primary" @click="handleSearch">搜索</wd-button>
    </view>

    <!-- 搜索历史 -->
    <view class="search-history" v-if="showHistory && searchHistory.length > 0">
      <view class="section-header">
        <text class="section-title">搜索历史</text>
        <wd-button type="text" @click="clearHistory">清空</wd-button>
      </view>
      <view class="history-tags">
        <wd-button
          v-for="item in searchHistory"
          :key="item"
          type="text"
          size="small"
          custom-class="history-tag"
          @click="selectHistory(item)"
        >
          {{ item }}
        </wd-button>
      </view>
    </view>

    <!-- 热门搜索 -->
    <view class="hot-search" v-if="showHistory">
      <view class="section-header">
        <text class="section-title">热门搜索</text>
      </view>
      <view class="hot-tags">
        <wd-button
          v-for="item in hotKeywords"
          :key="item"
          type="text"
          size="small"
          custom-class="hot-tag"
          @click="selectHot(item)"
        >
          {{ item }}
        </wd-button>
      </view>
    </view>

    <!-- 搜索结果 -->
    <scroll-view
      v-if="!showHistory"
      class="search-results"
      scroll-y
      @scrolltolower="loadMore"
    >
      <view class="filter-bar">
        <view
          class="filter-item"
          :class="{ active: sortBy === 'default' }"
          @click="changeSort('default')"
        >
          综合
        </view>
        <view
          class="filter-item"
          :class="{ active: sortBy === 'sales' }"
          @click="changeSort('sales')"
        >
          销量
        </view>
        <view
          class="filter-item"
          :class="{ active: sortBy === 'price' }"
          @click="changeSort('price')"
        >
          价格
          <wd-icon
            :name="sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'"
            size="20rpx"
            v-if="sortBy === 'price'"
          />
        </view>
      </view>

      <view class="result-list">
        <view
          v-for="item in products"
          :key="item.id"
          class="product-item"
          @click="goToDetail(item)"
        >
          <image :src="item.image" mode="aspectFill" class="product-image" />
          <view class="product-info">
            <text class="product-title">{{ item.title }}</text>
            <text class="product-subtitle">{{ item.subtitle }}</text>
            <view class="product-tags">
              <text
                v-for="tag in item.tags.slice(0, 2)"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </text>
            </view>
            <view class="product-price">
              <text class="price">¥{{ item.price }}</text>
              <text class="unit">/{{ item.unit }}</text>
              <text v-if="item.originalPrice" class="original-price">
                ¥{{ item.originalPrice }}
              </text>
            </view>
            <view class="product-stats">
              <text>已售{{ item.sales }}</text>
              <text class="rating">⭐{{ item.rating }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-more" v-if="loading">
        <wd-loading />
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="noMore && products.length > 0">
        没有更多了
      </view>
      <view class="empty" v-if="products.length === 0 && !loading">
        <wd-icon name="search" size="80rpx" color="#999" />
        <text>没有找到相关商品</text>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { searchProducts } from '@/api/products'
import type { IProduct, ISearchParams } from '@/api/products'

// 搜索相关
const keyword = ref('')
const showHistory = ref(true)
const searchHistory = ref<string[]>([])
const hotKeywords = ref(['防水补漏', '墙面翻新', '瓷砖修复', '全屋装修', '局部改造'])

// 搜索参数
const searchParams = reactive<ISearchParams>({
  keyword: '',
  page: 1,
  limit: 10,
  sortBy: 'default',
  sortOrder: 'desc'
})

// 搜索结果
const products = ref<IProduct[]>([])
const loading = ref(false)
const noMore = ref(false)

// 搜索历史本地存储
const HISTORY_KEY = 'search_history'

// 加载搜索历史
const loadSearchHistory = () => {
  try {
    const history = uni.getStorageSync(HISTORY_KEY)
    if (history && Array.isArray(history)) {
      searchHistory.value = history.slice(0, 10) // 最多保存10条
    }
  } catch (e) {
    console.error('加载搜索历史失败', e)
  }
}

// 保存搜索历史
const saveSearchHistory = () => {
  try {
    uni.setStorageSync(HISTORY_KEY, searchHistory.value)
  } catch (e) {
    console.error('保存搜索历史失败', e)
  }
}

// 添加搜索历史
const addSearchHistory = (keyword: string) => {
  if (!keyword.trim()) return
  
  const cleanKeyword = keyword.trim()
  const index = searchHistory.value.indexOf(cleanKeyword)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }
  searchHistory.value.unshift(cleanKeyword)
  if (searchHistory.value.length > 10) {
    searchHistory.value.pop()
  }
  saveSearchHistory()
}

// 清除搜索历史
const clearHistory = () => {
  searchHistory.value = []
  saveSearchHistory()
}

// 选择历史记录
const selectHistory = (item: string) => {
  keyword.value = item
  handleSearch()
}

// 选择热门搜索
const selectHot = (item: string) => {
  keyword.value = item
  handleSearch()
}

// 搜索
const handleSearch = async () => {
  if (!keyword.value.trim()) {
    uni.showToast({ title: '请输入搜索关键词', icon: 'none' })
    return
  }

  searchParams.keyword = keyword.value.trim()
  searchParams.page = 1
  showHistory.value = false
  loading.value = true

  try {
    const result = await searchProducts(searchParams)
    products.value = result.products
    noMore.value = result.products.length < searchParams.limit
    
    // 添加到搜索历史
    addSearchHistory(searchParams.keyword)
  } catch (error) {
    console.error('搜索失败', error)
    uni.showToast({ title: '搜索失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 清空搜索
const handleClear = () => {
  keyword.value = ''
  showHistory.value = true
  products.value = []
}

// 输入处理
const handleInput = () => {
  if (!keyword.value.trim()) {
    showHistory.value = true
    products.value = []
  }
}

// 切换排序
const changeSort = (sort: string) => {
  if (sort === searchParams.sortBy) {
    if (sort === 'price') {
      searchParams.sortOrder = searchParams.sortOrder === 'asc' ? 'desc' : 'asc'
    }
  } else {
    searchParams.sortBy = sort
    searchParams.sortOrder = 'desc'
  }
  
  searchParams.page = 1
  handleSearch()
}

// 加载更多
const loadMore = async () => {
  if (loading.value || noMore.value) return
  
  searchParams.page++
  loading.value = true
  
  try {
    const result = await searchProducts(searchParams)
    products.value.push(...result.products)
    noMore.value = result.products.length < searchParams.limit
  } catch (error) {
    console.error('加载更多失败', error)
  } finally {
    loading.value = false
  }
}

// 跳转到商品详情
const goToDetail = (product: IProduct) => {
  uni.navigateTo({
    url: `/pages/products/detail?id=${product.id}`
  })
}

onLoad((options) => {
  loadSearchHistory()
  if (options.keyword) {
    keyword.value = options.keyword
    handleSearch()
  }
})
</script>

<style lang="scss" scoped>
.search-container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  gap: 20rpx;

  .search-bar {
    flex: 1;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 30rpx 20rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
}

.history-tags,
.hot-tags {
  padding: 0 30rpx 30rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;

  :deep(.wd-button) {
    margin: 0;
    background-color: #f5f5f5;
    color: #666;
    border-radius: 8rpx;
    padding: 16rpx 24rpx;
  }
}

.hot-tags :deep(.wd-button) {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.filter-bar {
  display: flex;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;

  .filter-item {
    flex: 1;
    text-align: center;
    padding: 30rpx 0;
    font-size: 28rpx;
    color: #666;
    position: relative;

    &.active {
      color: #3d9c40;
      font-weight: bold;
    }

    &:after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60rpx;
      height: 4rpx;
      background-color: #3d9c40;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &.active:after {
      opacity: 1;
    }
  }
}

.result-list {
  padding: 20rpx;
}

.product-item {
  display: flex;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 20rpx;
  gap: 20rpx;

  .product-image {
    width: 180rpx;
    height: 180rpx;
    border-radius: 8rpx;
    flex-shrink: 0;
  }

  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .product-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      line-height: 1.4;
    }

    .product-subtitle {
      font-size: 28rpx;
      color: #666;
      margin: 10rpx 0;
    }

    .product-tags {
      display: flex;
      gap: 10rpx;
      margin: 10rpx 0;

      .tag {
        font-size: 20rpx;
        color: #ff4d4f;
        background-color: #fff1f0;
        padding: 4rpx 8rpx;
        border-radius: 4rpx;
      }
    }

    .product-price {
      display: flex;
      align-items: baseline;
      gap: 8rpx;

      .price {
        font-size: 36rpx;
        font-weight: bold;
        color: #ff4d4f;
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

    .product-stats {
      display: flex;
      justify-content: space-between;
      font-size: 24rpx;
      color: #999;
      margin-top: 10rpx;
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