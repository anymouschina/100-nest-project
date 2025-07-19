/**
 * 邮箱验证正则表达式
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function isEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

/**
 * 验证手机号格式（中国）
 * @param phone 手机号
 * @returns 是否有效
 */
export function isPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 验证结果
 */
export function validatePassword(password: string): {
  valid: boolean
  message?: string
} {
  if (!password) {
    return { valid: false, message: '密码不能为空' }
  }
  
  if (password.length < 6) {
    return { valid: false, message: '密码长度不能少于6位' }
  }
  
  if (password.length > 20) {
    return { valid: false, message: '密码长度不能超过20位' }
  }
  
  if (!/^(?=.*[a-zA-Z])(?=.*\d)[^\s]+$/.test(password)) {
    return { valid: false, message: '密码必须包含字母和数字，不能包含空格' }
  }
  
  return { valid: true }
}

/**
 * 验证用户名格式
 * @param username 用户名
 * @returns 验证结果
 */
export function validateUsername(username: string): {
  valid: boolean
  message?: string
} {
  if (!username) {
    return { valid: false, message: '用户名不能为空' }
  }
  
  if (username.length < 3) {
    return { valid: false, message: '用户名长度不能少于3位' }
  }
  
  if (username.length > 20) {
    return { valid: false, message: '用户名长度不能超过20位' }
  }
  
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    return { valid: false, message: '用户名只能包含字母、数字、下划线和中文' }
  }
  
  return { valid: true }
}