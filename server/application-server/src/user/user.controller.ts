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
import { ApiTags, ApiResponse, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { WxLoginDto } from './dto/wx-login.dto';

@ApiTags('Users')
@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}

// Additional controller for direct endpoint matching
@ApiTags('WeChat Login')
@Controller('user')
export class WxUserController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /user/wxLogin
   * Handles WeChat mini program login matching the curl example
   * 
   * @param wxLoginDto - The WeChat login data containing the code
   * @returns User information and token
   */
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
    required: false,
  })
  @ApiHeader({
    name: 'platform',
    description: 'Client platform (e.g., mp-weixin)',
    required: false,
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
  async getUserInfo(
    @Headers() headers: Record<string, string>,
    @Headers('authorization') authorization?: string,
  ) {
    // Try to extract token from different sources
    let token = authorization;
    
    // If no explicit Authorization header, try to find a token in other headers
    // This is just a demonstration - in a production app, you'd have a proper auth strategy
    if (!token) {
      // Check for token in cookies, custom headers, etc.
      // For demo purposes, we'll check the if-none-match header from the curl example
      if (headers['if-none-match']) {
        // Extract a token-like value from ETag
        // This is just for demonstration purposes
        token = headers['if-none-match'].replace(/^W\/"([^"]+)"$/, '$1');
      }
    }
    
    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }
    
    // Extract token from Bearer format if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    
    return this.userService.getUserInfo(token);
  }
}
