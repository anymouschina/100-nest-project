/*
 * 公共上传控制器，不需要鉴权
 */

import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Public } from '../../../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('public')
export class PublicUploadController {
  constructor(private configService: ConfigService) {}

  /**
   * 单文件上传 - 公共接口，无需鉴权
   */
  @Public()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('fileName') fileName,
  ) {
    // 构建文件的访问URL
    const baseUrl = this.configService.get('app.url', '');
    const port = this.configService.get('port', '');
    const url = baseUrl ? baseUrl : `http://localhost:${port}`;
    
    return {
      fileName,
      originalname: file.originalname,
      mimetype: file.mimetype,
      url: `${url}${fileName}`, // 返回可访问的URL
    };
  }

  /**
   * 多文件上传 - 公共接口，无需鉴权
   */
  @Public()
  @Post('uploads')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>, @Query('fileName') fileName) {
    // 构建文件的访问URL
    const baseUrl = this.configService.get('app.url', '');
    const port = this.configService.get('port', '');
    const url = baseUrl ? baseUrl : `http://localhost:${port}`;
    
    return files.map((file, index) => {
      // 为每个文件构建访问URL
      const filePath = fileName.split('/').slice(0, -1).join('/') + '/' + file.filename;
      
      return {
        originalname: file.originalname,
        mimetype: file.mimetype,
        url: `${url}${filePath}`, // 返回可访问的URL
      };
    });
  }
}