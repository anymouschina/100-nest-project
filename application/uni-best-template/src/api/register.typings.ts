/**
 * 邮箱注册表单数据
 */
export interface IEmailRegisterForm {
  email: string
  emailCode: string
  username: string
  password: string
  confirmPassword: string
  referralCode?: string
}

/**
 * 发送邮箱验证码请求参数
 */
export interface IEmailCodeRequest {
  email: string
}

/**
 * 邮箱注册响应数据
 */
export interface IEmailRegisterResponse {
  success?: boolean
  message?: string
  token?: string
  user?: {
    userId: number
    email: string
    name: string
  }
  data?: {
    token: string
    user: {
      userId: number
      email: string
      name: string
    }
  }
}

/**
 * 检查邮箱是否已存在响应
 */
export interface ICheckEmailResponse {
  exist: boolean
}

/**
 * 检查用户名是否已存在响应
 */
export interface ICheckUsernameResponse {
  exist: boolean
}