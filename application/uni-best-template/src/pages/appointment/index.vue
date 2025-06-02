<route lang="json5">
{
  style: {
    navigationBarTitleText: '服务预约',
    navigationStyle: 'custom'
  },
}
</route>

<template>
  <view class="form-container">    
    <view class="banner">
      <view class="banner-text">
        <view class="cn-text">中 国 奥 委 会</view>
        <view class="supplier-text">官方涂料独家供应商</view>
      </view>
    </view>
    
    <wd-form :model="formData" align="right" ref="appointmentForm" validate-trigger="submit">
      <wd-cell-group border>
        <!-- 服务类型 -->
        <wd-picker
          label="选择服务类型"
          label-width="140px"
          prop="serviceType"
          v-model="formData.serviceType"
          :columns="serviceOptions"
          placeholder="请选择服务类型"
          :rules="[{ required: true, message: '请选择服务类型' }]"
          custom-class="service-picker"
        ></wd-picker>
        
        <!-- 场景类型 -->
        <wd-select-picker
          label="选择场景类型"
          label-width="140px"
          prop="sceneType"
          v-model="formData.sceneType"
          :columns="sceneOptions" 
          mode="single-select"
          placeholder="点击选择场景类型"
          custom-class="scene-select"
          :rules="[{ required: true, message: '请选择场景类型' }]"
        ></wd-select-picker>
      </wd-cell-group>
      <wd-cell-group border>
        <!-- 业主姓名 -->
        <wd-input 
          label="业主姓名"
          label-width="140px"
          prop="name"
          v-model="formData.name" 
          placeholder="请填写" 
          custom-class="custom-input"
          :rules="[{ required: true, message: '请输入业主姓名' }]"
        >
          <template #suffix>
            <wd-icon name="user" size="36rpx" color="#999" v-if="!formData.name"></wd-icon>
          </template>
        </wd-input>
        
        <!-- 联系电话 -->
        <wd-input 
          label="联系电话"
          label-width="140px"
          prop="phone"
          v-model="formData.phone" 
          placeholder="请填写" 
          type="number" 
          custom-class="custom-input"
          :rules="[
            { required: true, message: '请输入联系电话' },
            { pattern: /^1\d{10}$/, message: '请输入正确的手机号码' }
          ]"
        >
          <template #suffix>
            <wd-icon name="phone" size="36rpx" color="#999" v-if="!formData.phone"></wd-icon>
          </template>
        </wd-input>
        
        <!-- 小区位置 -->
        <wd-input 
          label="小区位置"
          label-width="140px"
          prop="location"
          v-model="formData.location" 
          placeholder="点击选择" 
          readonly 
          custom-class="custom-input"
          @click="chooseLocation"
          :rules="[{ required: true, message: '请选择小区位置' }]"
        >
          <template #suffix>
            <wd-icon name="location" size="36rpx" color="#2c722c"></wd-icon>
          </template>
        </wd-input>
        
        <!-- 选择省市区 -->
        <wd-input 
          label="选择省市区"
          label-width="140px"
          prop="region"
          v-model="formData.region" 
          placeholder="请选择" 
          readonly
          custom-class="custom-input"
          @click="chooseRegion"
          :rules="[{ required: true, message: '请选择省市区' }]"
        >
          <template #suffix>
            <wd-icon name="arrow-right" size="36rpx" color="#999"></wd-icon>
          </template>
        </wd-input>
        
        <!-- 详细地址 -->
        <wd-input 
          label="详细地址"
          label-width="140px"
          prop="address"
          v-model="formData.address" 
          placeholder="请填写" 
          custom-class="custom-input"
        >
          <template #suffix>
            <wd-icon name="edit-outline" size="36rpx" color="#999" v-if="!formData.address"></wd-icon>
          </template>
        </wd-input>
      </wd-cell-group>
    </wd-form>
    
    <!-- 添加底部占位，防止内容被提交按钮遮挡 -->
    <view style="height: 160rpx;"></view>
    
    <view class="submit-wrapper">
      <wd-button size="large" type="primary" block custom-class="submit-btn" @click="submitForm">确认预约</wd-button>
      <view class="safe-area-inset-bottom"></view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getServiceTypes, getSceneTypes, submitAppointment, type IAppointmentForm } from '@/api/appointment'
import useRequest from '@/hooks/useRequest'

// 安全距离
const safeAreaBottom = ref(0)

// 表单引用
const appointmentForm = ref()

// 表单数据
const formData = reactive<IAppointmentForm>({
  serviceType: '',
  name: '',
  phone: '',
  region: '',
  address: '',
  sceneType: '',
  location: ''
})

// 服务类型选项 - 改为接口获取
const serviceOptions = ref([])

// 场景选项数据 - 改为接口获取
const sceneOptions = ref([])

// 获取服务类型选项
const { loading: serviceTypesLoading, run: loadServiceTypes } = useRequest(
  () => getServiceTypes(),
  {
    immediate: true,
    onSuccess: (data) => {
      serviceOptions.value = data.map(item => ({
        value: item.value,
        label: item.label
      }))
    },
    onError: () => {
      // 如果接口失败，使用默认数据
      serviceOptions.value = [
        { value: 'repair', label: '防水补漏' },
        { value: 'new', label: '新房防水施工' },
        { value: 'drain', label: '疏通管道' },
        { value: 'unsure', label: '我不清楚' }
      ]
    }
  }
)

// 获取场景类型选项
const { loading: sceneTypesLoading, run: loadSceneTypes } = useRequest(
  () => getSceneTypes(),
  {
    immediate: true,
    onSuccess: (data) => {
      sceneOptions.value = data.map(item => ({
        value: item.value,
        label: item.label
      }))
    },
    onError: () => {
      // 如果接口失败，使用默认数据
      sceneOptions.value = [
        { value: '客厅', label: '客厅' },
        { value: '厨房', label: '厨房' },
        { value: '卫生间', label: '卫生间' },
        { value: '阳台', label: '阳台' },
        { value: '卧室', label: '卧室' },
        { value: '其他', label: '其他' }
      ]
    }
  }
)

// 提交预约请求
const { loading: submitLoading, run: submitAppointmentRequest } = useRequest(
  () => submitAppointment(formData),
  {
    immediate: false,
    onSuccess: (result) => {
      uni.showToast({
        title: `预约成功！订单号：${result.orderNo}`,
        icon: 'none',
        duration: 3000
      })
      
      // 跳转到订单详情或首页
      setTimeout(() => {
        uni.switchTab({ url: '/pages/index/index' })
      }, 2000)
    },
    onError: (error) => {
      console.error('预约提交失败', error)
      uni.showToast({
        title: '预约提交失败，请重试',
        icon: 'none'
      })
    }
  }
)

// 从URL参数获取服务类型并设置默认值
onLoad((options) => {
  console.log('预约页面接收到的参数:', options)
  
  // 处理服务类型参数
  if (options && options.serviceType) {
    // 处理参数映射，确保能匹配到选项
    let serviceType = options.serviceType
    
    // 特殊处理：将waterproof映射到repair
    if (serviceType === 'waterproof') {
      serviceType = 'repair'
    } else if (serviceType === 'new') {
      serviceType = 'new'
    } else if (serviceType === 'drain') {
      serviceType = 'drain'
    } else if (serviceType === 'unsure' || !serviceType) {
      serviceType = 'unsure'
    }
    
    console.log('设置服务类型:', serviceType)
    // 设置默认选中的服务类型
    formData.serviceType = serviceType
  }
  
  // 处理其他可能的参数
  if (options && options.sceneType) {
    // 设置场景类型
    formData.sceneType = options.sceneType
  }
  
  // 如果有其他预填充数据，也可以在这里处理
  if (options && options.name) {
    formData.name = options.name
  }
  
  if (options && options.phone) {
    formData.phone = options.phone
  }
})

onMounted(() => {
  // 获取安全区域信息
  uni.getSystemInfo({
    success: (res) => {
      console.log('系统信息', res)
      if (res.safeAreaInsets) {
        safeAreaBottom.value = res.safeAreaInsets.bottom || 0
      }
    }
  })
})

// 选择位置
const chooseLocation = () => {
  // #ifdef MP-WEIXIN
  uni.chooseLocation({
    success: (res) => {
      console.log('选择位置成功', res)
      // 自动填充省市区和详细地址
      formData.location = res.name || res.address
      formData.region = res.address.split(',')[0] || ''
      formData.address = res.address || ''
    },
    fail: (err) => {
      console.log('选择位置失败', err)
      uni.showToast({
        title: '请授权位置权限',
        icon: 'none'
      })
    }
  })
  // #endif
  
  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '仅微信小程序支持此功能',
    icon: 'none'
  })
  // #endif
}

// 选择省市区
const chooseRegion = () => {
  // 在微信环境中使用地图选择器
  if (formData.location) {
    return uni.showToast({ 
      title: '省市区已通过位置选择器自动填写', 
      icon: 'none' 
    })
  }
  
  // 提示用户先选择位置
  uni.showToast({ 
    title: '请先选择小区位置，省市区将自动填写', 
    icon: 'none' 
  })
}

// 提交表单
const submitForm = () => {
  // 使用wd-form进行表单验证
  appointmentForm.value.validate().then(({ valid, errors }) => {
    if (valid) {
      // 表单验证通过，调用接口提交数据
      console.log('提交预约数据:', formData)
      submitAppointmentRequest()
    } else {
      console.log('表单验证失败', errors)
    }
  }).catch(error => {
    console.log('验证出错', error)
  })
}
</script>

<style lang="scss" scoped>
.form-container {
  display: flex;
  flex-direction: column;
  // min-height: 100vh;
  background-color: #f7f8fa;
  position: relative;
}

.banner {
  position: relative;
  width: 100%;
  height: 140rpx;
  background: linear-gradient(to right, #3d9c40, #67c541);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  
  .banner-text {
    text-align: center;
    color: #fff;
    
    .cn-text {
      font-size: 36rpx;
      letter-spacing: 12rpx;
      margin-bottom: 10rpx;
      font-weight: bold;
    }
    
    .supplier-text {
      font-size: 30rpx;
    }
  }
}

.service-options {
  display: flex;
  width: 100%;
  // justify-content: flex-end;
}

.radio-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  
  :deep(.wd-radio) {
    margin-bottom: 15rpx;
    margin-right: 0;
  }
  
  :deep(.wd-radio__shape) {
    margin-right: 10rpx;
  }
  
  :deep(.wd-radio__button) {
    width: 100%;
    height: 80rpx;
    text-align: right;
    padding-right: 20rpx;
    border-radius: 10rpx;
    
    &.is-checked {
      background-color: #e8f5e9;
      color: #2c722c;
      border-color: #2c722c;
    }
  }
}

.custom-cell {
  :deep(.wd-cell__title) {
    font-weight: 500;
  }
}

.scene-select {
  :deep(.wd-picker__value) {
    text-align: right;
  }
}

:deep(.wd-cell-group) {
  margin: 0 30rpx;
  border-radius: 8rpx;
  overflow: hidden;
}

:deep(.wd-cell__title) {
  &::before {
    content: '*';
    color: #ff4d4f;
    position: absolute;
    left: -15rpx;
  }
}

:deep(.wd-input__inner) {
  // text-align: right;
}

.submit-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  z-index: 9;
}

.submit-btn {
  height: 90rpx;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 45rpx;
  background-color: #3d9c40 !important;
  border-color: #3d9c40 !important;
}

.safe-area-inset-bottom {
  height: v-bind('safeAreaBottom + "px"');
}

.service-picker {
  :deep(.wd-picker__value) {
    text-align: right;
  }
}
</style> 