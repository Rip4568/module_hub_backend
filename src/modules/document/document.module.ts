import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    TenantModuleModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
