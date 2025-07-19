import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN.json'
import enUS from './en-US.json'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'zh-Hans': zhCN,
  'zh': zhCN,
}

// 获取系统语言
function getSystemLanguage() {
  // #ifdef H5
  const browserLang = navigator.language || navigator.userLanguage
  if (browserLang.startsWith('zh')) return 'zh-CN'
  if (browserLang.startsWith('en')) return 'en-US'
  // #endif
  
  // #ifdef MP-WEIXIN
  const systemInfo = uni.getSystemInfoSync()
  const lang = systemInfo.language
  if (lang.startsWith('zh')) return 'zh-CN'
  if (lang.startsWith('en')) return 'en-US'
  // #endif
  
  return 'zh-CN' // 默认中文
}

const i18n = createI18n({
  legacy: false,
  locale: getSystemLanguage(),
  fallbackLocale: 'zh-CN',
  messages,
  globalInjection: true,
})

export default i18n