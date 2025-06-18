import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({ status: 201, description: 'Chat session created successfully' })
  async createSession(
    @CurrentUser() user: any,
    @Body() body: { agentId?: string; title?: string }
  ) {
    return this.chatService.createChatSession(
      user.userId,
      body.agentId,
      body.title
    );
  }

  @Post('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Send a message to a chat session' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() body: { content: string; role?: string }
  ) {
    return this.chatService.sendMessage(
      sessionId,
      body.content,
      body.role || 'human'
    );
  }

  @Post('sessions/:sessionId/switch-agent')
  @ApiOperation({ summary: 'Switch agent for a chat session' })
  @ApiResponse({ status: 200, description: 'Agent switched successfully' })
  async switchAgent(
    @Param('sessionId') sessionId: string,
    @Body() body: { agentId: string }
  ) {
    return this.chatService.switchAgent(sessionId, body.agentId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get chat session details' })
  @ApiResponse({ status: 200, description: 'Session details retrieved successfully' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.chatService.getSessionDetails(sessionId);
  }

  @Get('sessions/:sessionId/history')
  @ApiOperation({ summary: 'Get chat session message history' })
  @ApiResponse({ status: 200, description: 'Message history retrieved successfully' })
  async getSessionHistory(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.chatService.getSessionHistory(sessionId, limit, offset);
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get available chat agents' })
  @ApiResponse({ status: 200, description: 'Agents retrieved successfully' })
  async getAgents() {
    return this.chatService.getAvailableAgents();
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get user chat sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getUserSessions(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.chatService.getUserSessions(user.userId, limit, offset);
  }
} 