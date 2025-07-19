import type { IEmailRegisterForm, IEmailCodeRequest, IEmailRegisterResponse } from './register.typings'
import { http } from '@/utils/http'

/**
 * 发送邮箱验证码
 * @param email 邮箱地址
 */
export const sendEmailCode = (email: string) => {
  return http.post<void>('/api/email/send-code', { email })
}

/**
 * 邮箱注册
 * @param data 邮箱注册表单数据
 */
export const emailRegister = (data: IEmailRegisterForm) => {
  return http.post<IEmailRegisterResponse>('/api/auth/email-register', {
    email: data.email,
    code: data.emailCode,
    username: data.username,
    password: data.password
  })
}

/**
 * 检查邮箱是否已注册
 * @param email 邮箱地址
 */
export const checkEmailExist = (email: string) => {
  return http.get<boolean>('/api/auth/check-email', { email })
}

/**
 * 检查用户名是否已存在
 * @param username 用户名
 */
export const checkUsernameExist = (username: string) => {
  return http.get<boolean>('/api/auth/check-username', { username })
}