import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { SubmitAppointmentDto } from './dto/submit-appointment.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AppointmentStatus, UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('appointment')
@Controller('api/appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('submit')
  @ApiOperation({ summary: '提交预约申请并创建金额为0的订单' })
  @ApiResponse({ status: 201, description: '预约已创建' })
  async submitAppointment(@Req() req, @Body() appointmentData: SubmitAppointmentDto) {
    // 从JWT中获取用户信息
    let userId = 1; // 默认值
    let userName = null;
    let openId = null;
    
    // 如果有认证信息，使用认证信息中的用户ID
    if (req.user) {
      userId = req.user.userId || req.user.sub || 1;
      userName = req.user.name;
      openId = req.user.openId;
    }
    
    // 处理sceneType，确保它是一个数组
    if (appointmentData.sceneType && !Array.isArray(appointmentData.sceneType)) {
      appointmentData.sceneType = String(appointmentData.sceneType).split(',');
    }
    return this.appointmentService.submitAppointment(
      userId, 
      appointmentData,
      userName,
      openId
    );
  }

  @Get('user')
  @ApiOperation({ summary: '获取当前用户的所有预约' })
  @ApiResponse({ status: 200, description: '返回用户的所有预约' })
  async getUserAppointments(@Req() req) {
    // 从JWT中获取用户ID
    const userId = req.user?.userId || req.user?.sub || 1;
    return this.appointmentService.getUserAppointments(userId);
  }
  
  @Get('stats/scene-types')
  @ApiOperation({ summary: '获取预约场景类型统计' })
  @ApiResponse({ status: 200, description: '返回各场景类型的统计数据' })
  async getSceneTypeStatistics() {
    return this.appointmentService.getSceneTypeStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取预约详情' })
  @ApiResponse({ status: 200, description: '返回预约详情' })
  @ApiResponse({ status: 404, description: '预约不存在' })
  async getAppointmentById(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.getAppointmentById(id);
  }
  
  @Patch(':id/status')
  @ApiOperation({ summary: '更新预约状态' })
  @ApiResponse({ status: 200, description: '状态已更新' })
  @ApiResponse({ status: 404, description: '预约不存在' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto
  ) {
    return this.appointmentService.updateAppointmentStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.reason
    );
  }
  
  @Patch(':id/follow-up')
  @ApiOperation({ summary: '记录预约跟进' })
  @ApiResponse({ status: 200, description: '跟进已记录' })
  @ApiResponse({ status: 404, description: '预约不存在' })
  async recordFollowUp(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.recordFollowUp(id);
  }
} 