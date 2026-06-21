import { BadRequestException, Controller, Post, Body, UploadedFile, UseInterceptors, UseGuards, Get, Param, Delete, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UploadedDocumentFile } from './interfaces/uploaded-file.interface';
import { Permissions } from '../../common/constants/permissions';
import { documentUploadOptions } from './document-upload.config';

@Controller('documents')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  @RequiresPermission(Permissions.READ_DOCUMENT)
  findAll(@CurrentTenant() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.documentService.findAll(tenantId, page, limit);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_DOCUMENT)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.documentService.findOne(tenantId, id);
  }

  @Post()
  @RequiresPermission(Permissions.CREATE_DOCUMENT)
  create(@CurrentTenant() tenantId: string, @Body() createDocumentDto: CreateDocumentDto) {
    return this.documentService.create(tenantId, createDocumentDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', documentUploadOptions))
  @RequiresPermission(Permissions.CREATE_DOCUMENT)
  async uploadFile(@CurrentTenant() tenantId: string, @UploadedFile() file: UploadedDocumentFile) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.documentService.uploadFile(file, tenantId);
  }

  @Get(':id/download')
  @RequiresPermission(Permissions.READ_DOCUMENT)
  async download(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    const document = await this.documentService.findOne(tenantId, id);
    return { url: document.fileUrl, name: document.name };
  }

  @Delete(':id')
  @RequiresPermission(Permissions.DELETE_DOCUMENT)
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.documentService.remove(tenantId, id);
    return { deleted: true };
  }
}
