/**
 * 微信登录工具类
 */

/**
 * 判断是否为微信环境
 */
export const isWechatEnv = (): boolean => {
  // #ifdef MP-WEIXIN
  return true
  // #endif

  // #ifdef H5
  return isWechatBrowser()
  // #endif

  // #ifndef MP-WEIXIN
  return false
  // #endif
}

/**
 * 判断是否为微信浏览器
 */
export const isWechatBrowser = (): boolean => {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent.toLowerCase()
  return ua.indexOf('micromessenger') !== -1
}

/**
 * 获取微信授权URL
 */
export const getWechatAuthUrl = (type: 'snsapi_userinfo' | 'snsapi_login' = 'snsapi_userinfo'): string => {
  const appId = import.meta.env.VITE_WECHAT_APP_ID
  if (!appId) {
    throw new Error('微信AppID未配置')
  }

  const redirectUri = encodeURIComponent(window.location.origin + '/pages/login/wx-callback')
  const state = Math.random().toString(36).substring(2, 15)
  
  // 存储state用于校验
  uni.setStorageSync('wx_oauth_state', state)

  if (type === 'snsapi_login') {
    // 网站应用扫码登录
    return `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`
  } else {
    // 公众号授权登录
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${type}&state=${state}#wechat_redirect`
  }
}

/**
 * 解析URL参数
 */
export const parseQueryString = (url: string): Record<string, string> => {
  const queryString = url.split('?')[1] || ''
  const params: Record<string, string> = {}
  
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=')
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value)
      }
    })
  }
  
  return params
}

/**
 * 微信错误码处理
 */
export const handleWechatError = (error: any): string => {
  const errorMap: Record<string, string> = {
    'access_denied': '用户拒绝授权',
    'invalid_scope': '授权作用域无效',
    'snsapi_base': '静默授权只能获取openid',
    'snsapi_userinfo': '需要用户手动授权',
    'snsapi_login': '需要用户扫码授权',
  }

  if (typeof error === 'string') {
    return errorMap[error] || error
  }

  if (error.errMsg) {
    if (error.errMsg.includes('deny')) {
      return '用户拒绝授权'
    }
    if (error.errMsg.includes('cancel')) {
      return '用户取消授权'
    }
  }

  return '微信授权失败'
}

/**
 * 存储登录前页面，用于登录后跳转
 */
export const saveRedirectUrl = (url?: string) => {
  const redirect = url || getCurrentPage()
  uni.setStorageSync('redirect_after_login', redirect)
}

/**
 * 获取当前页面路径
 */
export const getCurrentPage = (): string => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  return `/${currentPage.route}`
}

/**
 * 跳转到登录页
 */
export const redirectToLogin = (redirect?: string) => {
  saveRedirectUrl(redirect)
  uni.navigateTo({
    url: '/pages/login/index'
  })
}

/**
 * 检查是否已登录
 */
export const checkLogin = (): boolean => {
  const token = uni.getStorageSync('token')
  return !!token
}