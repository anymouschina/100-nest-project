import {
  login as _login,
  getUserInfo as _getUserInfo,
  wxLogin as _wxLogin,
  logout as _logout,
  getWxCode,
} from '@/api/login'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toast } from '@/utils/toast'
import { IUserInfoVo } from '@/api/login.typings'

// 初始化状态
const userInfoState: IUserInfoVo = {
  id: 0,
  username: '',
  avatar: '/static/images/default-avatar.png',
  token: '',
}

export const useUserStore = defineStore(
  'user',
  () => {
    // 定义用户信息
    const userInfo = ref<IUserInfoVo>({ ...userInfoState })
    const token = ref(uni.getStorageSync('token') || '')
    // 设置用户信息
    const setUserInfo = (val: IUserInfoVo) => {
      console.log('设置用户信息', val)
      // 若头像为空 则使用默认头像
      if (!val.avatar) {
        val.avatar = userInfoState.avatar
      } else {
        val.avatar = 'https://oss.laf.run/ukw0y1-site/avatar.jpg?feige'
      }
      userInfo.value = val
      if(!userInfo.value.token){
        userInfo.value.token = token.value
      }
    }
    // 删除用户信息
    const removeUserInfo = () => {
      userInfo.value = { ...userInfoState }
      uni.removeStorageSync('userInfo')
      uni.removeStorageSync('token')
    }
    /**
     * 用户登录
     * @param credentials 登录参数
     * @returns R<IUserLogin>
     */
    const login = async (credentials: {
      username: string
      password: string
      code: string
      uuid: string
    }) => {
      const res = await _login(credentials)
      console.log('登录信息', res)
      toast.success('登录成功')
      getUserInfo()
      return res
    }
    /**
     * 获取用户信息
     */
    const getUserInfo = async () => {
      const res = await _getUserInfo()
      const userInfo = res.data
      setUserInfo(userInfo)
      uni.setStorageSync('userInfo', userInfo)
      uni.setStorageSync('token', userInfo.token)
      // TODO 这里可以增加获取用户路由的方法 根据用户的角色动态生成路由
      return res
    }
    /**
     * 退出登录 并 删除用户信息
     */
    const logout = async () => {
      _logout()
      removeUserInfo()
    }
    
    /**
     * 获取微信用户信息（头像和昵称）
     */
    const getWxUserInfo = (): Promise<{
      avatarUrl: string
      nickName: string
    }> => {
      return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        uni.getUserProfile({
          desc: '获取您的头像和昵称',
          success: (res) => {
            const { userInfo } = res
            resolve({
              avatarUrl: userInfo.avatarUrl,
              nickName: userInfo.nickName
            })
          },
          fail: (err) => {
            console.error('获取微信用户信息失败', err)
            resolve({
              avatarUrl: '',
              nickName: ''
            })
          }
        })
        // #endif
        
        // #ifndef MP-WEIXIN
        resolve({
          avatarUrl: '',
          nickName: ''
        })
        // #endif
      })
    }
    
    /**
     * 微信登录
     */
    const wxLogin = async () => {
      // 获取微信小程序登录的code
      const data = await getWxCode()

      const res = await _wxLogin(data)
      console.log('微信登录code', data, res)

      // 尝试获取微信用户信息
      try {
        const wxUserInfo = await getWxUserInfo()
        console.log('获取到微信用户信息', wxUserInfo)
        
        // 如果有微信用户信息，则使用微信头像和昵称
        if (wxUserInfo.avatarUrl && res.data) {
          const updatedUserInfo = {
            ...res.data,
            avatar: wxUserInfo.avatarUrl,
            username: wxUserInfo.nickName || res.data.username
          } as any
          
          if(updatedUserInfo){
            token.value = updatedUserInfo.token;
            setUserInfo(updatedUserInfo)
          }
        } else if(res.data) {
          token.value = res.data.token;
          setUserInfo(res.data as any)
        }
      } catch (error) {
        console.error('获取微信用户信息失败', error)
        if(res.data){
          token.value = res.data.token;
          setUserInfo(res.data as any)
        }
      }
      
      getUserInfo()
      return res
    }

    return {
      userInfo,
      login,
      wxLogin,
      getUserInfo,
      logout,
    }
  },
  {
    persist: true,
  },
)
