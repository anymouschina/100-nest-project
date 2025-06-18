import { Body, Controller, Get, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSessionDto, SendMessageDto } from './types';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post('sessions')
  async createSession(@Request() req, @Body() createSessionDto: CreateSessionDto) {
    return this.chatService.createSession({
      ...createSessionDto,
      userId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getUserSessions(@Request() req) {
    return this.chatService.getUserSessions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions/:id')
  async getSessionDetails(@Request() req, @Param('id') id: string) {
    return this.chatService.getSessionDetails(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/messages')
  async sendMessage(@Request() req, @Param('id') id: string, @Body() body: { message: string }) {
    return this.chatService.sendMessage({
      userId: req.user.id,
      sessionId: id,
      message: body.message,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put('sessions/:id/end')
  async endSession(@Request() req, @Param('id') id: string) {
    return this.chatService.endSession(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('agents/:id/tool-usage')
  async getAgentToolUsage(@Param('id') id: string) {
    return this.chatService.getAgentToolUsage(id);
  }
} 