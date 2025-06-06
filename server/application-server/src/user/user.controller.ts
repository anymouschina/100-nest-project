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
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags, ApiResponse, ApiOperation, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { WxLoginDto } from './dto/wx-login.dto';
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
}
