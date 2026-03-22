import { Controller, Post, Body, UploadedFile, UseInterceptors, UseGuards, Get, Param, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UploadedDocumentFile } from './interfaces/uploaded-file.interface';

@Controller('documents')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard)
@RequiresModule('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.documentService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.documentService.findOne(tenantId, id);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() createDocumentDto: CreateDocumentDto) {
    return this.documentService.create(tenantId, createDocumentDto);
  }

  // Example upload endpoint
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: UploadedDocumentFile) {
      const url = await this.documentService.uploadFile(file);
      return { url };
  }

  @Delete(':id')
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.documentService.remove(tenantId, id);
    return { deleted: true };
  }
}
