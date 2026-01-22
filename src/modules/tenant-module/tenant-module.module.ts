import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantModuleService } from './tenant-module.service';
import { TenantModuleController } from './tenant-module.controller';
import { TenantModuleEntity } from './entities/tenant-module.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TenantModuleEntity])],
  controllers: [TenantModuleController],
  providers: [TenantModuleService],
  exports: [TenantModuleService],
})
export class TenantModuleModule {}
