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
          v-model="searchKeyword"
          placeholder="搜索商品或服务"
          :clearable="true"
          @search="handleSearch"
          @clear="handleClear"
        />
      </view>
      <view class="search-btn" @tap="handleSearch">搜索</view>
    </view>

    <!-- 搜索历史 -->
    <view class="search-history" v-if="!searchKeyword && searchHistory.length">
      <view class="history-header">
        <text class="history-title">搜索历史</text>
        <wd-icon name="delete" size="32rpx" color="#999" @tap="clearHistory" />
      </view>
      <view class="history-tags">
        <view
          v-for="item in searchHistory"
          :key="item"
          class="history-tag"
          @tap="selectHistory(item)"
        >
          {{ item }}
        </view>
      </view>
    </view>

    <!-- 热门搜索 -->
    <view class="hot-search" v-if="!searchKeyword">
      <view class="hot-header">
        <text class="hot-title">热门搜索</text>
      </view>
      <view class="hot-tags">
        <view
          v-for="(item, index) in hotKeywords"
          :key="item"
          class="hot-tag"
          :class="{ primary: index < 3 }"
          @tap="selectHot(item)"
        >
          {{ item }}
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view class="search-results" v-if="searchKeyword">
      <!-- 筛选栏 -->
      <view class="filter-bar">
        <view
          v-for="item in filterOptions"
          :key="item.value"
          class="filter-item"
          :class="{ active: currentFilter === item.value }"
          @tap="changeFilter(item.value)"
        >
          {{ item.label }}
        </view>
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
          <view
            v-for="product in products"
            :key="product.id"
            class="product-item"
            @tap="goToProduct(product)"
          >
            <image :src="product.image" class="product-image" mode="aspectFill" />
            <view class="product-info">
              <text class="product-title">{{ product.title }}</text>
              <text class="product-subtitle">{{ product.subtitle }}</text>
              <view class="product-price">
                <text class="price">¥{{ product.price }}</text>
                <text class="unit">/{{ product.unit }}</text>
                <text class="original-price" v-if="product.originalPrice">
                  ¥{{ product.originalPrice }}
                </text>
              </view>
              <view class="product-tags">
                <text v-for="tag in product.tags.slice(0, 2)" :key="tag" class="tag">
                  {{ tag }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载状态 -->
        <view class="loading-more" v-if="loading">
          <wd-loading />
          <text>加载中...</text>
        </view>
        <view class="no-more" v-if="!hasMore && products.length > 0">
          没有更多了
        </view>
        <view class="empty" v-if="!loading && products.length === 0">
          <wd-icon name="search" size="120rpx" color="#ddd" />
          <text>暂无搜索结果</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { searchProducts, getHotProducts, type IProduct, type ISearchParams } from '@/api/products'
import useRequest from '@/hooks/useRequest'

// 搜索相关
const searchKeyword = ref('')
const searchHistory = ref<string[]>([])
const hotKeywords = ref(['防水补漏', '墙面翻新', '瓷砖修复', '全屋装修', '局部维修'])

// 筛选选项
const filterOptions = [
  { label: '综合', value: 'default' },
  { label: '价格', value: 'price' },
  { label: '销量', value: 'sales' },
  { label: '好评', value: 'rating' },
]

// 商品数据
const products = ref<IProduct[]>([])
const currentFilter = ref('default')
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const page = ref(1)

// 搜索参数
const searchParams = reactive<ISearchParams>({
  keyword: '',
  sortBy: 'default',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
})

// 加载搜索历史
const loadSearchHistory = () => {
  try {
    const history = uni.getStorageSync('searchHistory') || []
    searchHistory.value = Array.isArray(history) ? history : []
  } catch (error) {
    console.error('加载搜索历史失败:', error)
  }
}

// 保存搜索历史
const saveSearchHistory = (keyword: string) => {
  if (!keyword.trim()) return
  
  const history = searchHistory.value.filter(item => item !== keyword)
  history.unshift(keyword)
  if (history.length > 10) history.pop()
  
  searchHistory.value = history
  try {
    uni.setStorageSync('searchHistory', history)
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

// 清除搜索历史
const clearHistory = () => {
  searchHistory.value = []
  uni.removeStorageSync('searchHistory')
}

// 选择历史记录
const selectHistory = (keyword: string) => {
  searchKeyword.value = keyword
  handleSearch()
}

// 选择热门关键词
const selectHot = (keyword: string) => {
  searchKeyword.value = keyword
  handleSearch()
}

// 执行搜索
const { run: doSearch } = useRequest(
  () => searchProducts(searchParams),
  {
    immediate: false,
    onSuccess: (result) => {
      if (page.value === 1) {
        products.value = result.products
      } else {
        products.value.push(...result.products)
      }
      hasMore.value = products.value.length < result.total
    },
    onError: (error) => {
      console.error('搜索失败:', error)
      uni.showToast({
        title: '搜索失败，请重试',
        icon: 'none',
      })
    },
    onFinally: () => {
      loading.value = false
      refreshing.value = false
    },
  }
)

// 搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    uni.showToast({
      title: '请输入搜索关键词',
      icon: 'none',
    })
    return
  }
  
  saveSearchHistory(searchKeyword.value)
  searchParams.keyword = searchKeyword.value
  page.value = 1
  searchParams.page = 1
  loading.value = true
  doSearch()
}

// 清空搜索
const handleClear = () => {
  searchKeyword.value = ''
  products.value = []
  hasMore.value = true
  page.value = 1
}

// 切换筛选
const changeFilter = (filter: string) => {
  if (currentFilter.value === filter) return
  
  currentFilter.value = filter
  searchParams.sortBy = filter as any
  page.value = 1
  searchParams.page = 1
  loading.value = true
  doSearch()
}

// 加载更多
const loadMore = () => {
  if (loading.value || !hasMore.value) return
  
  page.value++
  searchParams.page = page.value
  loading.value = true
  doSearch()
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  page.value = 1
  searchParams.page = 1
  doSearch()
}

// 跳转到商品详情
const goToProduct = (product: IProduct) => {
  uni.navigateTo({
    url: `/pages/products/detail?id=${product.id}`
  })
}

onLoad((options) => {
  if (options.keyword) {
    searchKeyword.value = options.keyword
    handleSearch()
  }
})

onMounted(() => {
  loadSearchHistory()
  
  // 加载热门搜索
  getHotProducts(5).then((products) => {
    if (products.length > 0) {
      hotKeywords.value = products.map(p => p.title).slice(0, 5)
    }
  }).catch(() => {
    // 使用默认热门关键词
  })
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
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;

  .search-bar {
    flex: 1;
    margin-right: 20rpx;
  }

  .search-btn {
    font-size: 28rpx;
    color: #2c722c;
    font-weight: bold;
  }
}

.search-history,
.hot-search {
  margin: 20rpx 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;

  .history-header,
  .hot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .history-title,
    .hot-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }

  .history-tags,
  .hot-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;

    .history-tag,
    .hot-tag {
      padding: 12rpx 24rpx;
      background-color: #f5f5f5;
      border-radius: 24rpx;
      font-size: 26rpx;
      color: #666;

      &.primary {
        background-color: rgba(44, 114, 44, 0.1);
        color: #2c722c;
      }
    }
  }
}

.search-results {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.filter-bar {
  display: flex;
  background-color: #fff;
  padding: 0 30rpx;

  .filter-item {
    flex: 1;
    text-align: center;
    padding: 30rpx 0;
    font-size: 28rpx;
    color: #666;
    position: relative;

    &.active {
      color: #2c722c;
      font-weight: bold;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background-color: #2c722c;
        border-radius: 2rpx;
      }
    }
  }
}

.product-list {
  flex: 1;
  padding: 20rpx;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.product-item {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;

  .product-image {
    width: 100%;
    height: 200rpx;
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
      color: #999;
      margin-bottom: 12rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-price {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;

      .price {
        font-size: 32rpx;
        font-weight: bold;
        color: #ff4757;
      }

      .unit {
        font-size: 24rpx;
        color: #999;
        margin-left: 4rpx;
      }

      .original-price {
        font-size: 24rpx;
        color: #999;
        text-decoration: line-through;
        margin-left: 8rpx;
      }
    }

    .product-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;

      .tag {
        padding: 4rpx 8rpx;
        background-color: rgba(44, 114, 44, 0.1);
        color: #2c722c;
        font-size: 20rpx;
        border-radius: 4rpx;
      }
    }
  }
}

.loading-more,
.no-more,
.empty {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 28rpx;

  .wd-loading {
    display: inline-block;
    margin-right: 10rpx;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}
</style>