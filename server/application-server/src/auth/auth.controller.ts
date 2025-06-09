import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  UseGuards,
  Request,
  Get,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  LoginResponse,
} from './dto/auth.dto';

@ApiTags('认证')
@Controller('/api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '登录成功',
    type: LoginResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '邮箱或密码错误',
  })
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 查找用户
    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new HttpException('邮箱或密码错误', HttpStatus.UNAUTHORIZED);
    }

    // 验证密码
    if (!user.password) {
      throw new HttpException(
        '该用户未设置密码，请使用其他登录方式',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException('邮箱或密码错误', HttpStatus.UNAUTHORIZED);
    }

    // 生成JWT令牌
    const accessToken = await this.authService.generateToken(user.userId, {
      name: user.name,
      openId: user.openId,
    });

    // 生成刷新令牌（这里简化处理，实际项目中应该有专门的刷新令牌机制）
    const refreshToken = await this.authService.generateToken(user.userId, {
      name: user.name,
      openId: user.openId,
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600, // 1小时
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          address: user.address,
        },
      },
      message: '登录成功',
    };
  }
  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '注册成功',
    type: LoginResponse,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '邮箱已存在',
  })
  async register(@Body() registerDto: RegisterDto) {
    const { name, email, password, address } = registerDto;

    // 检查邮箱是否已存在
    const existingUser = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new HttpException('邮箱已存在', HttpStatus.CONFLICT);
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const user = await this.databaseService.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
      },
    });

    // 生成JWT令牌
    const accessToken = await this.authService.generateToken(user.userId, {
      name: user.name,
    });

    const refreshToken = await this.authService.generateToken(user.userId, {
      name: user.name,
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          address: user.address,
        },
      },
      message: '注册成功',
    };
  }

  @Post('logout')
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: HttpStatus.OK, description: '登出成功' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logout(@Request() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = req.user.userId;

    if (token) {
      await this.authService.blacklistToken(token, userId);
    }

    return {
      success: true,
      message: '登出成功',
    };
  }

  @Get('profile')
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(@Request() req: any) {
    const userId = req.user.userId;

    const user = await this.databaseService.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        name: true,
        email: true,
        address: true,
        createdAt: true,
        openId: true,
        avatarUrl: true,
        gender: true,
        country: true,
        province: true,
        city: true,
        language: true,
      },
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: user,
      message: '获取用户信息成功',
    };
  }

  @Put('password')
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: HttpStatus.OK, description: '密码修改成功' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = changePasswordDto;

    // 获取用户信息
    const user = await this.databaseService.user.findUnique({
      where: { userId },
    });

    if (!user || !user.password) {
      throw new HttpException('用户不存在或未设置密码', HttpStatus.NOT_FOUND);
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new HttpException('当前密码错误', HttpStatus.UNAUTHORIZED);
    }

    // 加密新密码
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await this.databaseService.user.update({
      where: { userId },
      data: { password: hashedNewPassword },
    });

    return {
      success: true,
      message: '密码修改成功',
    };
  }

  @Get('verify')
  @ApiOperation({ summary: '验证令牌有效性' })
  @ApiResponse({ status: HttpStatus.OK, description: '令牌有效' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async verifyToken(@Request() req: any) {
    return {
      success: true,
      data: {
        userId: req.user.userId,
        name: req.user.name,
        valid: true,
      },
      message: '令牌有效',
    };
  }
  @Public()
  @Post('guest-login')
  @ApiOperation({ summary: '游客登录（用于测试AI功能）' })
  @ApiResponse({ status: HttpStatus.OK, description: '游客登录成功' })
  async guestLogin() {
    // 创建或获取游客用户
    let guestUser = await this.databaseService.user.findFirst({
      where: { email: 'guest@example.com' },
    });

    if (!guestUser) {
      guestUser = await this.databaseService.user.create({
        data: {
          name: '游客用户',
          email: 'guest@example.com',
          password: null, // 游客用户不设置密码
        },
      });
    }

    // 生成JWT令牌
    const accessToken = await this.authService.generateToken(guestUser.userId, {
      name: guestUser.name,
    });

    return {
      success: true,
      data: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          userId: guestUser.userId,
          name: guestUser.name,
          email: guestUser.email,
          isGuest: true,
        },
      },
      message: '游客登录成功，可以体验AI功能',
    };
  }
}
