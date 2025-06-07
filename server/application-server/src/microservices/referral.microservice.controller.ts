import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from '../user/user.service';
import { ReferralMicroservicePatterns } from '../common/constants/microservice.constants';
import { CreateReferralCodeDto } from '../user/dto/create-referral-code.dto';

@Controller()
export class ReferralMicroserviceController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(ReferralMicroservicePatterns.CREATE_CODE)
  async createReferralCode(@Payload() data: CreateReferralCodeDto) {
    return this.userService.createReferralCode(data);
  }

  @MessagePattern(ReferralMicroservicePatterns.GET_ALL_CODES)
  async getAllReferralCodes(@Payload() data: { activeOnly?: boolean }) {
    return this.userService.getAllReferralCodes(data.activeOnly);
  }

  @MessagePattern(ReferralMicroservicePatterns.UPDATE_CODE_STATUS)
  async updateReferralCodeStatus(
    @Payload() data: { id: number; isActive: boolean },
  ) {
    const { id, isActive } = data;
    return this.userService.updateReferralCodeStatus(id, isActive);
  }

  @MessagePattern(ReferralMicroservicePatterns.GET_REFERRAL_STATS)
  async getReferralStats(@Payload() data: { userId?: number }) {
    return this.userService.getReferralStats(data.userId);
  }
} 