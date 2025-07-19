import {
  Controller,
  Get,
  Post,
  Body,
  ParseIntPipe,
  Param,
  BadRequestException,
  Headers,
  UnauthorizedException,
  Query,
  Put,
  Logger,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags, ApiResponse, ApiOperation, ApiHeader, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WxLoginDto } from './dto/wx-login.dto';
import { ReferralDto } from './dto/referral.dto';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';
import { SendEmailCodeDto, EmailRegisterDto, EmailLoginDto } from './dto/email-register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from 'src/mail/mail.service';
import { EmailVerificationService } from './services/email-verification.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';

@ApiTags('Users')
@Controller('api/user')
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /**
   * GET /api/users/:id/orders
   * Retrieves the orders for a user with the specified ID.
   *
   * @param id - The ID of the user.
   * @returns A Promise that resolves to the orders of the user.
   * @throws BadRequestException if there is an error retrieving the orders.
   */
  @Get(':id/orders')
  @ApiResponse({
    status: 200,
    description: 'The orders for the user with the provided ID.',
  })
  @ApiResponse({
    status: 400,
    description:
      'An error occurred while retrieving the orders. Can be due to the user does not exist.',
  })
  async getOrders(@Param('id', ParseIntPipe) id: number) {
    const orders = await this.userService.getOrders(id);

    if (Object.keys(orders).includes('error')) {
      throw new BadRequestException((orders as any).error.message);
    }

    return orders;
  }

  /**
   * POST /api/users/wxLogin
   * Handles WeChat mini program login
   * 
   * @param wxLoginDto - The WeChat login data containing the code
   * @returns User information and token
   */
  @Public()
  @Post('wxLogin')
  @ApiOperation({ summary: 'Login with WeChat mini program' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in with WeChat',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request, invalid code or WeChat API error',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error, missing WeChat configuration',
  })
  async wxLogin(@Body() wxLoginDto: WxLoginDto) {
    return this.userService.wxLogin(wxLoginDto);
  }

  /**
   * POST /api/users/logout
   * Logs out a user by invalidating their JWT token
   * 
   * @param user - The current user from the JWT token
   * @param authorization - The authorization header containing the JWT token
   * @returns Success message if logout was successful
   */
  @Get('logout')
  @ApiOperation({ summary: 'Logout user and invalidate token' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized, invalid or missing token',
  })
  async logout(
    @CurrentUser() user: any,
    @Headers('authorization') authorization: string,
  ) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token format');
    }

    const token = authorization.split(' ')[1];
    const success = await this.authService.blacklistToken(token, user.userId);

    if (!success) {
      throw new BadRequestException('Failed to logout');
    }

    return { message: 'Successfully logged out' };
  }
}

// Additional controller for direct endpoint matching
@ApiTags('WeChat Login')
@Controller('user')
@ApiBearerAuth()
export class WxUserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /**
   * POST /user/wxLogin
   * Handles WeChat mini program login matching the curl example
   * 
   * @param wxLoginDto - The WeChat login data containing the code
   * @returns User information and token
   */
  @Public()
  @Post('wxLogin')
  @ApiOperation({ summary: 'Login with WeChat mini program (direct path)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in with WeChat',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request, invalid code or WeChat API error',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error, missing WeChat configuration',
  })
  async wxLogin(@Body() wxLoginDto: WxLoginDto) {
    return this.userService.wxLogin(wxLoginDto);
  }

  /**
   * GET /user/info
   * Retrieves user information based on the authorization token
   * 
   * @returns User profile information
   */
  @Get('info')
  @ApiOperation({ summary: 'Get user profile information' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized, invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserInfo(@CurrentUser() user: any) {
    return this.userService.getUserInfo(user.userId);
  }

  /**
   * POST /user/logout
   * Logs out a user by invalidating their JWT token
   * 
   * @param user - The current user from the JWT token
   * @param authorization - The authorization header containing the JWT token
   * @returns Success message if logout was successful
   */
  @Post('logout')
  @ApiOperation({ summary: 'Logout user and invalidate token (direct path)' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized, invalid or missing token',
  })
  async logout(
    @CurrentUser() user: any,
    @Headers('authorization') authorization: string,
  ) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token format');
    }

    const token = authorization.split(' ')[1];
    const success = await this.authService.blacklistToken(token, user.userId);

    if (!success) {
      throw new BadRequestException('Failed to logout');
    }

    return { message: 'Successfully logged out' };
  }

  /**
   * POST /user/referral
   * 关联引荐用户
   * 
   * @param user - 当前用户
   * @param referralDto - 引荐码数据
   * @returns 关联结果
   */
  @Post('referral')
  @ApiOperation({ summary: '关联引荐用户' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '引荐人关联成功',
  })
  @ApiResponse({
    status: 401,
    description: '未授权，无效或缺失令牌',
  })
  @ApiResponse({
    status: 400,
    description: '错误的请求，关联失败',
  })
  async referralUser(
    @CurrentUser() user: any,
    @Body() referralDto: ReferralDto,
  ) {
    return this.userService.referralUser(user.userId, referralDto);
  }

  /**
   * GET /user/referral/stats
   * 获取引荐用户统计信息
   * 
   * @param user - 当前用户
   * @param onlySelf - 是否只返回当前用户的引荐码统计
   * @returns 引荐用户统计信息
   */
  @Get('referral/stats')
  @ApiOperation({ summary: '获取引荐用户统计信息' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
  })
  @ApiQuery({
    name: 'onlySelf',
    required: false,
    type: Boolean,
    description: '是否只返回当前用户的引荐码统计',
  })
  @ApiResponse({
    status: 200,
    description: '引荐用户统计信息',
  })
  @ApiResponse({
    status: 401,
    description: '未授权，无效或缺失令牌',
  })
  async getReferralStats(
    @CurrentUser() user: any,
    @Query('onlySelf') onlySelf?: string,
  ) {
    const onlySelfBool = onlySelf === 'true';
    return this.userService.getReferralStats(onlySelfBool ? user.userId : undefined);
  }
}

// 管理员控制器 - 引荐码管理
@ApiTags('引荐码管理')
@Controller('admin/referral')
@ApiBearerAuth()
export class AdminReferralController {
  private readonly logger = new Logger(AdminReferralController.name);

  constructor(
    private readonly userService: UserService,
  ) {}

  /**
   * POST /admin/referral/code
   * 创建新的引荐码
   * 
   * @param createReferralCodeDto - 引荐码数据
   * @returns 创建结果
   */
  @Post('code')
  @ApiOperation({ summary: '创建新的引荐码' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '引荐码创建成功',
  })
  @ApiResponse({
    status: 401,
    description: '未授权，无效或缺失令牌',
  })
  async createReferralCode(@Body() createReferralCodeDto: CreateReferralCodeDto) {
    this.logger.debug(`收到创建引荐码请求: ${JSON.stringify(createReferralCodeDto)}`);
    return this.userService.createReferralCode(createReferralCodeDto);
  }

  /**
   * GET /admin/referral/codes
   * 获取所有引荐码
   * 
   * @param activeOnly - 是否只返回激活的引荐码
   * @returns 引荐码列表
   */
  @Get('codes')
  @ApiOperation({ summary: '获取所有引荐码' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: '是否只返回激活的引荐码',
  })
  @ApiResponse({
    status: 200,
    description: '引荐码列表',
  })
  @ApiResponse({
    status: 401,
    description: '未授权，无效或缺失令牌',
  })
  async getAllReferralCodes(@Query('activeOnly') activeOnly?: string) {
    const activeOnlyBool = activeOnly === 'true';
    return this.userService.getAllReferralCodes(activeOnlyBool);
  }

  /**
   * PUT /admin/referral/code/:id/status
   * 更新引荐码状态
   * 
   * @param id - 引荐码ID
   * @param isActive - 是否激活
   * @returns 更新结果
   */
  @Put('code/:id/status')
  @ApiOperation({ summary: '更新引荐码状态' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '引荐码状态更新成功',
  })
  @ApiResponse({
    status: 401,
    description: '未授权，无效或缺失令牌',
  })
  @ApiResponse({
    status: 404,
    description: '引荐码不存在',
  })
  async updateReferralCodeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.userService.updateReferralCodeStatus(id, isActive);
  }
}

@ApiTags('邮箱注册')
@Controller('email')
export class EmailAuthController {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  /**
   * POST /api/email/send-code
   * 发送邮箱验证码
   * 
   * @param sendEmailCodeDto - 邮箱地址
   * @returns 发送结果
   */
  @Public()
  @Post('send-code')
  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponse({
    status: 200,
    description: '验证码发送成功',
  })
  @ApiResponse({
    status: 400,
    description: '发送失败',
  })
  async sendVerificationCode(@Body() sendEmailCodeDto: SendEmailCodeDto) {
    const { email } = sendEmailCodeDto;

    // 检查是否最近已发送
    const isSentRecently = await this.emailVerificationService.isCodeSentRecently(email);
    if (isSentRecently) {
      const remainingTime = await this.emailVerificationService.getRemainingTime(email);
      throw new BadRequestException(`请${remainingTime}秒后再试`);
    }

    // 检查邮箱是否已注册
    const existingUser = await this.userService['databaseService'].user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new BadRequestException('该邮箱已被注册');
    }

    // 生成并发送验证码
    await this.emailVerificationService.sendVerificationCode(email);

    return {
      success: true,
      message: '验证码已发送到您的邮箱',
    };
  }

  /**
   * POST /api/email/register
   * 邮箱注册
   * 
   * @param emailRegisterDto - 注册信息
   * @returns 注册结果
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: '邮箱注册' })
  @ApiResponse({
    status: 200,
    description: '注册成功',
  })
  @ApiResponse({
    status: 400,
    description: '注册失败',
  })
  async registerByEmail(@Body() emailRegisterDto: EmailRegisterDto) {
    const { email, code, password, name, referralCode } = emailRegisterDto;

    // 验证验证码
    const result = await this.emailVerificationService.verifyCode(email, code);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    // 注册用户
    return this.userService.registerByEmail(email, password, name || email.split('@')[0], referralCode);
  }

  /**
   * POST /api/user/login
   * 用户名/邮箱登录
   * 
   * @param loginDto - 登录信息（用户名或邮箱 + 密码）
   * @returns 登录结果
   */
  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户名/邮箱登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
  })
  @ApiResponse({
    status: 401,
    description: '登录失败',
  })
  async login(@Body() loginDto: LoginDto) {
    const { usernameOrEmail, password } = loginDto;
    return this.userService.loginByUsernameOrEmail(usernameOrEmail, password);
  }

  /**
   * POST /api/email/login
   * 邮箱登录（兼容旧接口）
   * 
   * @param emailLoginDto - 登录信息
   * @returns 登录结果
   */
  @Public()
  @Post('login/email')
  @ApiOperation({ summary: '邮箱登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
  })
  @ApiResponse({
    status: 401,
    description: '登录失败',
  })
  async loginByEmail(@Body() emailLoginDto: EmailLoginDto) {
    const { email, password } = emailLoginDto;
    return this.userService.loginByEmail(email, password);
  }
}