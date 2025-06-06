import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SubmitAppointmentDto } from './dto/submit-appointment.dto';
import { AppointmentStatus } from './dto/update-status.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly dbService: DatabaseService,
  ) {}

  /**
   * 确保用户存在，如果不存在则创建
   * @param userId 用户ID
   * @param userName 用户名称
   * @param openId 用户openId
   * @returns 用户ID
   */
  private async ensureUserExists(userId: number, userName?: string, openId?: string) {
    // 查询用户是否存在
    const existingUser = await this.dbService.$queryRaw`
      SELECT * FROM "User" WHERE "userId" = ${userId}
    ` as unknown as any[];

    if (existingUser && existingUser.length > 0) {
      return existingUser[0].userId;
    }

    // 如果用户不存在，但提供了openId，查找openId对应的用户
    if (openId) {
      const userByOpenId = await this.dbService.$queryRaw`
        SELECT * FROM "User" WHERE "openId" = ${openId}
      ` as unknown as any[];

      if (userByOpenId && userByOpenId.length > 0) {
        return userByOpenId[0].userId;
      }
    }

    // 如果用户不存在，创建用户
    const name = userName || `User_${Date.now()}`;
    const user = await this.dbService.$queryRaw`
      INSERT INTO "User" ("name", "openId", "createdAt")
      VALUES (${name}, ${openId}, NOW())
      RETURNING *;
    ` as unknown as any[];

    return user[0].userId;
  }

  /**
   * 提交预约并创建金额为0的订单
   * @param userId 用户ID
   * @param appointmentData 预约数据
   * @param userName 用户名称（可选）
   * @param openId 用户openId（可选）
   * @returns 创建的预约和订单信息
   */
  async submitAppointment(userId: number, appointmentData: SubmitAppointmentDto, userName?: string, openId?: string) {
    try {
      console.log('==== 开始处理预约提交 ====');
      console.log('输入参数:', { userId, userName, openId });
      console.log('预约数据:', JSON.stringify(appointmentData));
      
      // 确保sceneType是数组
      const sceneType = Array.isArray(appointmentData.sceneType) 
        ? appointmentData.sceneType 
        : [String(appointmentData.sceneType)];
      console.log('处理后的sceneType:', sceneType);
      
      // 预处理经纬度，确保是数字类型
      const latitude = appointmentData.latitude ? parseFloat(String(appointmentData.latitude)) : null;
      const longitude = appointmentData.longitude ? parseFloat(String(appointmentData.longitude)) : null;
      console.log('处理后的坐标:', { latitude, longitude });
      
      // 使用事务确保预约和订单同时创建成功或失败
      console.log('开始事务处理');
      return await this.dbService.$transaction(async (prisma) => {
        console.log('事务内 - 开始');
        
        // 确保用户存在
        console.log('查询用户:', userId);
        const user = await prisma.user.findUnique({
          where: { userId }
        });
        console.log('查询用户结果:', user ? '用户存在' : '用户不存在');
        
        let validUserId = userId;
        if (!user) {
          console.log('用户不存在，尝试查找或创建用户');
          // 检查是否可以通过openId找到用户
          if (openId) {
            console.log('尝试通过openId查找用户:', openId);
            const userByOpenId = await prisma.user.findUnique({
              where: { openId }
            });
            
            if (userByOpenId) {
              console.log('通过openId找到用户:', userByOpenId.userId);
              validUserId = userByOpenId.userId;
            } else {
              // 创建新用户
              console.log('通过openId未找到用户，创建新用户');
              const newUser = await prisma.user.create({
                data: {
                  name: userName || `User_${Date.now()}`,
                  openId
                }
              });
              console.log('已创建新用户:', newUser.userId);
              validUserId = newUser.userId;
            }
          } else {
            // 没有openId，创建新用户
            console.log('没有openId，创建新用户');
            const newUser = await prisma.user.create({
              data: {
                name: userName || `User_${Date.now()}`
              }
            });
            console.log('已创建新用户:', newUser.userId);
            validUserId = newUser.userId;
          }
        }
        
        // 创建预约记录
        const appointment = await prisma.appointment.create({
          data: {
            serviceType: appointmentData.serviceType,
            name: appointmentData.name,
            phone: appointmentData.phone,
            region: appointmentData.region,
            address: appointmentData.address,
            sceneType,
            location: appointmentData.location,
            latitude,
            longitude,
            description: appointmentData.description,
            imageUrls: appointmentData.imageUrls || [],
            userId: validUserId
          }
        });
        
        // 创建订单数据对象
        const appointmentInfo = {
          serviceType: appointmentData.serviceType,
          name: appointmentData.name,
          phone: appointmentData.phone,
          region: appointmentData.region,
          address: appointmentData.address,
          sceneType,
          location: appointmentData.location,
          latitude,
          longitude,
          description: appointmentData.description,
          imageUrls: appointmentData.imageUrls || []
        };
        
        // 创建金额为0的订单
        const order = await prisma.order.create({
          data: {
            total: 0,
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            appointmentInfo,
            userId: validUserId,
            appointmentId: appointment.id
          }
        });
        
        return {
          appointment,
          order
        };
      });
    } catch (error) {
      console.error('提交预约时出错:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有预约
   * @param userId 用户ID
   * @returns 预约列表
   */
  async getUserAppointments(userId: number) {
    // 确保用户存在
    await this.ensureUserExists(userId);
    
    const result = await this.dbService.$queryRaw`
      SELECT 
        a.*,
        (SELECT json_agg(o) FROM "Order" o WHERE o."appointmentId" = a.id) as orders
      FROM "Appointment" a
      WHERE a."userId" = ${userId}
      ORDER BY a."createdAt" DESC;
    `;
    return result as unknown as any[];
  }

  /**
   * 获取预约详情
   * @param id 预约ID
   * @returns 预约详情
   */
  async getAppointmentById(id: number) {
    const result = await this.dbService.$queryRaw`
      SELECT 
        a.*,
        (SELECT json_agg(o) FROM "Order" o WHERE o."appointmentId" = a.id) as orders,
        (SELECT json_build_object('userId', u."userId", 'name', u."name", 'openId', u."openId") 
         FROM "User" u WHERE u."userId" = a."userId") as user
      FROM "Appointment" a
      WHERE a.id = ${id};
    `;
    
    const appointments = result as unknown as any[];
    if (!appointments || appointments.length === 0) {
      return null;
    }
    
    return appointments[0];
  }
  
  /**
   * 更新预约状态 - 仅当数据库已更新后使用
   * @param id 预约ID
   * @param status 新状态
   * @param reason 原因（如取消原因）
   * @returns 更新后的预约
   */
  async updateAppointmentStatus(id: number, status: AppointmentStatus, reason?: string) {
    // 检查数据库是否已迁移并包含这些字段
    try {
      const appointment = await this.dbService.$queryRaw`
        SELECT * FROM "Appointment" WHERE id = ${id}
      ` as unknown as any[];
      
      if (!appointment || appointment.length === 0) {
        return null;
      }
      
      // 如果没有status字段，返回原始数据
      if (!appointment[0].hasOwnProperty('status')) {
        return appointment[0];
      }
      
      // 数据库已更新，可以使用新字段
      const now = new Date();
      
      let query = `
        UPDATE "Appointment"
        SET "status" = '${status}'::"AppointmentStatus", "updatedAt" = NOW()
      `;
      
      // 根据状态设置相应的时间字段
      if (status === AppointmentStatus.COMPLETED) {
        query += `, "completedAt" = NOW()`;
      } else if (status === AppointmentStatus.CANCELLED) {
        query += `, "cancelledAt" = NOW()`;
        if (reason) {
          query += `, "cancelReason" = '${reason}'`;
        }
      }
      
      query += ` WHERE id = ${id} RETURNING *;`;
      
      const result = await this.dbService.$queryRawUnsafe(query);
      const updatedAppointment = result as unknown as any[];
      
      if (!updatedAppointment || updatedAppointment.length === 0) {
        return null;
      }
      
      return updatedAppointment[0];
    } catch (error) {
      // 如果出错，返回原始预约数据
      const appointment = await this.dbService.$queryRaw`
        SELECT * FROM "Appointment" WHERE id = ${id}
      ` as unknown as any[];
      
      if (!appointment || appointment.length === 0) {
        return null;
      }
      
      return appointment[0];
    }
  }
  
  /**
   * 记录预约跟进
   * @param id 预约ID
   * @returns 更新后的预约
   */
  async recordFollowUp(id: number) {
    try {
      // 首先检查表结构
      const appointment = await this.dbService.$queryRaw`
        SELECT * FROM "Appointment" WHERE id = ${id}
      ` as unknown as any[];
      
      if (!appointment || appointment.length === 0) {
        return null;
      }
      
      // 如果没有followUpCount字段，返回原始数据
      if (!appointment[0].hasOwnProperty('followUpCount')) {
        return appointment[0];
      }
      
      // 数据库已更新，可以使用新字段
      let query = `
        UPDATE "Appointment"
        SET "followUpCount" = "followUpCount" + 1, "lastFollowUpAt" = NOW(), "updatedAt" = NOW()
      `;
      
      query += ` WHERE id = ${id} RETURNING *;`;
      
      const result = await this.dbService.$queryRawUnsafe(query);
      const updatedAppointment = result as unknown as any[];
      
      if (!updatedAppointment || updatedAppointment.length === 0) {
        return null;
      }
      
      return updatedAppointment[0];
    } catch (error) {
      // 如果出错，返回原始预约数据
      const appointment = await this.dbService.$queryRaw`
        SELECT * FROM "Appointment" WHERE id = ${id}
      ` as unknown as any[];
      
      if (!appointment || appointment.length === 0) {
        return null;
      }
      
      return appointment[0];
    }
  }
  
  /**
   * 统计预约场景类型
   * @returns 各场景类型的统计数据
   */
  async getSceneTypeStatistics() {
    // 使用 PostgreSQL 的 unnest 函数来展开 sceneType 数组并进行统计
    try {
      const result = await this.dbService.$queryRaw`
        SELECT unnest("sceneType") as scene_type, COUNT(*) as count
        FROM "Appointment"
        GROUP BY scene_type
        ORDER BY count DESC;
      `;
      
      const stats = result as unknown as Array<{scene_type: string, count: number}>;
      return stats.map(item => ({
        sceneType: item.scene_type,
        count: item.count
      }));
    } catch (error) {
      console.error('统计场景类型时出错:', error);
      return [];
    }
  }
} 