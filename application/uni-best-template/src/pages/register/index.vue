<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '邮件注册',
    navigationStyle: 'custom',
  },
}
</route>
<template>
  <view class="register-container">
    <!-- 背景装饰元素 -->
    <view class="bg-decoration bg-circle-1"></view>
    <view class="bg-decoration bg-circle-2"></view>
    <view class="bg-decoration bg-circle-3"></view>

    <view class="register-header">
      <image class="register-logo" :src="appLogo" mode="aspectFit"></image>
      <view class="register-title">{{ appTitle }}</view>
    </view>

    <view class="register-form">
      <view class="welcome-text">欢迎注册</view>
      <view class="register-desc">请填写您的注册信息</view>

      <view class="register-input-group">
        <!-- 邮箱输入 -->
        <view class="input-wrapper">
          <wd-input
            v-model="registerForm.email"
            prefix-icon="email"
            placeholder="请输入邮箱地址"
            clearable
            class="register-input"
            :border="false"
            required
            type="email"
            @blur="handleEmailBlur"
          ></wd-input>
          <view class="input-bottom-line"></view>
        </view>

        <!-- 邮箱验证码 -->
        <view class="input-wrapper captcha-wrapper">
          <wd-input
            v-model="registerForm.emailCode"
            prefix-icon="secured"
            placeholder="请输入邮箱验证码"
            clearable
            class="register-input captcha-input"
            :border="false"
            required
          >
            <template #suffix>
              <view
                class="email-code-btn"
                :class="{ disabled: codeCountdown > 0 }"
                @click="sendEmailCode"
              >
                {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
              </view>
            </template>
          </wd-input>
          <view class="input-bottom-line"></view>
        </view>

        <!-- 用户名输入 -->
        <view class="input-wrapper">
          <wd-input
            v-model="registerForm.username"
            prefix-icon="user"
            placeholder="请输入用户名"
            clearable
            class="register-input"
            :border="false"
            required
            maxlength="20"
            @blur="checkUsernameExists"
          ></wd-input>
          <view class="input-bottom-line"></view>
        </view>

        <!-- 密码输入 -->
        <view class="input-wrapper">
          <wd-input
            v-model="registerForm.password"
            prefix-icon="lock-on"
            placeholder="请输入密码"
            clearable
            show-password-on="click"
            class="register-input"
            :border="false"
            required
            type="password"
            maxlength="20"
          ></wd-input>
          <view class="input-bottom-line"></view>
        </view>

        <!-- 确认密码 -->
        <view class="input-wrapper">
          <wd-input
            v-model="registerForm.confirmPassword"
            prefix-icon="lock-on"
            placeholder="请确认密码"
            clearable
            show-password-on="click"
            class="register-input"
            :border="false"
            required
            type="password"
            maxlength="20"
          ></wd-input>
          <view class="input-bottom-line"></view>
        </view>
        
        <!-- 推荐码（选填） -->
        <view class="input-wrapper">
          <wd-input
            v-model="registerForm.referralCode"
            prefix-icon="gift"
            placeholder="推荐码（选填）"
            clearable
            class="register-input"
            :border="false"
            maxlength="20"
          ></wd-input>
          <view class="input-bottom-line"></view>
        </view>
      </view>

      <!-- 注册按钮 -->
      <view class="register-buttons">
        <wd-button
          type="primary"
          size="large"
          block
          @click="handleEmailRegister"
          class="register-btn"
          :loading="loading"
        >
          注册
        </wd-button>

        <view class="login-link" @click="goToLogin">已有账号？立即登录</view>
      </view>
    </view>

    <!-- 隐私协议勾选 -->
    <view class="privacy-agreement">
      <wd-checkbox
        v-model="agreePrivacy"
        shape="square"
        class="privacy-checkbox"
        active-color="var(--wot-color-theme, #1989fa)"
      >
        <view class="agreement-text">
          我已阅读并同意
          <text class="agreement-link" @click.stop="handleAgreement('user')">《用户协议》</text>
          和
          <text class="agreement-link" @click.stop="handleAgreement('privacy')">《隐私政策》</text>
        </view>
      </wd-checkbox>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'
import { toast } from '@/utils/toast'
import { isEmail } from '@/utils/validate'
import type { IEmailRegisterForm } from '@/api/register'
import { sendEmailCode as sendEmailCodeApi, emailRegister } from '@/api/register'

// 获取环境变量
const appTitle = ref(import.meta.env.VITE_APP_TITLE || 'Unibest Register')
const appLogo = ref(import.meta.env.VITE_APP_LOGO || '/static/logo.svg')

// 初始化store
const userStore = useUserStore()

// 注册表单数据
const registerForm = ref<IEmailRegisterForm>({
  email: '',
  emailCode: '',
  username: '',
  password: '',
  confirmPassword: '',
  referralCode: ''
})

// 验证码倒计时
const codeCountdown = ref(0)
const loading = ref(false)

// 隐私协议勾选状态
const agreePrivacy = ref(true)

// 页面加载时获取URL参数中的推荐码
onLoad((options: any) => {
  if (options.ref) {
    registerForm.value.referralCode = options.ref
    console.log('自动填入推荐码:', options.ref)
  }
})

// 邮箱验证
const validateEmail = () => {
  if (registerForm.value.email && !isEmail(registerForm.value.email)) {
    toast.error('请输入正确的邮箱地址')
    return false
  }
  return true
}

// 密码强度验证
const validatePasswordStrength = (password: string) => {
  // 检查是否包含大小写字母和数字
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpace = /\s/.test(password)

  if (hasSpace) {
    toast.error('密码不能包含空格')
    return false
  }

  if (!hasUpperCase) {
    toast.error('密码必须包含大写字母')
    return false
  }

  if (!hasLowerCase) {
    toast.error('密码必须包含小写字母')
    return false
  }

  if (!hasNumber) {
    toast.error('密码必须包含数字')
    return false
  }

  return true
}

// 处理邮箱失焦事件
const handleEmailBlur = async () => {
  if (!validateEmail()) return
  await checkEmailRegistered()
}

// 检查邮箱是否已注册
const checkEmailRegistered = async () => {
  if (!registerForm.value.email || !validateEmail()) return

  try {
    const isExist = await checkEmailExist(registerForm.value.email)
    if (isExist) {
      toast.error('该邮箱已被注册')
      return false
    }
    return true
  } catch (error) {
    console.error('检查邮箱失败:', error)
    return true // 允许继续操作，避免阻塞用户体验
  }
}

// 检查用户名是否已存在
const checkUsernameExists = async () => {
  if (!registerForm.value.username) return

  try {
    const isExist = await checkUsernameExist(registerForm.value.username)
    if (isExist) {
      toast.error('该用户名已被使用')
      return false
    }
    return true
  } catch (error) {
    console.error('检查用户名失败:', error)
    return true // 允许继续操作，避免阻塞用户体验
  }
}

// 发送邮箱验证码
const sendEmailCode = async () => {
  if (codeCountdown.value > 0) return

  if (!registerForm.value.email) {
    toast.error('请输入邮箱地址')
    return
  }

  if (!validateEmail()) return

  // 检查邮箱是否已注册
  const emailValid = await checkEmailRegistered()
  if (!emailValid) return

  try {
    await sendEmailCodeApi(registerForm.value.email)
    toast.success('验证码已发送到您的邮箱')

    // 开始倒计时
    codeCountdown.value = 60
    const timer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error: any) {
    console.error('发送验证码失败:', error)
    const errorMessage = error?.data?.message || error?.data?.msg || '发送验证码失败，请稍后重试'
    toast.error(errorMessage)
  }
}

// 表单验证
const validateForm = async () => {
  if (!registerForm.value.email) {
    toast.error('请输入邮箱地址')
    return false
  }

  if (!validateEmail()) return false

  // 检查邮箱是否已注册
  const emailValid = await checkEmailRegistered()
  if (!emailValid) return false

  if (!registerForm.value.emailCode) {
    toast.error('请输入邮箱验证码')
    return false
  }

  if (!registerForm.value.username) {
    toast.error('请输入用户名')
    return false
  }

  if (registerForm.value.username.length < 2) {
    toast.error('用户名长度不能少于2位')
    return false
  }

  if (registerForm.value.username.length > 20) {
    toast.error('用户名长度不能超过20位')
    return false
  }

  // 检查用户名是否已存在
  const usernameValid = await checkUsernameExists()
  if (!usernameValid) return false

  if (!registerForm.value.password) {
    toast.error('请输入密码')
    return false
  }

  if (registerForm.value.password.length < 6) {
    toast.error('密码长度不能少于6位')
    return false
  }

  if (registerForm.value.password.length > 20) {
    toast.error('密码长度不能超过20位')
    return false
  }

  // 密码强度验证
  if (!validatePasswordStrength(registerForm.value.password)) {
    return false
  }

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    toast.error('两次输入的密码不一致')
    return false
  }

  return true
}

// 邮箱注册
const handleEmailRegister = async () => {
  if (!agreePrivacy.value) {
    toast.error('请阅读同意协议')
    return
  }

  const isFormValid = await validateForm()
  if (!isFormValid) return

  loading.value = true
  try {
    const response = await emailRegister(registerForm.value)
    console.log('注册响应完整数据:', response)
    
    // 处理不同的响应格式
    if (response.success === false) {
      // 如果后端返回success=false，显示错误消息
      const errorMsg = response.message || response.msg || '注册失败'
      toast.error(errorMsg)
      return
    }
    
    // 成功处理 - 支持多种响应格式
    let userData, token
    
    if (response.data) {
      // 格式1: { success: true, data: { token, user } }
      userData = response.data.user
      token = response.data.token
    } else if (response.user) {
      // 格式2: { user, token }
      userData = response.user
      token = response.token
    } else {
      // 格式3: 直接返回用户数据
      userData = response
      token = response.token
    }
    
    if (!userData || !token) {
      console.warn('响应格式异常:', response)
      toast.success('注册成功')
    } else {
      toast.success('注册成功')
      
      // 保存用户信息到store
      userStore.setUserInfo({
        id: userData.userId?.toString() || userData.id?.toString(),
        username: userData.name || userData.username,
        email: userData.email,
        token: token,
      })
    }

    // 注册成功后跳转到首页
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/index/index',
      })
    }, 1500)
  } catch (error: any) {
    console.error('注册失败:', error)
    const errorMessage = error?.data?.message || error?.data?.msg || '注册失败，请稍后重试'
    toast.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 跳转到登录页
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/index',
  })
}

// 处理协议点击
const handleAgreement = (type: 'user' | 'privacy') => {
  const title = type === 'user' ? '用户协议' : '隐私政策'
  // 实际项目中可以跳转到对应的协议页面
  // uni.navigateTo({
  //   url: `/pages/mine/agreement/${type}`
  // })
}
</script>

<style lang="scss" scoped>
.register-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 70rpx;
  background-color: #ffffff;
  background-image: linear-gradient(
    135deg,
    rgba(25, 137, 250, 0.05) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  position: relative;
  overflow: hidden;
}

/* 背景装饰元素 */
.bg-decoration {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(25, 137, 250, 0.05), rgba(25, 137, 250, 0.1));
  z-index: 0;
  pointer-events: none;
}

.bg-circle-1 {
  width: 500rpx;
  height: 500rpx;
  top: -200rpx;
  right: -200rpx;
  opacity: 0.6;
}

.bg-circle-2 {
  width: 400rpx;
  height: 400rpx;
  bottom: 10%;
  left: -200rpx;
  opacity: 0.4;
}

.bg-circle-3 {
  width: 300rpx;
  height: 300rpx;
  bottom: -100rpx;
  right: 10%;
  opacity: 0.3;
  background: linear-gradient(135deg, rgba(7, 193, 96, 0.05), rgba(7, 193, 96, 0.1));
}

.register-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 120rpx;
  animation: fadeInDown 0.8s ease-out;

  .register-logo {
    width: 200rpx;
    height: 200rpx;
    border-radius: 36rpx;
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.12);
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
      box-shadow: 0 6rpx 15rpx rgba(0, 0, 0, 0.1);
    }
  }

  .register-title {
    margin-top: 30rpx;
    font-size: 46rpx;
    font-weight: bold;
    color: #333333;
    letter-spacing: 3rpx;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
  }
}

.register-form {
  flex: 1;
  margin-top: 70rpx;
  animation: fadeIn 0.8s ease-out 0.2s both;

  .welcome-text {
    margin-bottom: 16rpx;
    font-size: 48rpx;
    font-weight: bold;
    color: #333333;
    text-align: center;
    letter-spacing: 1rpx;
  }

  .register-desc {
    margin-bottom: 70rpx;
    font-size: 28rpx;
    color: #888888;
    text-align: center;
  }

  .register-input-group {
    margin-bottom: 60rpx;
    position: relative;
    z-index: 1;

    .input-wrapper {
      position: relative;
      margin-bottom: 50rpx;
      transition: all 0.3s ease;
      border-radius: 16rpx;
      overflow: hidden;

      &:last-child {
        margin-bottom: 0;
      }

      .register-input {
        padding: 12rpx 20rpx;
        background-color: rgba(245, 247, 250, 0.7);
        border-radius: 16rpx;
        transition: all 0.3s ease;

        :deep(.wd-input__inner) {
          font-size: 30rpx;
          color: #333333;
        }

        :deep(.wd-input__placeholder) {
          font-size: 28rpx;
          color: #aaaaaa;
        }

        &:focus-within {
          background-color: rgba(245, 247, 250, 0.95);
          box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.06);
          transform: translateY(-3rpx);
        }
      }

      .input-bottom-line {
        position: absolute;
        bottom: -2rpx;
        left: 5%;
        width: 90%;
        height: 2rpx;
        background: linear-gradient(
          to right,
          transparent,
          var(--wot-color-theme, #1989fa),
          transparent
        );
        transition: transform 0.4s ease;
        transform: scaleX(0);
        opacity: 0.8;
      }

      &:focus-within .input-bottom-line {
        transform: scaleX(1);
      }
    }
  }

  .register-buttons {
    display: flex;
    flex-direction: column;
    gap: 36rpx;

    .register-btn {
      height: 96rpx;
      font-size: 32rpx;
      font-weight: 500;
      letter-spacing: 2rpx;
      border-radius: 48rpx;
      box-shadow: 0 10rpx 20rpx rgba(25, 137, 250, 0.25);
      transition: all 0.3s ease;

      &:active {
        box-shadow: 0 5rpx 10rpx rgba(25, 137, 250, 0.2);
        transform: scale(0.98);
      }
    }

    .login-link {
      text-align: center;
      font-size: 28rpx;
      color: var(--wot-color-theme, #1989fa);
      transition: all 0.3s ease;

      &:active {
        opacity: 0.8;
        transform: scale(0.98);
      }
    }
  }
}

.email-code-btn {
  padding: 0 20rpx;
  display: inline-block;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 24rpx;
  color: var(--wot-color-theme, #1989fa);
  background-color: rgba(25, 137, 250, 0.1);
  border-radius: 30rpx;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 16rpx;

  &:active {
    background-color: rgba(25, 137, 250, 0.2);
    transform: scale(0.95);
  }

  &.disabled {
    color: #999999;
    background-color: #f5f5f5;
    cursor: not-allowed;

    &:active {
      transform: none;
    }
  }
}

.privacy-agreement {
  display: flex;
  justify-content: center;
  margin: 30rpx 0 40rpx;
  animation: fadeIn 0.8s ease-out 0.4s both;

  .privacy-checkbox {
    display: flex;
    align-items: center;
  }

  .agreement-text {
    font-size: 26rpx;
    line-height: 1.6;
    color: #666666;

    .agreement-link {
      padding: 0 4rpx;
      font-weight: 500;
      color: var(--wot-color-theme, #1989fa);
      transition: all 0.3s ease;

      &:active {
        opacity: 0.8;
        transform: scale(0.98);
      }
    }
  }
}

/* 添加动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
