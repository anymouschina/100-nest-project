import { Injectable, HttpException, HttpStatus, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { OrderService } from 'src/order/order.service';
import { WxLoginDto } from './dto/wx-login.dto';
import { AppConfigService } from '../config/config.service';
import { AuthService } from '../auth/auth.service';
import { ReferralDto } from './dto/referral.dto';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';
import { EmailRegisterDto } from './dto/email-register.dto';
import { EmailVerificationService } from './services/email-verification.service';
import axios from 'axios';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orderService: OrderService,
    private readonly configService: AppConfigService,
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
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
   * 关联引荐用户
   * 
   * @param userId - 当前用户ID
   * @param referralDto - 引荐码数据
   * @returns 关联结果
   */
  async referralUser(userId: number, referralDto: ReferralDto) {
    try {
      // 验证当前用户是否存在
      const currentUser = await this.databaseService.user.findUnique({
        where: { userId }
      });
      
      if (!currentUser) {
        throw new NotFoundException('用户不存在');
      }
      
      // 获取当前用户的openId
      if (!currentUser.openId) {
        throw new BadRequestException('当前用户没有关联微信账号');
      }
      
      // 检查用户是否已经有引荐记录
      const existingReferral = await this.databaseService.userReferral.findUnique({
        where: { userId }
      });
      
      if (existingReferral) {
        return {
          success: false,
          message: '您已经关联过引荐人，不能重复关联',
          data: {
            refCode: existingReferral.refCode,
            createdAt: existingReferral.createdAt
          }
        };
      }
      
      // 查找引荐码
      let referralCodeRecord = null;
      try {
        // 先查找系统中是否有这个引荐码
        referralCodeRecord = await this.databaseService.referralCode.findUnique({
          where: {
            code: referralDto.refCode,
            isActive: true
          }
        });
      } catch (error) {
        // 忽略查询错误，继续执行
        console.error('查询引荐码失败:', error);
      }
      
      // 查找引荐码对应的用户
      const referrerUser = await this.databaseService.user.findFirst({
        where: {
          openId: referralDto.refCode
        }
      });
      
      // 不能自己引荐自己
      if (referrerUser && referrerUser.openId === currentUser.openId) {
        throw new BadRequestException('不能使用自己的引荐码');
      }
      
      // 创建引荐记录
      const referralData: any = {
        userId: currentUser.userId,
        refCode: referralDto.refCode,
        referrerOpenId: referrerUser ? referrerUser.openId : null,
        source: referralDto.source || null,
        metadata: referralDto.metadata || null,
      };
      
      // 如果找到了对应的引荐码记录，添加关联
      if (referralCodeRecord) {
        referralData.referralCodeId = referralCodeRecord.id;
      }
      
      const referral = await this.databaseService.userReferral.create({
        data: referralData
      });
      
      // 更新用户的ref字段
      await this.databaseService.user.update({
        where: { userId },
        data: {
          ref: referralDto.refCode
        }
      });
      
      return {
        success: true,
        message: '引荐人关联成功',
        data: {
          referralId: referral.id,
          refCode: referral.refCode,
          referralCodeId: referral.referralCodeId,
          source: referral.source,
          metadata: referral.metadata,
          createdAt: referral.createdAt
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '关联引荐人失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取引荐用户统计信息
   * 统计每个refCode关联的用户数量和下单用户数量
   * 
   * @param currentUserId - 当前用户ID（可选，如果提供则只返回该用户的引荐码统计）
   * @returns 引荐用户统计信息
   */
  async getReferralStats(currentUserId?: number) {
    try {
      // 查询条件，如果有currentUserId则只查询该用户的引荐码
      let whereCondition = {};
      let referralUser = null;
      
      if (currentUserId) {
        referralUser = await this.databaseService.user.findUnique({
          where: { userId: currentUserId }
        });
        
        if (!referralUser || !referralUser.openId) {
          throw new NotFoundException('未找到用户或用户未关联微信账号');
        }
        
        whereCondition = {
          referrerOpenId: referralUser.openId
        };
      }
      
      // 查询所有引荐码记录
      const referralCodes = await this.databaseService.referralCode.findMany({
        where: {
          isActive: true
        },
        include: {
          referrals: true
        }
      });
      
      // 查询所有满足条件的引荐记录
      const allReferrals = await this.databaseService.userReferral.findMany({
        where: whereCondition,
        include: {
          referralCode: true
        }
      });
      
      // 获取所有涉及的refCode
      const allRefCodes = [...new Set(allReferrals.map(r => r.refCode))];
      
      // 合并系统引荐码和实际使用的引荐码
      const mergedRefCodes = new Set([
        ...allRefCodes,
        ...referralCodes.map(rc => rc.code)
      ]);
      
      // 获取结果数组
      const results = await Promise.all(
        [...mergedRefCodes].map(async (refCode) => {
          // 查找该引荐码对应的系统记录
          const systemCode = referralCodes.find(rc => rc.code === refCode);
          
          // 获取该引荐码关联的所有用户ID
          const referredUsers = await this.databaseService.userReferral.findMany({
            where: {
              OR: [
                { refCode: refCode },
                systemCode ? { referralCodeId: systemCode.id } : {}
              ]
            },
            select: {
              userId: true
            }
          });
          
          const userIds = referredUsers.map(user => user.userId);
          const totalUsers = userIds.length;
          
          // 统计这些用户中下过单的用户数量
          const orderedUsers = await this.databaseService.order.groupBy({
            by: ['userId'],
            where: {
              userId: {
                in: userIds.length > 0 ? userIds : [-1] // 避免空数组查询
              }
            },
            _count: {
              orderId: true
            }
          });
          
          const orderedCount = orderedUsers.length;
          
          // 返回统计结果
          return {
            refCode,
            description: systemCode?.description || null,
            isSystemCode: !!systemCode,
            totalUsers,
            orderedUsers: orderedCount,
            orderRate: totalUsers > 0 ? 
              Math.round((orderedCount / totalUsers) * 100) / 100 : 0
          };
        })
      );
      
      // 如果没有找到任何引荐记录，但用户ID存在，则返回空数据
      if (results.length === 0 && currentUserId) {
        // 检查用户是否有自己的引荐码(openId)
        const user = await this.databaseService.user.findUnique({
          where: { userId: currentUserId },
          select: { openId: true }
        });
        
        if (user?.openId) {
          // 返回用户的openId作为refCode，但没有关联用户
          return {
            success: true,
            data: {
              stats: [{
                refCode: user.openId,
                description: null,
                isSystemCode: false,
                totalUsers: 0,
                orderedUsers: 0,
                orderRate: 0
              }],
              total: 0,
              totalOrdered: 0
            }
          };
        }
      }
      
      return {
        success: true,
        data: {
          stats: results,
          total: results.reduce((sum, item) => sum + item.totalUsers, 0),
          totalOrdered: results.reduce((sum, item) => sum + item.orderedUsers, 0)
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '获取引荐统计失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 创建引荐码（管理员操作）
   * 
   * @param createReferralCodeDto - 创建引荐码数据
   * @returns 创建结果
   */
  async createReferralCode(createReferralCodeDto: CreateReferralCodeDto) {
    try {
      // 验证DTO字段
      if (!createReferralCodeDto.refCode) {
        throw new HttpException(
          '引荐码不能为空',
          HttpStatus.BAD_REQUEST
        );
      }

      // 检查引荐码是否已存在
      const existingCode = await this.databaseService.referralCode.findUnique({
        where: {
          code: createReferralCodeDto.refCode
        }
      });
      
      if (existingCode) {
        return {
          success: false,
          message: '引荐码已存在',
          data: existingCode
        };
      }
      
      // 创建新的引荐码
      const newReferralCode = await this.databaseService.referralCode.create({
        data: {
          code: createReferralCodeDto.refCode,
          description: createReferralCodeDto.description,
        }
      });
      
      return {
        success: true,
        message: '引荐码创建成功',
        data: newReferralCode
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '创建引荐码失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * 获取所有引荐码（管理员操作）
   * 
   * @param activeOnly - 是否只返回激活的引荐码
   * @returns 引荐码列表，包含统计信息
   */
  async getAllReferralCodes(activeOnly = false) {
    try {
      const whereCondition = activeOnly ? { isActive: true } : {};
      
      // 获取所有引荐码
      const referralCodes = await this.databaseService.referralCode.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          // 预加载关联的引荐记录，用于后续统计
          referrals: {
            include: {
              user: true
            }
          }
        }
      });
      
      // 获取所有订单用户信息
      const orderUsers = await this.databaseService.order.groupBy({
        by: ['userId'],
        _count: {
          orderId: true
        }
      });
      
      // 将订单用户ID集合为Set，便于快速查询
      const orderedUserIds = new Set(orderUsers.map(item => item.userId));
      
      // 处理并组装统计数据
      const referralCodesWithStats = await Promise.all(
        referralCodes.map(async (code) => {
          // 绑定该引荐码的用户ID列表
          const bindUserIds = code.referrals.map(ref => ref.userId);
          // 总用户数
          const totalUsers = bindUserIds.length;
          
          // 下单用户数（检查引荐用户ID是否在订单用户集合中）
          const orderedUsers = bindUserIds.filter(userId => orderedUserIds.has(userId)).length;
          
          // 下单率
          const orderRate = totalUsers > 0 ? 
            Math.round((orderedUsers / totalUsers) * 100) / 100 : 0;
          
          return {
            id: code.id,
            code: code.code,
            description: code.description,
            isActive: code.isActive,
            createdAt: code.createdAt,
            updatedAt: code.updatedAt,
            stats: {
              totalUsers,
              orderedUsers,
              orderRate
            }
          };
        })
      );
      
      return {
        success: true,
        data: referralCodesWithStats?.map((item:any)=>{
          item.refCode = item.code;
          item as any
          return item
        }) || []
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '获取引荐码列表失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * 更新引荐码状态（管理员操作）
   * 
   * @param id - 引荐码ID
   * @param isActive - 是否激活
   * @returns 更新结果
   */
  async updateReferralCodeStatus(id: number, isActive: boolean) {
    try {
      const referralCode = await this.databaseService.referralCode.findUnique({
        where: { id }
      });
      
      if (!referralCode) {
        throw new NotFoundException('引荐码不存在');
      }
      
      const updatedCode = await this.databaseService.referralCode.update({
        where: { id },
        data: { isActive }
      });
      
      return {
        success: true,
        message: isActive ? '引荐码已激活' : '引荐码已停用',
        data: updatedCode
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '更新引荐码状态失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async registerByEmail(email: string, password: string, name: string, referralCode?: string) {
    try {
      // 检查邮箱是否已注册
      const existingUser = await this.databaseService.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new BadRequestException('该邮箱已被注册');
      }

      // 创建新用户
      const userData: any = {
        email,
        password: await this.authService.hashPassword(password),
        name,
        createdAt: new Date(),
      };

      // 如果有推荐码，添加到用户记录
      if (referralCode) {
        userData.ref = referralCode;
      }

      const user = await this.databaseService.user.create({
        data: userData,
      });

      // 生成JWT token
      const token = await this.authService.generateToken(user.userId);

      return {
        success: true,
        message: '注册成功',
        data: {
          user: {
            userId: user.userId,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          },
          token,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '注册失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async loginByEmail(email: string, password: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      if (!user.password) {
        throw new BadRequestException('该用户未设置密码，请使用微信登录');
      }

      const isPasswordValid = await this.authService.validatePassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('密码错误');
      }

      const token = await this.authService.generateToken(user.userId);

      return {
        success: true,
        message: '登录成功',
        data: {
          user: {
            userId: user.userId,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          },
          token,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '登录失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async loginByUsernameOrEmail(usernameOrEmail: string, password: string) {
    try {
      // 判断是邮箱还是用户名
      const isEmail = usernameOrEmail.includes('@');
      
      // 查询用户
      const user = await this.databaseService.user.findFirst({
        where: isEmail 
          ? { email: usernameOrEmail }
          : { name: usernameOrEmail }
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      if (!user.password) {
        throw new BadRequestException('该用户未设置密码，请使用微信登录');
      }

      const isPasswordValid = await this.authService.validatePassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('密码错误');
      }

      const token = await this.authService.generateToken(user.userId);

      return { 
            userId: user.userId,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            token
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '登录失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserInfo(userId: number) {
    const user = await this.databaseService.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        name: true,
        address: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }
}
