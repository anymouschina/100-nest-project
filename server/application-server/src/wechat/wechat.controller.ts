import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WechatService } from './wechat.service';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { GenerateQrCodeDto } from './dto/generate-qrcode.dto';
import { AppLoggerService } from '../common/logger/app-logger.service';

@ApiTags('微信小程序')
@Controller('wechat')
export class WechatController {
  private readonly logger: AppLoggerService;
  
  constructor(private readonly wechatService: WechatService) {
    this.logger = new AppLoggerService(WechatController.name);
  }
  
  /**
   * 生成小程序跳转二维码并直接返回图片
   */
  @Get('qrcode')
  @Public()
  @ApiOperation({ summary: '生成小程序跳转二维码(图片流)' })
  @ApiQuery({ name: 'page', description: '小程序页面路径，例如 pages/index/index', required: true })
  @ApiQuery({ name: 'scene', description: '场景参数，用于携带ref等信息，最大32个字符', required: true })
  @ApiQuery({ name: 'width', description: '二维码宽度，单位像素', required: false, type: Number })
  @ApiQuery({ 
    name: 'env_version', 
    description: '小程序环境版本，默认为正式版(release)，可选值：release(正式版)、trial(体验版)、develop(开发版)', 
    required: false, 
    enum: ['release', 'trial', 'develop'] 
  })
  @ApiResponse({ status: 200, description: '返回二维码图片' })
  @ApiResponse({ status: 400, description: '参数错误或生成二维码失败' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  async getQrCode(
    @Query('page') page: string,
    @Query('scene') scene: string,
    @Query('width') width: number = 430,
    @Query('env_version') envVersion: 'release' | 'trial' | 'develop' = 'release',
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Generating QR code with params: page=${page}, scene=${scene}, width=${width}, envVersion=${envVersion}`);
      
      if (!page) {
        this.logger.warn('Page parameter is missing');
        throw new BadRequestException('Page parameter is required');
      }
      
      if (!scene) {
        this.logger.warn('Scene parameter is missing');
        throw new BadRequestException('Scene parameter is required');
      }
      
      const qrCodeBuffer = await this.wechatService.generateMiniProgramQrCode(
        page,
        scene,
        width,
        envVersion,
      );
      
      this.logger.debug(`QR code generated, size: ${qrCodeBuffer.length} bytes`);
      
      // 设置响应头，返回图片
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': qrCodeBuffer.length,
      });
      
      this.logger.debug('Sending QR code as image response');
      res.end(qrCodeBuffer);
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 生成小程序跳转二维码并返回URL
   */
  @Post('qrcode/url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '生成小程序跳转二维码并返回URL' })
  @ApiBody({ type: GenerateQrCodeDto })
  @ApiResponse({ 
    status: 200, 
    description: '返回二维码URL',
    schema: {
      properties: {
        qrCodeUrl: { type: 'string', example: 'http://example.com/uploads/qrcodes/qrcode_123456_1623456789.jpg' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '参数错误或生成二维码失败' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  async getQrCodeUrl(@Body() dto: GenerateQrCodeDto): Promise<{ qrCodeUrl: string }> {
    try {
      this.logger.log(`Generating QR code URL with data: ${JSON.stringify(dto)}`);
      
      // 生成二维码
      const qrCodeBuffer = await this.wechatService.generateMiniProgramQrCode(
        dto.page,
        dto.scene,
        dto.width,
        dto.envVersion,
      );
      
      this.logger.debug(`QR code generated, size: ${qrCodeBuffer.length} bytes`);
      
      // 保存二维码并获取URL
      const qrCodeUrl = await this.wechatService.saveQrCodeAndGetUrl(
        qrCodeBuffer,
        dto.scene,
      );
      
      this.logger.log(`QR code URL generated: ${qrCodeUrl}`);
      
      return { qrCodeUrl };
    } catch (error) {
      this.logger.error(`Failed to generate QR code URL: ${error.message}`);
      throw error;
    }
  }
} 