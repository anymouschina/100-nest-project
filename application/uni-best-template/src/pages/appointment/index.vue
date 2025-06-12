<route lang="json5">
{
  style: {
    navigationBarTitleText: '服务预约',
    navigationStyle: 'custom',
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

    <wd-form :model="formData" label-width="50%" ref="appointmentForm" validate-trigger="submit">
      <!-- 问题类型 -->
      <wd-cell-group border>
        <wd-picker
          label="问题类型"
          v-model="formData.problemType"
          :columns="problemTypes"
          prop="problemType"
          placeholder="请选择问题类型"
          align-right
          :rules="[{ required: true, message: '请选择问题类型' }]"
          @confirm="handleProblemTypeChange"
        ></wd-picker>

        <!-- 子类型（多选） -->
        <wd-select-picker
          v-if="showSceneOptions && subTypeOptions.length > 0"
          :label="subTypeLabel"
          v-model="formData.subTypes"
          :columns="subTypeOptions"
          prop="subTypes"
          :placeholder="`请选择${subTypeLabel}`"
          align-right
          mode="multiple"
          :rules="[{ required: true, message: `请选择${subTypeLabel}` }]"
        ></wd-select-picker>

        <!-- 问题描述 -->
        <wd-input
          v-if="formData.problemType === 'other'"
          label="问题描述"
          v-model="formData.problemDesc"
          prop="problemDesc"
          placeholder="请填写问题描述"
          type="textarea"
          :rules="[{ required: true, message: '请输入问题描述' }]"
        ></wd-input>
      </wd-cell-group>

      <!-- 联系人信息 -->
      <wd-cell-group border>
        <!-- 预约人 -->
        <wd-input
          label="预约人"
          v-model="formData.name"
          prop="name"
          align-right
          placeholder="请填写姓氏"
          :rules="[{ required: true, message: '请输入预约人姓氏' }]"
        ></wd-input>

        <!-- 性别选择 -->
        <wd-radio-group
          label="称谓"
          v-model="formData.gender"
          prop="gender"
          inline
          cell
          :rules="[{ required: true, message: '请选择称谓' }]"
        >
          <wd-radio :value="'male'">先生</wd-radio>
          <wd-radio :value="'female'">女士</wd-radio>
        </wd-radio-group>

        <!-- 联系电话 -->
        <wd-input
          label="联系电话"
          v-model="formData.phone"
          prop="phone"
          align-right
          placeholder="请填写"
          type="tel"
          :rules="[
            { required: true, message: '请输入联系电话' },
            { pattern: /^1\d{10}$/, message: '请输入正确的手机号码' },
          ]"
        >
          <template #suffix>
            <wd-icon
              name="phone"
              size="36rpx"
              color="#999"
              v-if="!formData.phone"
              @click.stop="chooseContact"
            ></wd-icon>
          </template>
        </wd-input>

        <!-- 小区位置 -->
        <wd-input
          label="小区位置"
          v-model="formData.location"
          prop="location"
          align-right
          placeholder="点击选择"
          readonly
          @click="chooseLocation"
          :rules="[{ required: true, message: '请选择小区位置' }]"
        >
          <template #suffix>
            <wd-icon name="location" size="36rpx" color="#2c722c"></wd-icon>
          </template>
        </wd-input>

        <!-- 详细地址 -->
        <wd-input
          label="详细地址"
          v-model="formData.address"
          prop="address"
          align-right
          placeholder="例如：小区名称X栋X单元X号"
          :rules="[{ required: true, message: '请输入详细地址' }]"
        >
          <template #suffix>
            <wd-icon
              name="edit-outline"
              size="36rpx"
              color="#999"
              v-if="!formData.address"
            ></wd-icon>
          </template>
        </wd-input>
      </wd-cell-group>

      <!-- 上传照片 -->
      <wd-cell-group border>
        <wd-cell title="上传照片">
          <wd-upload
            v-model="formData.images"
            multiple
            accept="image"
            max-count="3"
            max-size="10485760"
            :successStatus="201"
            :action="uploadUrl"
            name="file"
            @change="handleChange"
          />
          <view class="upload-tips">选填，最多可上传3张照片</view>
        </wd-cell>
      </wd-cell-group>
    </wd-form>

    <!-- 添加底部占位，防止内容被提交按钮遮挡 -->
    <view style="height: 160rpx"></view>

    <!-- 调试信息 -->
    <view v-if="formData.images && formData.images.length > 0" class="debug-info">
      <view class="debug-title">上传图片列表:</view>
      <view v-for="(img, index) in formData.images" :key="index" class="debug-item">
        {{ index + 1 }}. {{ img }}
      </view>
    </view>

    <view class="submit-wrapper">
      <wd-button size="large" type="primary" block custom-class="submit-btn" @click="submitForm">
        确认预约
      </wd-button>
      <view class="safe-area-inset-bottom"></view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  getServiceTypes,
  getSceneTypes,
  submitAppointment,
  type IAppointmentForm,
} from '@/api/appointment'
import useRequest from '@/hooks/useRequest'
import { useUpload } from 'wot-design-uni'

// 使用wot-design-uni的上传钩子
const { startUpload, abort, chooseFile, UPLOAD_STATUS } = useUpload()

// 上传相关配置
const uploadUrl = import.meta.env.VITE_UPLOAD_BASEURL // 设置公共上传接口地址
const uploadHeader = { 'Content-Type': 'multipart/form-data' }
const uploadData = { businessType: 'appointment' } // 额外的表单数据
const uploadStatusKey = 'status' // 状态字段名

function handleChange({ fileList: files }) {
  try {
    uploadImgs.value = Array.from(files)
      .map((item: any) => {
        // 安全地解析响应数据
        try {
          if (typeof item.response === 'string') {
            const parsed = JSON.parse(item.response)
            return parsed.url || (parsed.data && parsed.data.url) || ''
          } else if (item.response && typeof item.response === 'object') {
            return item.response.url || (item.response.data && item.response.data.url) || ''
          }
          return item.url || ''
        } catch (e) {
          console.error('解析上传响应失败:', e)
          return item.url || ''
        }
      })
      .filter(Boolean)

    console.log('处理后的上传图片URLs:', uploadImgs.value)
  } catch (error) {
    console.error('处理上传文件列表失败:', error)
  }
}

// 安全距离
const safeAreaBottom = ref(0)

// 表单引用
const appointmentForm = ref()
const uploadImgs = ref([])
// 表单数据
const formData = reactive<IAppointmentForm>({
  problemType: '',
  subType: '',
  subTypes: [], // 多选子类型
  problemDesc: '',
  name: '',
  gender: 'male',
  phone: '',
  address: '',
  location: '',
  latitude: '',
  longitude: '',
  images: [],
})

// 手机号验证
const validatePhone = (val) => {
  return /^1\d{10}$/.test(val)
}

// 问题类型选项
const problemTypes = ref([
  { value: 'waterproof', label: '防水补漏' },
  { value: 'wallRenovation', label: '墙面翻新' },
  { value: 'tileRepair', label: '瓷砖修复' },
  { value: 'other', label: '其它问题' },
])

// 子类型选项映射
const subTypeOptionsMap = reactive({
  // 防水补漏的子类型
  waterproof: [
    { value: 'bathroom', label: '卫生间' },
    { value: 'kitchen', label: '厨房' },
    { value: 'window', label: '窗户' },
    { value: 'exteriorWall', label: '外墙' },
    { value: 'roof', label: '屋面' },
    { value: 'basement', label: '地下室' },
    { value: 'other', label: '其它' },
  ],
  // 墙面翻新的子类型
  wallRenovation: [
    { value: 'wholeHouse', label: '全屋翻新' },
    { value: 'partial', label: '局部翻新' },
    { value: 'repair', label: '墙面维修' },
    { value: 'other', label: '其它' },
  ],
  // 瓷砖修复的子类型
  tileRepair: [
    { value: 'hollow', label: '瓷砖空鼓' },
    { value: 'falling', label: '瓷砖脱落' },
    { value: 'broken', label: '瓷砖破损' },
    { value: 'recolor', label: '瓷砖改色' },
    { value: 'other', label: '其它' },
  ],
  // 其他问题没有子类型
  other: [],
})

// 当前选择的子类型选项
const subTypeOptions = computed(() => {
  return subTypeOptionsMap[formData.problemType] || []
})

// 子类型的标签名称
const subTypeLabel = computed(() => {
  if (formData.problemType === 'waterproof') return '问题位置'
  if (formData.problemType === 'wallRenovation') return '翻新类型'
  if (formData.problemType === 'tileRepair') return '瓷砖问题'
  return '类型'
})

// 是否显示场景选项
const showSceneOptions = computed(() => {
  return formData.problemType && formData.problemType !== 'other'
})

// 问题类型变更处理
const handleProblemTypeChange = () => {
  // 清空子类型选择和问题描述
  formData.subType = ''
  formData.subTypes = []
  formData.problemDesc = ''
}

// 提交预约请求
const { loading: submitLoading, run: submitAppointmentRequest } = useRequest(
  () => submitAppointment(formData),
  {
    immediate: false,
    onSuccess: (result) => {
      uni.showToast({
        title: `预约成功！`,
        icon: 'none',
        duration: 3000,
      })

      // 跳转到订单详情或首页
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/orders/index' })
      }, 2000)
    },
    onError: (error) => {
      console.error('预约提交失败', error)
      uni.showToast({
        title: '预约提交失败，请重试',
        icon: 'none',
      })
    },
  },
)

// 从URL参数获取服务类型并设置默认值
onLoad((options) => {
  console.log('预约页面接收到的参数:', options)

  // 处理服务类型参数
  if (options && options.serviceType) {
    // 处理参数映射，确保能匹配到选项
    let problemType = options.serviceType

    // 特殊处理：映射旧参数到新类型
    if (problemType === 'repair' || problemType === 'waterproof') {
      problemType = 'waterproof'
    } else if (problemType === 'new') {
      problemType = 'wallRenovation'
    } else if (problemType === 'drain') {
      problemType = 'other'
    } else if (problemType === 'unsure' || !problemType) {
      problemType = 'other'
    }

    console.log('设置问题类型:', problemType)
    // 设置默认选中的问题类型
    formData.problemType = problemType
  }

  // 处理其他可能的参数
  if (options && options.sceneType) {
    // 设置子类型
    formData.subType = options.sceneType
  }

  // 如果有其他预填充数据，也可以在这里处理
  if (options && options.name) {
    // 尝试解析姓名和性别
    if (options.name.endsWith('先生')) {
      formData.name = options.name.replace('先生', '')
      formData.gender = 'male'
    } else if (options.name.endsWith('女士')) {
      formData.name = options.name.replace('女士', '')
      formData.gender = 'female'
    } else {
      formData.name = options.name
    }
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
    },
  })
})

// 选择位置
const chooseLocation = () => {
  // #ifdef MP-WEIXIN
  // 先获取当前位置
  uni.showLoading({
    title: '定位中...',
    mask: true,
  })

  // 打开位置选择器的方法
  const openLocationChooser = (options = {}) => {
    uni.chooseLocation({
      ...options,
      success: (locationRes) => {
        console.log('选择位置成功', locationRes)
        // 自动填充省市区和详细地址
        formData.location = locationRes.name || locationRes.address
        formData.region = locationRes.address.split(',')[0] || ''
        // 保存经纬度信息
        formData.latitude = locationRes.latitude.toString()
        formData.longitude = locationRes.longitude.toString()
        console.log('已保存位置信息，经度：', formData.longitude, '纬度：', formData.latitude)
      },
      fail: (err) => {
        console.log('选择位置失败', err)
        if (err.errMsg.includes('auth')) {
          uni.showToast({
            title: '请授权位置权限',
            icon: 'none',
          })
        } else {
          uni.showToast({
            title: '选择位置失败',
            icon: 'none',
          })
        }
      },
    })
  }

  // 获取当前位置，然后打开位置选择器
  uni.getLocation({
    type: 'gcj02', // 使用gcj02坐标系
    success: (res) => {
      uni.hideLoading()
      console.log('获取当前位置成功', res)

      // 使用当前位置打开位置选择器
      openLocationChooser({
        latitude: res.latitude,
        longitude: res.longitude,
      })
    },
    fail: (err) => {
      uni.hideLoading()
      console.log('获取当前位置失败', err)

      // 如果获取当前位置失败，直接打开位置选择器
      openLocationChooser()
    },
  })
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '仅微信小程序支持此功能',
    icon: 'none',
  })
  // #endif
}

// 提交表单
const submitForm = () => {
  // 使用wd-form进行表单验证
  appointmentForm.value
    .validate()
    .then(({ valid, errors }) => {
      if (valid) {
        // 处理图片数据格式，确保能够正确提交
        // wot-design-uni上传组件可能会以对象形式存储图片信息
        // 设置上传的图片数组
        formData.images = uploadImgs.value

        // 表单验证通过，调用接口提交数据
        console.log('提交预约数据:', formData, Array.from(new Set(uploadImgs.value)))
        submitAppointmentRequest()
      } else {
        console.log('表单验证失败', errors)
      }
    })
    .catch((error) => {
      console.log('验证出错', error)
    })
}

// 这里不需要任何代码，我们已经在前面定义了所有需要的上传处理函数

// 选择联系人
const chooseContact = () => {
  // #ifdef MP-WEIXIN
  uni.chooseContact({
    success: (res) => {
      console.log('选择联系人成功:', res)
      // 提取手机号，通常是11位数字
      const phoneMatch = res.phoneNumber.match(/1\d{10}/)
      if (phoneMatch) {
        formData.phone = phoneMatch[0]
        uni.showToast({
          title: '已自动填写联系电话',
          icon: 'success',
          duration: 2000,
        })
      } else {
        // 如果没有找到符合格式的手机号，直接使用返回的号码
        formData.phone = res.phoneNumber.replace(/\s+/g, '')
        uni.showToast({
          title: '请确认电话号码格式是否正确',
          icon: 'none',
          duration: 2000,
        })
      }

      // 如果有姓名且用户还没填写姓名，自动填充姓名
      if (res.displayName && !formData.name) {
        formData.name = res.displayName
      }
    },
    fail: (err) => {
      console.error('选择联系人失败:', err)
      uni.showToast({
        title: '选择联系人失败',
        icon: 'none',
      })
    },
  })
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '该功能仅在微信小程序中可用',
    icon: 'none',
  })
  // #endif
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

:deep(.wd-cell-group) {
  margin: 0 30rpx 20rpx;
  border-radius: 8rpx;
  overflow: hidden;
}

.gender-group {
  display: flex;
  justify-content: space-between;
  :deep(.wd-cell__value) {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
}

.gender-radio {
  flex: 1;

  :deep(.wd-radio__shape) {
    margin-right: 8rpx;
  }

  :deep(.wd-radio__label) {
    text-align: center;
  }
}

:deep(.wd-form .wd-cell) {
  padding: 20rpx 32rpx;
  justify-content: space-between;
}

:deep(.wd-form .wd-cell__title) {
  width: 50%;
  min-width: 50%;
  flex: 0 0 50%;
  font-size: 28rpx;
  padding-right: 10rpx;
  box-sizing: border-box;
}

:deep(.wd-cell__value) {
  width: 50%;
  flex: 0 0 50%;
  text-align: right;
}

:deep(.wd-picker__value),
:deep(.wd-input__inner) {
  text-align: right;
}

.upload-tips {
  color: #999;
  font-size: 24rpx;
  margin-top: 8rpx;
  text-align: right;
}

.submit-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  z-index: 9;
  background-color: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
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

/* 调试信息样式 */
.debug-info {
  margin: 20rpx 30rpx;
  padding: 20rpx;
  background-color: #f7f7f7;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #666;
}

.debug-title {
  font-weight: bold;
  margin-bottom: 10rpx;
}

.debug-item {
  word-break: break-all;
  margin-bottom: 5rpx;
  padding-left: 10rpx;
}
</style>
