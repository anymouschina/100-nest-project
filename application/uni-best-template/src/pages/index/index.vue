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
    <image
      @click="navigateToService('waterproof')"
      src="/static/home.jpg"
      mode="widthFix"
      class="banner-img"
    ></image>

    <!-- 顶部banner轮播图 -->
    <!-- <view class="banner-swiper-section mb-5 h-400rpx"> -->
    <!-- <wd-swiper
        class="banner-swiper"
        height="400rpx"
        :autoplay="true"
        :duration="4000"
        :list="bannerList"
        indicator-color="rgba(255,255,255,0.4)"
        indicator-active-color="#2c722c"
        indicator-position="bottom"
        @click="handleBannerClick"
      ></wd-swiper> -->
    <!-- 科技感装饰元素 -->
    <!-- <view class="tech-decoration">
        <view class="tech-dot tech-dot-1"></view>
        <view class="tech-dot tech-dot-2"></view>
        <view class="tech-dot tech-dot-3"></view>
      </view> -->
    <!-- </view> -->

    <!-- 品牌标识卡片 -->
    <view class="brand-card">
      <view class="brand-header">
        <view class="brand-logo">
          <view class="logo-container">
            <wd-icon name="home" size="50rpx" color="#2c722c"></wd-icon>
            <view class="logo-glow"></view>
          </view>
          <view class="brand-info">
            <text class="brand-name">华建修缮防水修缮</text>
            <view class="brand-tags">
              <text class="tag">专业认证</text>
              <text class="tag">品质保障</text>
            </view>
          </view>
        </view>
        <!-- 信任标识 -->
        <view class="trust-badges">
          <view class="trust-item">
            <wd-icon name="shield" size="32rpx" color="#52c41a"></wd-icon>
            <text>质量保证</text>
          </view>
          <view class="trust-item">
            <wd-icon name="check-checked" size="32rpx" color="#52c41a"></wd-icon>
            <text>官方认证</text>
          </view>
        </view>
      </view>

      <!-- 一键预约按钮 -->
      <view class="quick-appointment" @click="connectToService">
        <wd-icon name="service" size="40rpx" color="#fff"></wd-icon>
        <text>材料选购</text>
      </view>
    </view>

    <!-- 服务功能区 -->
    <view class="service-section">
      <view class="section-header">
        <view class="section-title">
          <view class="title-main">
            <wd-icon name="tools" size="40rpx" color="#2c722c"></wd-icon>
            <text>专业服务</text>
          </view>
          <view class="title-sub">AI智能匹配 · 一站式解决方案</view>
        </view>
        <view class="section-decoration"></view>
      </view>

      <view class="service-grid">
        <!-- 防水补漏卡片 -->
        <view class="service-card primary-card" @click="navigateToService('waterproof')">
          <view class="card-glow"></view>
          <view class="card-inner">
            <view class="card-header">
              <view class="card-icon repair-icon">
                <wd-icon name="tools" size="50rpx" color="#fff"></wd-icon>
                <view class="icon-pulse"></view>
              </view>
              <view class="card-badge">热门</view>
            </view>
            <view class="card-content">
              <view class="card-title">防水补漏</view>
              <view class="card-desc">专业师傅 · 免费上门检测</view>
              <view class="card-features">
                <view class="feature">
                  <wd-icon name="time" size="20rpx" color="#52c41a"></wd-icon>
                  <text>30分钟响应</text>
                </view>
                <view class="feature">
                  <wd-icon name="user" size="20rpx" color="#52c41a"></wd-icon>
                  <text>持证师傅</text>
                </view>
              </view>
              <wd-button
                type="primary"
                size="small"
                custom-style="margin-top:20rpx;background:linear-gradient(135deg, #2c722c 0%, #52c41a 100%);border:none;border-radius:25rpx;box-shadow:0 6rpx 16rpx rgba(44,114,44,0.3);font-size:26rpx;"
                @click="handleServiceAppointment('waterproof', $event)"
              >
                立即预约
              </wd-button>
            </view>
          </view>
        </view>

        <!-- 疏通管道卡片 -->
        <view class="service-card secondary-card" @click="navigateToService('drain')">
          <view class="card-glow"></view>
          <view class="card-inner">
            <view class="card-header">
              <view class="card-icon pipe-icon">
                <wd-icon name="filter" size="50rpx" color="#fff"></wd-icon>
                <view class="icon-pulse"></view>
              </view>
              <view class="card-badge">推荐</view>
            </view>
            <view class="card-content">
              <view class="card-title">疏通管道</view>
              <view class="card-desc">高压清洗 · 专业设备</view>
              <view class="card-features">
                <view class="feature">
                  <wd-icon name="time" size="20rpx" color="#409eff"></wd-icon>
                  <text>24小时服务</text>
                </view>
                <view class="feature">
                  <wd-icon name="tools" size="20rpx" color="#409eff"></wd-icon>
                  <text>专业设备</text>
                </view>
              </view>
              <wd-button
                type="primary"
                size="small"
                custom-style="margin-top:20rpx;background:linear-gradient(135deg, #409eff 0%, #64b5ff 100%);border:none;border-radius:25rpx;box-shadow:0 6rpx 16rpx rgba(64,158,255,0.3);font-size:26rpx;"
                @click="handleServiceAppointment('drain', $event)"
              >
                立即预约
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </view>
    <!-- 专业优势展示 -->
    <view class="advantage-section">
      <view class="advantage-header">
        <view class="advantage-title">
          <wd-icon name="shield" size="36rpx" color="#2c722c"></wd-icon>
          <text>专业优势</text>
        </view>
        <view class="advantage-subtitle">值得信赖的专业服务团队</view>
      </view>

      <view class="advantage-grid">
        <view class="advantage-item">
          <view class="advantage-icon">
            <wd-icon name="check-checked" size="40rpx" color="#52c41a"></wd-icon>
            <view class="icon-bg"></view>
          </view>
          <view class="advantage-content">
            <view class="advantage-name">品牌认证</view>
            <view class="advantage-desc">中国奥委会官方供应商</view>
          </view>
        </view>

        <view class="advantage-item">
          <view class="advantage-icon">
            <wd-icon name="user" size="40rpx" color="#409eff"></wd-icon>
            <view class="icon-bg"></view>
          </view>
          <view class="advantage-content">
            <view class="advantage-name">专业团队</view>
            <view class="advantage-desc">持证上岗 经验丰富</view>
          </view>
        </view>

        <view class="advantage-item">
          <view class="advantage-icon">
            <wd-icon name="shield" size="40rpx" color="#f56c6c"></wd-icon>
            <view class="icon-bg"></view>
          </view>
          <view class="advantage-content">
            <view class="advantage-name">服务保障</view>
            <view class="advantage-desc">质量保证 售后无忧</view>
          </view>
        </view>

        <view class="advantage-item">
          <view class="advantage-icon">
            <wd-icon name="time" size="40rpx" color="#faad14"></wd-icon>
            <view class="icon-bg"></view>
          </view>
          <view class="advantage-content">
            <view class="advantage-name">响应速度</view>
            <view class="advantage-desc">快速上门 高效服务</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 数据统计展示 -->
    <view class="stats-section">
      <view class="stats-container">
        <view class="stat-item">
          <view class="stat-number">{{ statistics.totalCustomers }}</view>
          <view class="stat-label">服务客户</view>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <view class="stat-number">{{ statistics.satisfactionRate }}</view>
          <view class="stat-label">满意度</view>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <view class="stat-number">{{ statistics.responseTime }}</view>
          <view class="stat-label">响应时间</view>
        </view>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <fg-tabbar current="home"></fg-tabbar>
  </view>
</template>

<script lang="ts" setup>
import FgTabbar from '@/components/fg-tabbar/fg-tabbar.vue'
import { ref, onMounted } from 'vue'
import {
  getHomeBanners,
  getHomeServices,
  getHomeStatistics,
  associateUserReferral,
} from '@/api/home'
import useRequest from '@/hooks/useRequest'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { useUserStore } from '@/store'

const hasLogin = ref(false)
// 微信小程序下登录
const handleLogin = async () => {
  // #ifdef MP-WEIXIN

  // 微信登录
  await useUserStore().wxLogin()
  hasLogin.value = true
  // #endif
  // #ifndef MP-WEIXIN
  uni.navigateTo({ url: '/pages/login/index' })
  // #endif
}

const connectToService = () => {
  uni.makePhoneCall({
    phoneNumber: '400-998-0618',
  })
}

onLoad(async (options) => {
  console.log('首页加载参数', options)
  hasLogin.value = !!uni.getStorageSync('token')
  console.log('个人中心onShow', hasLogin.value, options)
  !hasLogin.value && (await handleLogin())
  hasLogin.value && useUserStore().getUserInfo()
  // 检查scene参数
  if (options.scene) {
    try {
      const scene = decodeURIComponent(options.scene)
      console.log('解析scene参数', scene)

      // 提取引荐码
      const refCodeMatch = scene.match(/ref=([^&]+)/)
      if (refCodeMatch && refCodeMatch[1]) {
        const refCode = refCodeMatch[1]
        console.log('检测到引荐码', refCode)

        // 调用API关联用户引荐关系
        associateUserReferral(refCode)
          .then((res) => {
            console.log('关联用户引荐关系成功', res)
          })
          .catch((err) => {
            console.error('关联用户引荐关系失败', err)
          })
      }
    } catch (error) {
      console.error('解析scene参数失败', error)
    }
  }

  // 同时处理常规的ref参数
  if (options.ref) {
    console.log('检测到ref参数', options.ref)
    associateUserReferral(options.ref)
      .then((res) => {
        console.log('关联用户引荐关系成功', res)
      })
      .catch((err) => {
        console.error('关联用户引荐关系失败', err)
      })
  }

  // 初始化数据加载
  loadBanners()
  loadServices()
  loadStats()
})

defineOptions({
  name: 'Home',
})

// 轮播图数据 - 改为接口获取
const bannerList = ref([])

// 获取首页轮播图数据
const { loading: bannersLoading, run: loadBanners } = useRequest(() => getHomeBanners(), {
  // immediate: true,
  onSuccess: (data) => {
    console.log('获取轮播图数据成功', data)
    bannerList.value = data.map((item) => ({
      value: item.imageUrl || generatePlaceholderSVG(item.title, item.id),
      title: item.title,
      summary: item.summary,
      type: 'image',
      linkType: item.linkType,
      linkValue: item.linkValue,
    }))
  },
  onError: (error) => {
    console.error('获取轮播图数据失败', error)
    // 如果接口调用失败，使用默认数据
    bannerList.value = [
      {
        value:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzUwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQxIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzJjNzIyYztzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNTJjNDFhO3N0b3Atb3BhY2l0eToxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmFkaWVudDEpIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI0MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0OCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7pmLLmsLTkuJPlrrY8L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjkpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7kuJPkuJrmlr3lt6Ugwrcg5ZOB6LSo5L+d6ZqcPC90ZXh0Pgo8L3N2Zz4K',
        title: '防水补漏专家',
        summary: '专业施工 · 品质保障',
        type: 'image',
        linkType: 'service',
        linkValue: 'waterproof',
      },
      {
        value:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzUwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQyIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzQwOWVmZjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjRiNWZmO3N0b3Atb3BhY2l0eToxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmFkaWVudDIpIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI0MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0OCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7mlrDmiL/pmLLmsLQ8L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjkpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7moIflh4blMJbmlr3lt6Ugwrcg5Y2B5bm06LSo5L+dPC90ZXh0Pgo8L3N2Zz4K',
        title: '新房防水施工',
        summary: '标准化施工 · 十年质保',
        type: 'image',
        linkType: 'service',
        linkValue: 'new',
      },
      {
        value:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzUwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQzIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2Y1NmM2YztzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmY5ZjlmO3N0b3Atb3BhY2l0eToxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmFkaWVudDMpIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI0MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0OCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7nlY/pgJrnsKHpgZM8L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjkpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7lv6vpgJ/lk43lupQgwrcg5LiT5Lia6K6+5aSHPC90ZXh0Pgo8L3N2Zz4K',
        title: '管道疏通',
        summary: '快速响应 · 专业设备',
        type: 'image',
        linkType: 'service',
        linkValue: 'drain',
      },
    ]
  },
})

// 服务数据 - 改为接口获取
const homeServices = ref([])

// 获取首页服务数据
const { loading: servicesLoading, run: loadServices } = useRequest(() => getHomeServices(), {
  // immediate: true,
  onSuccess: (data) => {
    console.log('获取服务数据成功', data)
    homeServices.value = data
  },
  onError: (error) => {
    console.error('获取服务数据失败', error)
    // 默认服务数据在模板中直接使用
  },
})

// 统计数据 - 改为接口获取
const statistics = ref({
  totalCustomers: '10000+',
  satisfactionRate: '99.8%',
  responseTime: '24h',
  totalOrders: 0,
})

// 获取首页统计数据
const { loading: statsLoading, run: loadStats } = useRequest(() => getHomeStatistics(), {
  // immediate: true,
  onSuccess: (data) => {
    console.log('获取统计数据成功', data)
    statistics.value = {
      totalCustomers: data.totalCustomers > 10000 ? '10000+' : String(data.totalCustomers),
      satisfactionRate: data.satisfactionRate + '%',
      responseTime: data.responseTime,
      totalOrders: data.totalOrders,
    }
  },
  onError: (error) => {
    console.error('获取统计数据失败', error)
    // 使用默认统计数据
  },
})

// 生成占位图SVG
const generatePlaceholderSVG = (title: string, id: string) => {
  let gradientId = 'gradient1'
  let color1 = '#2c722c'
  let color2 = '#52c41a'

  if (id === 'new') {
    gradientId = 'gradient2'
    color1 = '#409eff'
    color2 = '#64b5ff'
  } else if (id === 'drain') {
    gradientId = 'gradient3'
    color1 = '#f56c6c'
    color2 = '#ff9f9f'
  }

  return `data:image/svg+xml;base64,${btoa(`<svg width="750" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#${gradientId})"/>
  <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${title}</text>
</svg>`)}`
}

// 轮播图点击
const handleBannerClick = (index: number, item: any) => {
  console.log('点击了轮播图', index, item)

  if (item.linkType === 'service') {
    navigateToService(item.linkValue)
  } else if (item.linkType === 'external') {
    // 处理外部链接
    uni.showToast({
      title: '跳转到外部链接: ' + item.linkValue,
      icon: 'none',
    })
  }
}

// 一键预约
const navigateToAppointment = () => {
  console.log('首页跳转到一键预约，默认服务类型: unsure')
  uni.navigateTo({
    url: '/pages/appointment/index?serviceType=unsure',
  })
}

// 跳转到具体服务页面
const navigateToService = (serviceId: string) => {
  console.log('跳转到服务详情页面:', serviceId)
  uni.navigateTo({
    url: `/pages/index/service-detail?id=${serviceId}`,
  })
}

// 处理卡片上的立即预约按钮点击
const handleServiceAppointment = (serviceId: string, event: Event) => {
  // 阻止事件冒泡，避免触发卡片的点击事件
  event.stopPropagation()

  // 根据服务ID映射到相应的服务类型
  let serviceType = 'unsure'
  if (serviceId === 'waterproof') {
    serviceType = 'repair' // 防水补漏
  } else if (serviceId === 'drain') {
    serviceType = 'drain' // 疏通管道
  } else if (serviceId === 'new') {
    serviceType = 'new' // 新房防水施工
  }

  console.log('服务卡片立即预约按钮跳转，服务类型:', serviceType)

  // 构建预约参数
  const appointmentParams = {
    serviceType,
    // 可以根据不同服务类型设置默认场景
    sceneType: serviceId === 'drain' ? '厨房' : '卫生间',
  }

  // 将参数转换为URL查询字符串
  const queryString = Object.entries(appointmentParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')

  uni.navigateTo({
    url: `/pages/appointment/index?${queryString}`,
  })
}

// 初始化页面
onMounted(() => {
  console.log('首页组件挂载')
})

// 小程序分享配置
onShareAppMessage(() => {
  return {
    title: '华建修缮防水 - 专业防水补漏服务，值得信赖',
    path: '/pages/index/index',
    imageUrl: '/static/share-image.jpg', // 可以根据实际情况修改
  }
})

// 分享到朋友圈（如果支持）
onShareTimeline(() => {
  return {
    title: '华建修缮防水 - 专业防水补漏服务，快速上门，品质保障',
    query: '',
    imageUrl: '/static/share-image.jpg', // 可以根据实际情况修改
  }
})
</script>

<style lang="scss">
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fffe 0%, #f0f9f0 50%, #ffffff 100%);
}

// 顶部banner轮播图
.banner-swiper-section {
  position: relative;
  width: 100%;
  overflow: hidden;

  .banner-swiper {
    --wot-swiper-nav-dot-color: rgba(255, 255, 255, 0.4);
    --wot-swiper-nav-dot-active-color: #2c722c;
    --wot-swiper-nav-dot-size: 10px;
    --wot-swiper-nav-dot-margin: 0 6px;
    // border-radius: 0 0 40rpx 40rpx;
    overflow: hidden;
  }

  .tech-decoration {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    .tech-dot {
      position: absolute;
      border-radius: 50%;
      background: rgba(44, 114, 44, 0.1);
      animation: float 6s ease-in-out infinite;

      &.tech-dot-1 {
        width: 120rpx;
        height: 120rpx;
        top: 10%;
        right: 10%;
        animation-delay: 0s;
      }

      &.tech-dot-2 {
        width: 80rpx;
        height: 80rpx;
        top: 60%;
        left: 5%;
        animation-delay: 2s;
      }

      &.tech-dot-3 {
        width: 60rpx;
        height: 60rpx;
        top: 30%;
        left: 20%;
        animation-delay: 4s;
      }
    }
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) scale(1.1);
    opacity: 1;
  }
}

// 品牌标识卡片
.brand-card {
  margin: 25rpx 25rpx 25rpx;
  background: #fff;
  border-radius: 25rpx;
  padding: 35rpx;
  box-shadow: 0 15rpx 50rpx rgba(44, 114, 44, 0.08);
  border: 1rpx solid rgba(44, 114, 44, 0.1);
  position: relative;

  // 一键预约按钮样式
  .quick-appointment {
    position: fixed;
    bottom: 300rpx;
    right: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 15rpx 30rpx;
    background: linear-gradient(135deg, #2c722c, #52c41a);
    color: #fff;
    border-radius: 30rpx;
    box-shadow: 0 10rpx 20rpx rgba(44, 114, 44, 0.2);
    z-index: 10;
    animation: pulse 2s infinite;

    text {
      margin-left: 10rpx;
      font-size: 28rpx;
      font-weight: bold;
    }
  }

  .brand-header {
    .brand-logo {
      display: flex;
      align-items: center;
      margin-bottom: 25rpx;

      .logo-container {
        position: relative;
        width: 90rpx;
        height: 90rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(44, 114, 44, 0.1);
        border-radius: 50%;
        margin-right: 25rpx;

        .logo-glow {
          position: absolute;
          top: -5rpx;
          left: -5rpx;
          right: -5rpx;
          bottom: -5rpx;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(44, 114, 44, 0.2), rgba(82, 196, 26, 0.2));
          animation: pulse 3s ease-in-out infinite;
        }
      }

      .brand-info {
        flex: 1;

        .brand-name {
          font-size: 36rpx;
          font-weight: bold;
          color: #2c722c;
          display: block;
          margin-bottom: 12rpx;
        }

        .brand-tags {
          display: flex;
          gap: 12rpx;

          .tag {
            padding: 6rpx 14rpx;
            background: linear-gradient(135deg, rgba(44, 114, 44, 0.1), rgba(82, 196, 26, 0.1));
            color: #2c722c;
            font-size: 20rpx;
            border-radius: 18rpx;
            border: 1rpx solid rgba(44, 114, 44, 0.2);
          }
        }
      }
    }

    .trust-badges {
      display: flex;
      justify-content: space-around;
      padding-top: 25rpx;
      border-top: 1rpx solid #f0f0f0;

      .trust-item {
        display: flex;
        align-items: center;
        gap: 8rpx;

        text {
          font-size: 24rpx;
          color: #666;
          font-weight: 500;
        }
      }
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

// 服务功能区
.service-section {
  padding: 0 25rpx 25rpx;

  .section-header {
    position: relative;
    margin-bottom: 30rpx;

    .section-title {
      .title-main {
        display: flex;
        align-items: center;
        gap: 12rpx;
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 12rpx;
      }

      .title-sub {
        font-size: 26rpx;
        color: #666;
        margin-left: 52rpx;
      }
    }

    .section-decoration {
      position: absolute;
      top: 0;
      right: 0;
      width: 80rpx;
      height: 5rpx;
      background: linear-gradient(90deg, #2c722c, #52c41a);
      border-radius: 3rpx;
    }
  }

  .service-grid {
    display: flex;
    justify-content: space-between;
    gap: 20rpx;

    .service-card {
      position: relative;
      flex: 1;
      border-radius: 25rpx;
      overflow: hidden;

      .card-glow {
        position: absolute;
        top: -2rpx;
        left: -2rpx;
        right: -2rpx;
        bottom: -2rpx;
        border-radius: 25rpx;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &.primary-card .card-glow {
        background: linear-gradient(135deg, rgba(44, 114, 44, 0.3), rgba(82, 196, 26, 0.3));
      }

      &.secondary-card .card-glow {
        background: linear-gradient(135deg, rgba(64, 158, 255, 0.3), rgba(100, 181, 255, 0.3));
      }

      &:active .card-glow {
        opacity: 1;
      }

      .card-inner {
        background: #fff;
        padding: 30rpx;
        height: 100%;
        display: flex;
        flex-direction: column;
        box-shadow: 0 12rpx 35rpx rgba(0, 0, 0, 0.08);
        border-radius: 25rpx;

        .card-header {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20rpx;

          .card-icon {
            position: relative;
            width: 100rpx;
            height: 100rpx;
            border-radius: 20rpx;
            display: flex;
            justify-content: center;
            align-items: center;

            .icon-pulse {
              position: absolute;
              top: -5rpx;
              left: -5rpx;
              right: -5rpx;
              bottom: -5rpx;
              border-radius: 20rpx;
              opacity: 0.3;
              animation: iconPulse 2s ease-in-out infinite;
            }

            &.repair-icon {
              background: linear-gradient(135deg, #2c722c, #52c41a);

              .icon-pulse {
                background: linear-gradient(135deg, #2c722c, #52c41a);
              }
            }

            &.pipe-icon {
              background: linear-gradient(135deg, #409eff, #64b5ff);

              .icon-pulse {
                background: linear-gradient(135deg, #409eff, #64b5ff);
              }
            }
          }

          .card-badge {
            padding: 6rpx 14rpx;
            background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
            color: #fff;
            font-size: 18rpx;
            border-radius: 12rpx;
            font-weight: bold;
          }
        }

        .card-content {
          flex: 1;

          .card-title {
            font-size: 32rpx;
            font-weight: bold;
            color: #333;
            margin-bottom: 12rpx;
          }

          .card-desc {
            font-size: 24rpx;
            color: #666;
            margin-bottom: 20rpx;
          }

          .card-features {
            display: flex;
            flex-direction: column;
            gap: 12rpx;
            margin-bottom: 20rpx;

            .feature {
              display: flex;
              align-items: center;
              gap: 10rpx;

              text {
                font-size: 22rpx;
                color: #666;
              }
            }
          }
        }
      }
    }
  }
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.6;
  }
}

// 专业优势展示
.advantage-section {
  margin: 25rpx;
  background: #fff;
  border-radius: 25rpx;
  padding: 35rpx;
  box-shadow: 0 12rpx 35rpx rgba(0, 0, 0, 0.06);

  .advantage-header {
    margin-bottom: 30rpx;

    .advantage-title {
      display: flex;
      align-items: center;
      gap: 12rpx;
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 12rpx;
    }

    .advantage-subtitle {
      font-size: 24rpx;
      color: #666;
      margin-left: 48rpx;
    }
  }

  .advantage-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25rpx;

    .advantage-item {
      display: flex;
      align-items: center;
      gap: 18rpx;
      padding: 20rpx;
      background: linear-gradient(135deg, rgba(248, 255, 254, 0.8), rgba(240, 249, 240, 0.8));
      border-radius: 18rpx;
      border: 1rpx solid rgba(44, 114, 44, 0.1);

      .advantage-icon {
        position: relative;
        width: 70rpx;
        height: 70rpx;
        display: flex;
        justify-content: center;
        align-items: center;

        .icon-bg {
          position: absolute;
          top: -5rpx;
          left: -5rpx;
          right: -5rpx;
          bottom: -5rpx;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.1);
        }
      }

      .advantage-content {
        flex: 1;

        .advantage-name {
          font-size: 26rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 6rpx;
        }

        .advantage-desc {
          font-size: 20rpx;
          color: #666;
          line-height: 1.4;
        }
      }
    }
  }
}

// 数据统计展示
.stats-section {
  margin: 0 25rpx 25rpx;
  background: linear-gradient(135deg, #2c722c, #52c41a);
  border-radius: 25rpx;
  padding: 35rpx;

  .stats-container {
    display: flex;
    justify-content: space-around;
    align-items: center;

    .stat-item {
      text-align: center;
      color: #fff;

      .stat-number {
        font-size: 42rpx;
        font-weight: bold;
        margin-bottom: 8rpx;
        text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
      }

      .stat-label {
        font-size: 22rpx;
        opacity: 0.9;
      }
    }

    .stat-divider {
      width: 2rpx;
      height: 70rpx;
      background: rgba(255, 255, 255, 0.3);
    }
  }
}
page {
  background-color: linear-gradient(180deg, #f8fffe 0%, #f0f9f0 50%, #ffffff 100%);
}
</style>
