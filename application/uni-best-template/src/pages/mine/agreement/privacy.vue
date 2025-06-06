<route lang="json5">
    {
      style: {
        navigationBarTitleText: '隐私政策',
        navigationStyle: 'custom',
      },
    }
    </route>
    
    <template>
      <view class="privacy-container">
        <view class="privacy-content">
          <view class="title">隐私政策</view>
          <view class="update-time">更新日期：{{ updateDate }}</view>
          
          <view class="section">
            <view class="section-title">引言</view>
            <view class="section-content">
              <view class="paragraph">
                欢迎使用我们的应用。我们重视您的隐私，并致力于保护您的个人信息。本隐私政策旨在向您说明我们如何收集、使用、存储和共享您的个人信息，以及您享有的相关权利。
              </view>
              <view class="paragraph">
                请您在使用我们的服务前，仔细阅读并了解本隐私政策的全部内容。如您对本隐私政策有任何疑问，可通过本政策末尾提供的联系方式与我们联系。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">我们收集的信息</view>
            <view class="section-content">
              <view class="paragraph">
                <view class="sub-title">1. 您主动提供的信息</view>
                <view class="text">在您注册账户、预约服务、提交反馈时，我们会收集您提供的姓名、联系电话、地址等信息。</view>
              </view>
              <view class="paragraph">
                <view class="sub-title">2. 设备信息</view>
                <view class="text">我们可能会收集您使用的设备型号、操作系统版本、设备标识符等信息，用于优化服务体验和排查问题。</view>
              </view>
              <view class="paragraph">
                <view class="sub-title">3. 位置信息</view>
                <view class="text">在您授权的情况下，我们会收集您的位置信息，以便为您提供基于位置的服务，如附近商户查询、服务地址导航等。</view>
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">信息的使用</view>
            <view class="section-content">
              <view class="paragraph">
                我们使用收集的信息主要用于以下目的：
              </view>
              <view class="list-item">• 提供、维护和改进我们的服务</view>
              <view class="list-item">• 处理您的服务预约和请求</view>
              <view class="list-item">• 向您发送服务通知和更新</view>
              <view class="list-item">• 防止欺诈和提高安全性</view>
              <view class="list-item">• 分析使用情况以优化用户体验</view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">信息的共享</view>
            <view class="section-content">
              <view class="paragraph">
                除以下情况外，我们不会与第三方共享您的个人信息：
              </view>
              <view class="list-item">• 在获得您的明确同意后</view>
              <view class="list-item">• 与我们的服务提供商合作伙伴共享，以便他们为我们提供服务</view>
              <view class="list-item">• 遵守法律法规的要求</view>
              <view class="list-item">• 保护我们及用户的合法权益</view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">您的权利</view>
            <view class="section-content">
              <view class="paragraph">
                您对自己的个人信息享有以下权利：
              </view>
              <view class="list-item">• 访问、更正或删除您的个人信息</view>
              <view class="list-item">• 限制或反对我们处理您的个人信息</view>
              <view class="list-item">• 数据可携带权</view>
              <view class="list-item">• 撤回同意的权利</view>
              <view class="paragraph">
                如您需要行使上述权利，请通过本政策末尾提供的联系方式与我们联系。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">隐私政策的更新</view>
            <view class="section-content">
              <view class="paragraph">
                我们可能会不时更新本隐私政策。当政策发生重大变更时，我们会通过应用内通知或其他适当方式通知您。我们鼓励您定期查阅本隐私政策，以了解我们如何保护您的信息。
              </view>
            </view>
          </view>
          
          <view class="section">
            <view class="section-title">联系我们</view>
            <view class="section-content">
              <view class="paragraph">
                如您对本隐私政策有任何疑问、意见或建议，可通过以下方式联系我们：
              </view>
              <view class="contact-info">电子邮件：privacy@unibest.tech</view>
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
    .privacy-container {
      padding: 30rpx;
      background-color: #f5f7fa;
      min-height: 100vh;
    }
    
    .privacy-content {
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
    
    .sub-title {
      font-weight: 600;
      margin-bottom: 10rpx;
      color: #444;
    }
    
    .text {
      margin-bottom: 10rpx;
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