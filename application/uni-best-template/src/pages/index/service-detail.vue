<route lang="json5">
{
  style: {
    navigationBarTitleText: '服务详情',
    navigationStyle: 'custom'
  },
}
</route>

<template>
  <view class="service-detail">
    <image @click="makeAppointment"
    
    src="https://linkxspace.cn/nest-admin//upload/2025-06-06/1749223887358-161576767-qpkpCEhcnaKo6d90c01dd60f857ce07e211443addf02.jpg" mode="widthFix" class="banner-img"></image>

    <!-- 顶部banner -->
    <view class="banner">
      <swiper 
        :indicator-dots="true" 
        :autoplay="true" 
        :interval="3000" 
        indicator-active-color="#3d9c40"
        class="banner-swiper"
      >
        <swiper-item v-for="(image, index) in serviceData.bannerImages" :key="index">
          <view class="banner-item" :style="{ backgroundColor: image.color || '#3d9c40' }">
            <view class="banner-content">
              <view class="banner-title">{{ serviceData.title }}</view>
              <view class="banner-subtitle">{{ serviceData.subtitle }}</view>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>
    
    <!-- 服务简介 -->
    <view class="service-intro">
      <view class="section-title">{{ serviceData.title }}</view>
      <view class="features">
        <view class="feature-item" v-for="(feature, index) in serviceData.features" :key="index">
          <view class="feature-icon" :style="{ backgroundColor: feature.color || '#e8f5e9' }">
            <wd-icon :name="feature.icon" size="44rpx" color="#3d9c40"></wd-icon>
          </view>
          <view class="feature-text">{{ feature.text }}</view>
        </view>
      </view>
      <view class="intro-text">{{ serviceData.description }}</view>
    </view>
    
    <!-- 问题场景展示 -->
    <view class="problem-section">
      <view class="section-title">渗漏经常出现在哪里？</view>
      <view class="subtitle">我们都能解决</view>
      
      <view class="problem-grid">
        <view class="problem-item" v-for="(problem, index) in serviceData.problemScenes" :key="index">
          <view class="problem-image" :style="{ backgroundColor: problem.color || '#f0f0f0' }">
            <wd-icon :name="problem.icon" size="60rpx" color="#666"></wd-icon>
          </view>
          <view class="problem-name">{{ problem.name }}</view>
        </view>
      </view>
    </view>
    
    <!-- 材料说明 -->
    <view class="material-section">
      <view class="section-title">不同区域渗漏水用什么材料？</view>
      <view class="subtitle">我们包工包料</view>
      
      <view class="material-list">
        <view class="material-item" v-for="(material, index) in serviceData.materials" :key="index">
          <view class="material-image" :style="{ backgroundColor: material.color || '#f0f0f0' }">
            <view class="material-name">{{ material.name }}</view>
          </view>
          <view class="material-desc">{{ material.description }}</view>
          <view class="material-tags">
            <view class="material-tag" v-for="(tag, tagIndex) in material.tags" :key="tagIndex">
              {{ tag }}
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 切换数据源 -->
    <view class="data-source-switch">
      <view class="switch-title">数据源: {{ useMockData ? 'Mock数据' : '真实数据' }}</view>
      <wd-switch v-model="useMockData" @change="toggleDataSource"></wd-switch>
    </view>
    
    <!-- 底部按钮 -->
    <view class="bottom-button">
      <wd-button size="large" type="primary" block @click="makeAppointment">立即预约</wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import useRequest from '@/hooks/useRequest'
import { 
  getServiceDetailAPI, 
  setUseMockData, 
  useMockData as globalUseMockData, 
  IServiceDetail 
} from '@/service/service/index'

// 服务ID，可以从路由参数获取
const serviceId = ref('waterproof')

// 控制是否使用Mock数据
const useMockData = ref(globalUseMockData)

// 从路由参数获取服务ID
onLoad((options) => {
  console.log('服务详情页面接收到的参数:', options)
  if (options && options.id) {
    serviceId.value = options.id
    console.log('设置服务ID:', serviceId.value)
  }
  
  // 初始化时加载数据
  loadData()
})

// 服务数据
const serviceData = reactive<IServiceDetail>({
  id: '',
  title: '防水补漏',
  subtitle: '官方涂料独家供应商',
  description: '三棵树一站式防水修缮服务，专业师傅免费上门，快速响应，品质保障。我们提供屋顶、厨房、卫生间、阳台等多场景防水解决方案。',
  bannerImages: [
    { url: '', color: '#3d9c40' },
    { url: '', color: '#4CAF50' },
    { url: '', color: '#81C784' }
  ],
  features: [
    { text: '品质保障', icon: 'shield-check', color: '#e8f5e9' },
    { text: '快速响应', icon: 'clock', color: '#e8f5e9' },
    { text: '专业师傅', icon: 'user', color: '#e8f5e9' },
    { text: '免费上门', icon: 'home', color: '#e8f5e9' }
  ],
  problemScenes: [
    { name: '厨房', icon: 'set-meal', color: '#BBDEFB' },
    { name: '阳台', icon: 'computer', color: '#C8E6C9' },
    { name: '卫生间', icon: 'toilet', color: '#FFECB3' },
    { name: '屋面', icon: 'crown', color: '#E1BEE7' },
    { name: '墙面', icon: 'view-list', color: '#FFCCBC' },
    { name: '窗户', icon: 'browse', color: '#B3E5FC' }
  ],
  materials: [
    {
      name: '柔韧型防水涂料',
      color: '#C8E6C9',
      description: '适用于阳台/厨房/卫生间',
      tags: ['阳台', '厨房', '卫生间']
    },
    {
      name: '渗漏免拆',
      color: '#BBDEFB',
      description: '适用于阳台/厨房/卫生间',
      tags: ['阳台', '厨房', '卫生间']
    },
    {
      name: '天雨红橡胶',
      color: '#FFCDD2',
      description: '适用于屋面/地下室',
      tags: ['屋面', '地下室']
    }
  ]
})

// 使用useRequest钩子获取数据
const { loading, error, run } = useRequest(() => getServiceDetailAPI(serviceId.value), {
  immediate: false,
})

// 加载数据
const loadData = () => {
  console.log('加载服务详情数据，服务ID:', serviceId.value)
  run().then(res => {
    if (res && res.data) {
      Object.assign(serviceData, res.data)
      console.log('服务详情数据加载成功')
    }
  }).catch(err => {
    console.error('获取服务详情失败', err)
    uni.showToast({
      title: '获取服务详情失败',
      icon: 'none'
    })
  })
}

// 切换数据源
const toggleDataSource = (value: boolean) => {
  useMockData.value = value
  setUseMockData(value)
  loadData()
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 跳转到预约页面
const makeAppointment = () => {
  // 根据服务ID判断服务类型
  let appointmentType = 'unsure'; // 默认为"我不清楚"
  
  if (serviceId.value === 'waterproof') {
    appointmentType = 'repair'; // 防水补漏
  } else if (serviceId.value === 'drain') {
    appointmentType = 'drain'; // 疏通管道
  } else if (serviceId.value === 'new') {
    appointmentType = 'new'; // 新房防水施工
  }
  
  console.log('跳转到预约页面，服务类型:', appointmentType)
  
  // 构建完整的预约参数
  const appointmentParams = {
    serviceType: appointmentType,
    // 可以添加更多参数，如默认场景类型等
    sceneType: serviceId.value === 'drain' ? '厨房' : '卫生间', // 根据服务类型设置默认场景
  }
  
  // 将参数转换为URL查询字符串
  const queryString = Object.entries(appointmentParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  
  uni.navigateTo({
    url: '/pages/appointment/index?' + queryString
  })
}

onMounted(() => {
  // onMounted钩子中的其他初始化逻辑
  console.log('服务详情页面已挂载')
})
</script>

<style lang="scss" scoped>
.service-detail {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 150rpx;
}

.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: var(--status-bar-height) 30rpx 0;
  background-color: #fff;
  z-index: 100;
  
  .back-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .navbar-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  
  .right-placeholder {
    width: 60rpx;
  }
}

.banner {
  // margin-top: calc(88rpx + var(--status-bar-height));
  width: 100%;
  height: 400rpx;
  
  .banner-swiper {
    width: 100%;
    height: 100%;
  }
  
  .banner-item {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .banner-content {
      text-align: center;
      color: #fff;
      
      .banner-title {
        font-size: 48rpx;
        font-weight: bold;
        margin-bottom: 20rpx;
      }
      
      .banner-subtitle {
        font-size: 32rpx;
      }
    }
  }
}

.service-intro {
  margin: 30rpx;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  
  .section-title {
    font-size: 36rpx;
    font-weight: bold;
    margin-bottom: 30rpx;
    color: #333;
  }
  
  .features {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 30rpx;
    
    .feature-item {
      width: 25%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20rpx;
      
      .feature-icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10rpx;
      }
      
      .feature-text {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
  
  .intro-text {
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
  }
}

.problem-section {
  margin: 30rpx;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  
  .section-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: #666;
    margin-top: 10rpx;
    margin-bottom: 30rpx;
  }
  
  .problem-grid {
    display: flex;
    flex-wrap: wrap;
    
    .problem-item {
      width: 33.33%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 30rpx;
      
      .problem-image {
        width: 120rpx;
        height: 120rpx;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15rpx;
      }
      
      .problem-name {
        font-size: 28rpx;
        color: #333;
      }
    }
  }
}

.material-section {
  margin: 30rpx;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  
  .section-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: #666;
    margin-top: 10rpx;
    margin-bottom: 30rpx;
  }
  
  .material-list {
    .material-item {
      margin-bottom: 30rpx;
      
      .material-image {
        height: 150rpx;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15rpx;
        
        .material-name {
          font-size: 32rpx;
          font-weight: bold;
          color: #fff;
        }
      }
      
      .material-desc {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 15rpx;
      }
      
      .material-tags {
        display: flex;
        flex-wrap: wrap;
        
        .material-tag {
          padding: 6rpx 20rpx;
          background-color: #e8f5e9;
          color: #3d9c40;
          border-radius: 20rpx;
          font-size: 24rpx;
          margin-right: 15rpx;
          margin-bottom: 10rpx;
        }
      }
    }
  }
}

.data-source-switch {
  margin: 30rpx;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .switch-title {
    font-size: 28rpx;
    color: #333;
  }
}

.bottom-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}
</style> 