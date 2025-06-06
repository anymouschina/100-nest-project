import { Inject, Injectable } from '@nestjs/common';
import {
  AddDictDataDto,
  AddSysDictTypeDto,
  GetDictDataListDto,
  GetSysDictTypeDto,
  QueryDictTypeDto,
  UpdateDictDataDto,
  UpdateSysDictTypeDto,
} from './dto/req-sys-dict.dto';
import { CustomPrismaService, PrismaService } from 'nestjs-prisma';
import { ApiException } from 'src/common/exceptions/api.exception';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { ExtendedPrismaClient } from 'src/shared/prisma/prisma.extension';
import Redis from 'ioredis';
import { DICTTYPE_KEY } from 'src/common/contants/redis.contant';
import { DataScope } from 'src/common/type/data-scope.type';

@Injectable()
export class SysDictService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('CustomPrisma')
    private readonly customPrisma: CustomPrismaService<ExtendedPrismaClient>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /* 新增 */
  async addType(addSysDictTypeDto: AddSysDictTypeDto) {
    return await this.prisma.$transaction(async (prisma) => {
      const config = await prisma.sysDictType.findUnique({
        where: {
          dictType: addSysDictTypeDto.dictType,
        },
      });
      if (config) throw new ApiException('字典类型已存在，请更换后再试。');
      
      // 确保移除可能存在的dictId，让数据库自动生成
      const dictTypeData = { ...addSysDictTypeDto };
      if ('dictId' in dictTypeData) {
        delete dictTypeData.dictId;
      }
      
      return await prisma.sysDictType.create({
        data: dictTypeData,
      });
    });
  }

  /* 编辑字典类型 */
  async updateType(updateSysDictTypeDto: UpdateSysDictTypeDto) {
    return await this.prisma.$transaction(async (prisma) => {
      const { dictId, dictType } = updateSysDictTypeDto;
      const dict = await prisma.sysDictType.findUnique({
        where: {
          dictId,
        },
      });
      if (!dict) throw new ApiException('该记录不存在，请重新查询后操作。');
      const dict2 = await prisma.sysDictType.findFirst({
        where: {
          dictId: {
            not: dictId,
          },
          dictType,
        },
      });
      if (dict2) throw new ApiException('字典类型已存在，请更换后再试。');
      return await prisma.sysDictType.update({
        data: updateSysDictTypeDto,
        where: {
          dictId,
        },
      });
    });
  }

  /* 分页查询 */
  async typeList(getSysDictTypeDto: GetSysDictTypeDto, dataScope: DataScope) {
    const { dictName, dictType, status, params, skip, take } =
      getSysDictTypeDto;
    
    // 构建查询条件
    const whereCondition: any = {
      dictName: {
        contains: dictName,
      },
      dictType: {
        contains: dictType,
      },
      status: status,
      createTime: {
        gte: params.beginTime,
        lt: params.endTime,
      },
    };
    
    // 构建数据权限过滤条件
    if (dataScope.OR && dataScope.OR.length > 0) {
      // 针对部门ID和创建者的过滤条件
      const filterConditions = [];
      
      // 获取所有创建者条件
      const createByConditions = dataScope.OR
        .filter(condition => condition.createBy)
        .map(condition => ({ createBy: condition.createBy }));
      
      if (createByConditions.length > 0) {
        filterConditions.push(...createByConditions);
      }
      
      // 获取所有部门ID条件
      const deptIdConditions = dataScope.OR
        .filter(condition => condition.deptId && condition.deptId.in && condition.deptId.in.length > 0);
      
      if (deptIdConditions.length > 0) {
        // 如果有部门ID条件，需要联表查询用户表，找出这些部门下的用户
        // 由于字典表没有直接关联部门，需要通过创建者间接关联
        const deptIds = deptIdConditions[0].deptId.in;
        
        if (deptIds && deptIds.length > 0) {
          // 查询这些部门下的用户
          const usersInDepts = await this.prisma.sysUser.findMany({
            where: {
              deptId: {
                in: deptIds
              },
              delFlag: '0'
            },
            select: {
              userName: true
            }
          });
          
          // 将部门用户的userName添加到过滤条件中
          if (usersInDepts.length > 0) {
            filterConditions.push({
              createBy: {
                in: usersInDepts.map(user => user.userName)
              }
            });
          }
        }
      }
      
      // 如果有过滤条件，添加到查询中
      if (filterConditions.length > 0) {
        whereCondition.OR = filterConditions;
      }
    }
    
    return await this.customPrisma.client.sysDictType.findAndCount({
      where: whereCondition,
      skip: skip,
      take: take,
    });
  }

  /* 查询指定类型的字典列表，不需要权限过滤 */
  async queryByType(queryDictTypeDto: QueryDictTypeDto) {
    const { dictType } = queryDictTypeDto;
    
    // 查询匹配的字典类型
    const dictTypeData = await this.prisma.sysDictType.findFirst({
      where: {
        dictType: dictType,
        status: '0', // 只查询正常状态的字典
      },
    });
    
    if (!dictTypeData) {
      return { data: [] };
    }
    
    // 查询该类型下的所有字典数据
    const dictDataList = await this.prisma.sysDictData.findMany({
      where: {
        dictType: dictType,
        status: '0', // 只查询正常状态的字典数据
      },
      orderBy: {
        dictSort: 'asc', // 按字典排序升序排列
      },
    });
    
    return dictDataList
  }

  /* 通过id查询字典类型 */
  async getDictTypeById(dictId: number) {
    return await this.prisma.sysDictType.findUnique({
      where: { dictId },
    });
  }

  /* 刷新字典缓存 */
  async refreshCache() {
    const keyArr = await this.redis.keys(`${DICTTYPE_KEY}:*`);
    if (keyArr && keyArr.length) {
      await this.redis.del(keyArr);
    }
  }

  /* 通过字典类型获取字典值 */
  async getDictDataByDictType(dictType: string) {
    const dictDataString = await this.redis.get(`${DICTTYPE_KEY}:${dictType}`);
    if (dictDataString) {
      return JSON.parse(dictDataString);
    }
    const dictData = await this.prisma.sysDictData.findMany({
      orderBy: {
        dictSort: 'asc',
      },
      where: {
        dictType,
      },
    });
    if (dictData.length) {
      this.redis.set(`${DICTTYPE_KEY}:${dictType}`, JSON.stringify(dictData));
    }
    return dictData;
  }

  /* 批量删除字典 */
  async deleteType(dictIdArr: number[]) {
    console.log(dictIdArr);

    await this.prisma.sysDictType.deleteMany({
      where: {
        dictId: {
          in: dictIdArr,
        },
      },
    });
  }

  /* 分页查询字典数据 */
  async dictDataList(getDictDataListDto: GetDictDataListDto, dataScope: DataScope) {
    const { dictType, dictLabel, skip, take, status } = getDictDataListDto;
    
    // 构建查询条件
    const whereCondition: any = {
      dictType,
      status,
      dictLabel: {
        contains: dictLabel,
      }
    };
    
    // 构建数据权限过滤条件
    if (dataScope.OR && dataScope.OR.length > 0) {
      // 针对部门ID和创建者的过滤条件
      const filterConditions = [];
      
      // 获取所有创建者条件
      const createByConditions = dataScope.OR
        .filter(condition => condition.createBy)
        .map(condition => ({ createBy: condition.createBy }));
      
      if (createByConditions.length > 0) {
        filterConditions.push(...createByConditions);
      }
      
      // 获取所有部门ID条件
      const deptIdConditions = dataScope.OR
        .filter(condition => condition.deptId && condition.deptId.in && condition.deptId.in.length > 0);
      
      if (deptIdConditions.length > 0) {
        // 如果有部门ID条件，需要联表查询用户表，找出这些部门下的用户
        // 由于字典表没有直接关联部门，需要通过创建者间接关联
        const deptIds = deptIdConditions[0].deptId.in;
        
        if (deptIds && deptIds.length > 0) {
          // 查询这些部门下的用户
          const usersInDepts = await this.prisma.sysUser.findMany({
            where: {
              deptId: {
                in: deptIds
              },
              delFlag: '0'
            },
            select: {
              userName: true
            }
          });
          
          // 将部门用户的userName添加到过滤条件中
          if (usersInDepts.length > 0) {
            filterConditions.push({
              createBy: {
                in: usersInDepts.map(user => user.userName)
              }
            });
          }
        }
      }
      
      // 如果有过滤条件，添加到查询中
      if (filterConditions.length > 0) {
        whereCondition.OR = filterConditions;
      }
    }
    
    return await this.customPrisma.client.sysDictData.findAndCount({
      orderBy: {
        dictSort: 'asc',
      },
      where: whereCondition,
      skip,
      take,
    });
  }

  /* 新增字典数据 */
  async addDictData(addDictDataDto: AddDictDataDto) {
    return await this.prisma.$transaction(async (prisma) => {
      const dictData = await prisma.sysDictData.findFirst({
        where: {
          dictType: addDictDataDto.dictType,
          dictLabel: addDictDataDto.dictLabel,
        },
      });
      if (dictData) throw new ApiException('数据标签已存在，请更换后重试。');
      
      // 确保移除可能存在的dictCode，让数据库自动生成
      const dictDataItem = { ...addDictDataDto };
      if ('dictCode' in dictDataItem) {
        delete dictDataItem.dictCode;
      }
      
      return await prisma.sysDictData.create({
        data: dictDataItem,
      });
    });
  }

  /* 通过dictCode获取字典数据 */
  async findDictDataById(dictCode: number) {
    return await this.prisma.sysDictData.findUnique({
      where: {
        dictCode,
      },
    });
  }

  /* 编辑字典数据 */
  async updateDictData(updateDictDataDto: UpdateDictDataDto) {
    return await this.prisma.$transaction(async (prisma) => {
      const { dictCode, dictLabel, dictType } = updateDictDataDto;
      const dictData = prisma.sysDictData.findUnique({
        where: {
          dictCode,
        },
      });
      if (!dictData) throw new ApiException('该记录不存在，请重新查询后操作。');
      const dictData2 = await prisma.sysDictData.findFirst({
        where: {
          dictType,
          dictLabel,
          dictCode: {
            not: dictCode,
          },
        },
      });
      if (dictData2) throw new ApiException('数据标签已存在，请更换后再试。');
      return await prisma.sysDictData.update({
        data: updateDictDataDto,
        where: {
          dictCode,
        },
      });
    });
  }

  /* 删除字典数据 */
  async deleteDictData(dictCode: number[]) {
    await this.prisma.sysDictData.deleteMany({
      where: {
        dictCode: {
          in: dictCode,
        },
      },
    });
  }
}
