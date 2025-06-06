<route lang="json5">
    {
      style: {
        navigationBarTitleText: '用户协议',
        navigationStyle: 'custom',
      },
    }
    </route>
    
    <template>
      <view class="agreement-container">
        <view class="agreement-content">
          <view class="title">用户协议</view>
          <view class="update-time">更新日期：{{ updateDate }}</view>
          
          <view class="section">
            <view class="section-title">1. 协议的接受与修改</view>
            <view class="section-content">
              <view class="paragraph">
                欢迎使用我们的应用。本用户协议（以下简称"本协议"）是您与我们之间关于使用我们提供的服务所订立的协议。
              </view>
              <view class="paragraph">
                当您注册、使用本应用服务时，即表示您已充分阅读、理解并接受本协议的全部内容。如您对本协议有任何疑问，可通过本协议末尾提供的联系方式与我们联系。
              </view>
              <view class="paragraph">
                我们保留随时修改本协议的权利。当协议发生重大变更时，我们会通过应用内通知或其他适当方式通知您。如您继续使用我们的服务，即表示您接受修改后的协议。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">2. 服务内容</view>
            <view class="section-content">
              <view class="paragraph">
                我们的应用主要提供家居装修、维修服务的预约和管理功能，包括但不限于：
              </view>
              <view class="list-item">• 在线预约服务</view>
              <view class="list-item">• 服务进度查询</view>
              <view class="list-item">• 售后维修申请</view>
              <view class="list-item">• 用户评价与反馈</view>
              <view class="paragraph">
                我们保留随时变更、中断或终止部分或全部服务的权利。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">3. 用户账号与安全</view>
            <view class="section-content">
              <view class="paragraph">
                您需要注册账号才能使用我们的服务。您应提供真实、准确、完整的个人资料，并在资料变更时及时更新。
              </view>
              <view class="paragraph">
                您应妥善保管账号及密码信息，因账号或密码保管不善导致的损失由您自行承担。如发现任何未经授权使用您账号的情况，请立即通知我们。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">4. 用户行为规范</view>
            <view class="section-content">
              <view class="paragraph">
                您在使用我们的服务时，必须遵守中华人民共和国相关法律法规及本协议的规定，不得利用我们的服务从事违法违规活动，包括但不限于：
              </view>
              <view class="list-item">• 发布、传播违法信息</view>
              <view class="list-item">• 侵犯他人知识产权、商业秘密等合法权益</view>
              <view class="list-item">• 干扰或破坏服务的正常运行</view>
              <view class="list-item">• 收集其他用户的个人信息</view>
              <view class="paragraph">
                如您违反上述规定，我们有权视情况采取警告、限制或禁止使用部分或全部功能、终止服务等措施。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">5. 知识产权</view>
            <view class="section-content">
              <view class="paragraph">
                我们的应用及其所有内容，包括但不限于文字、图片、音频、视频、软件、程序、代码等，均受知识产权法律法规保护。未经我们许可，任何人不得擅自使用、修改、复制、公开传播、改变、散布、发行或公开发表上述内容。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">6. 免责声明</view>
            <view class="section-content">
              <view class="paragraph">
                我们尽最大努力确保服务的安全性和稳定性，但不能保证服务不会中断或没有错误。对于因不可抗力、计算机病毒或黑客攻击、系统不稳定、用户所在位置、用户关机、GSM网络、互联网络、通信线路等原因造成的服务中断或不能满足用户要求的，我们不承担责任。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">7. 协议终止</view>
            <view class="section-content">
              <view class="paragraph">
                本协议自您同意之日起生效，至您注销账号或我们终止服务之日终止。
              </view>
              <view class="paragraph">
                协议终止后，我们有权根据相关法律法规的要求继续保存您使用服务期间的相关信息，或对部分信息进行匿名化处理后予以留存。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">8. 法律适用与争议解决</view>
            <view class="section-content">
              <view class="paragraph">
                本协议的订立、执行和解释及争议的解决均适用中华人民共和国法律。
              </view>
              <view class="paragraph">
                如双方就本协议内容或其执行发生任何争议，应尽量友好协商解决；协商不成时，任何一方均可向我们所在地有管辖权的人民法院提起诉讼。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">9. 联系我们</view>
            <view class="section-content">
              <view class="paragraph">
                如您对本协议有任何疑问、意见或建议，可通过以下方式联系我们：
              </view>
              <view class="contact-info">电子邮件：support@unibest.tech</view>
              <view class="contact-info">客服电话：400-XXX-XXXX</view>
            </view>
          </view>
        </view>
      </view>
    </template>
    
    <script lang="ts" setup>
    import { ref } from 'vue'
    
    // 更新日期
    const updateDate = ref('2024年6月1日')
    </script>
    
    <style lang="scss" scoped>
    .agreement-container {
      padding: 30rpx;
      background-color: #f5f7fa;
      min-height: 100vh;
    }
    
    .agreement-content {
      background-color: #ffffff;
      border-radius: 24rpx;
      padding: 40rpx 30rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
    }
    
    .title {
      font-size: 40rpx;
      font-weight: bold;
      color: #333;
      text-align: center;
      margin-bottom: 20rpx;
    }
    
    .update-time {
      font-size: 28rpx;
      color: #999;
      text-align: center;
      margin-bottom: 40rpx;
    }
    
    .section {
      margin-bottom: 40rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .section-title {
      font-size: 34rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 20rpx;
      position: relative;
      padding-left: 24rpx;
    
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8rpx;
        height: 32rpx;
        background: linear-gradient(135deg, #4a7bff, #6a5acd);
        border-radius: 4rpx;
      }
    }
    
    .section-content {
      padding: 0 10rpx;
    }
    
    .paragraph {
      margin-bottom: 20rpx;
      font-size: 30rpx;
      color: #666;
      line-height: 1.6;
      text-align: justify;
    }
    
    .list-item {
      font-size: 30rpx;
      color: #666;
      line-height: 1.6;
      margin-bottom: 10rpx;
      padding-left: 20rpx;
    }
    
    .contact-info {
      font-size: 30rpx;
      color: #666;
      line-height: 1.6;
      margin-bottom: 10rpx;
    }
    </style>