import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post('session')
  @ApiOperation({ summary: '创建聊天会话' })
  async createSession(
    @CurrentUser() user: User,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return this.chatService.createSession(user.userId, createSessionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiOperation({ summary: '获取用户所有聊天会话' })
  async getSessions(@CurrentUser() user: User) {
    return this.chatService.getUserSessions(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session/:sessionId')
  @ApiOperation({ summary: '获取特定聊天会话及消息' })
  async getSessionMessages(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
  ) {
    return this.chatService.getSessionWithMessages(user.userId, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('session/:sessionId/message')
  @ApiOperation({ summary: '发送聊天消息' })
  async sendMessage(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.processUserMessage(
      user.userId,
      sessionId,
      sendMessageDto.message,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('analyze')
  @ApiOperation({ summary: '分析用户消息意图' })
  async analyzeMessage(
    @CurrentUser() user: User,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.analyzeUserIntent(
      user.userId, 
      sendMessageDto.message
    );
  }
} 