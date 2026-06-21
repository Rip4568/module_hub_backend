import { Controller, Post, Body, UploadedFile, UseInterceptors, UseGuards, Get, Param, Delete, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  @RequiresPermission('document:read')
  findAll(@CurrentTenant() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.documentService.findAll(tenantId, page, limit);
  }

  @Get(':id')
  @RequiresPermission('document:read')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.documentService.findOne(tenantId, id);
  }

  @Post()
  @RequiresPermission('document:create')
  create(@CurrentTenant() tenantId: string, @Body() createDocumentDto: CreateDocumentDto) {
    return this.documentService.create(tenantId, createDocumentDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @RequiresPermission('document:create')
  async uploadFile(@CurrentTenant() tenantId: string, @UploadedFile() file: UploadedDocumentFile) {
      const url = await this.documentService.uploadFile(file, tenantId);
      return { url };
  }

  @Get(':id/download')
  @RequiresPermission('document:read')
  async download(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    const document = await this.documentService.findOne(tenantId, id);
    return { url: document.fileUrl, name: document.name };
  }

  @Delete(':id')
  @RequiresPermission('document:delete')
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.documentService.remove(tenantId, id);
    return { deleted: true };
  }
}
