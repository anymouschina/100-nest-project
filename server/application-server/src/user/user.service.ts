import { Injectable, HttpException, HttpStatus, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { OrderService } from 'src/order/order.service';
import { WxLoginDto } from './dto/wx-login.dto';
import { AppConfigService } from '../config/config.service';
import { AuthService } from '../auth/auth.service';
import axios from 'axios';

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orderService: OrderService,
    private readonly configService: AppConfigService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Retrieves the orders for a given user.
   *
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an array of orders.
   */
  async getOrders(userId: number) {
    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });

    if (!user) return { error: { message: 'User was not found' } };

    const orders = await this.databaseService.order.findMany({
      where: { userId },
    });

    return Promise.all(
      orders.map(async (order) => {
        return await this.orderService.findOne(order.orderId);
      }),
    );
  }

  /**
   * WeChat login or register a user
   * Adapts to work with the existing User schema
   * 
   * @param wxLoginDto - The WeChat login data with code and user profile info
   * @returns The user data and a JWT token
   */
  async wxLogin(wxLoginDto: WxLoginDto) {
    try {
      // WeChat API configuration from ConfigService
      const appId = this.configService.wechatAppId;
      const appSecret = this.configService.wechatAppSecret;
      
      if (!appId || !appSecret || appId === 'default_app_id') {
        throw new HttpException(
          'WeChat configuration is missing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Exchange code for session info (openid, session_key)
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${wxLoginDto.code}&grant_type=authorization_code`;
      const response = await axios.get(url);
      
      if (response.data.errcode) {
        throw new HttpException(
          `WeChat API error: ${response.data.errmsg}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const { openid, session_key } = response.data;
      
      // Since we're having issues with the Prisma types, use a workaround
      // Store the WeChat ID in the email field as a temporary solution
      const wechatEmail = `wx_${openid}@example.com`;
      
      // Find existing user or create a new one
      let user = await this.databaseService.user.findUnique({
        where: { email: wechatEmail },
      });

      // Extract user info from the request if provided
      const { userInfo } = wxLoginDto;
      const nickname = userInfo?.nickName || `WxUser_${openid.substring(0, 8)}`;
      const avatarUrl = userInfo?.avatarUrl || null;

      if (!user) {
        // Create a new user with WeChat info encoded in standard fields
        user = await this.databaseService.user.create({
          data: {
            name: nickname,
            email: wechatEmail,
            password: `wx_${openid}`, // Not secure, just a placeholder
            address: `wx_${openid}`,  // Using address to store WeChat ID
            avatarUrl: avatarUrl, // Store avatar URL if available
            openId: openid,       // Store openId directly
            // Add other WeChat user fields if available
            gender: userInfo?.gender,
            country: userInfo?.country,
            province: userInfo?.province,
            city: userInfo?.city,
            language: userInfo?.language,
          },
        });
      } else if (userInfo) {
        // Update user information if profile data is provided
        user = await this.databaseService.user.update({
          where: { userId: user.userId },
          data: {
            name: nickname,
            avatarUrl: avatarUrl,
            // Update other WeChat user fields if available
            gender: userInfo?.gender,
            country: userInfo?.country,
            province: userInfo?.province,
            city: userInfo?.city,
            language: userInfo?.language,
          },
        });
      }

      // Generate JWT token with user info
      const token = await this.authService.generateToken(user.userId, {
        name: user.name,
        openId: openid,
      });

      // Return user data (excluding sensitive information)
      return {
        user: {
          userId: user.userId,
          name: user.name,
          avatarUrl: user.avatarUrl,
          // Include WeChat ID as metadata
          wechatMetadata: {
            openId: openid,
            // Include additional WeChat info if available
            gender: user.gender,
            country: user.country,
            province: user.province,
            city: user.city,
          }
        },
        token,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to process WeChat login',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user information by user ID
   * 
   * @param userId - User ID
   * @returns User profile information
   */
  async getUserInfo(userId: number) {
    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Extract WeChat openId from email if it's a WeChat user
    let openId = user.openId;
    if (!openId && user.email?.startsWith('wx_') && user.email?.endsWith('@example.com')) {
      openId = user.email.slice(3, -12); // Remove 'wx_' prefix and '@example.com' suffix
    }
    
    return {
      userId: user.userId,
      name: user.name,
      avatarUrl: user.avatarUrl, // Return avatar URL if available
      wechatInfo: openId ? {
        openId,
        gender: user.gender,
        country: user.country,
        province: user.province,
        city: user.city,
      } : null,
      // Add any other non-sensitive user information
      joinedAt: user.createdAt,
    };
  }
}
