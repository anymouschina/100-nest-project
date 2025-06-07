import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from '../user/user.service';
import { WechatService } from '../wechat/wechat.service';
import { ReferralMicroservicePatterns } from '../common/constants/microservice.constants';
import { CreateReferralCodeDto } from '../user/dto/create-referral-code.dto';

@Controller()
export class ReferralMicroserviceController {
    private readonly logger = new Logger(ReferralMicroserviceController.name);
  constructor(
    private readonly userService: UserService,
    private readonly wechatService: WechatService
  ) {}

  @MessagePattern(ReferralMicroservicePatterns.CREATE_CODE)
  async createReferralCode(@Payload() data: CreateReferralCodeDto) {
    this.logger.debug(`收到创建引荐码请求: ${JSON.stringify(data)}`);
    if (!data || !data.refCode) {
      this.logger.error('创建引荐码失败: 无效的请求数据');
      return {
        success: false,
        message: '无效的请求数据',
        data: null,
      };
    }
    return this.userService.createReferralCode(data);
  }

  @MessagePattern(ReferralMicroservicePatterns.GET_ALL_CODES)
  async getAllReferralCodes(@Payload() data: { activeOnly?: boolean }) {
    return this.userService.getAllReferralCodes(data.activeOnly);
  }

  @MessagePattern(ReferralMicroservicePatterns.UPDATE_CODE_STATUS)
  async updateReferralCodeStatus(
    @Payload() data: { id: number; isActive: boolean },
  ) {
    const { id, isActive } = data;
    return this.userService.updateReferralCodeStatus(id, isActive);
  }

  @MessagePattern(ReferralMicroservicePatterns.GET_REFERRAL_STATS)
  async getReferralStats(@Payload() data: { userId?: number }) {
    return this.userService.getReferralStats(data.userId);
  }

  @MessagePattern(ReferralMicroservicePatterns.GENERATE_QRCODE)
  async generateQrCode(@Payload() data: { 
    page: string;
    scene: string;
    width?: number;
    envVersion?: 'release' | 'trial' | 'develop';
    saveToFile?: boolean;
  }) {
    try {
      this.logger.debug(`收到生成引荐码二维码请求: ${JSON.stringify(data)}`);
      
      if (!data || !data.page || !data.scene) {
        this.logger.error('生成二维码失败: 无效的请求数据');
        return {
          success: false,
          message: '无效的请求数据，page和scene参数必须提供',
          data: null,
        };
      }
      
      const { page, scene, width, envVersion, saveToFile } = data;
      
      // 生成二维码
      const qrCodeBuffer = await this.wechatService.generateMiniProgramQrCode(
        page,
        scene,
        width,
        envVersion
      );
      
      // // 如果需要保存到文件
      // if (saveToFile) {
      //   const qrCodeUrl = await this.wechatService.saveQrCodeAndGetUrl(qrCodeBuffer, scene);
      //   return {
      //     success: true,
      //     message: '二维码生成并保存成功',
      //     data: {
      //       url: qrCodeUrl,
      //       // 返回base64格式的图片数据，便于前端直接显示
      //       base64: `data:image/jpeg;base64,${qrCodeBuffer.toString('base64')}`
      //     }
      //   };
      // }
      
      // 默认只返回base64格式的图片数据
      return {
        success: true,
        message: '二维码生成成功',
        data: {
          base64: `data:image/jpeg;base64,${qrCodeBuffer.toString('base64')}`
        }
      };
    } catch (error) {
      this.logger.error(`生成二维码失败: ${error.message}`);
      return {
        success: false,
        message: `生成二维码失败: ${error.message}`,
        data: null
      };
    }
  }
} 