import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfigService } from './config/database.config';

// Core Modules
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantModuleModule } from './modules/tenant-module/tenant-module.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { CustomerModule } from './modules/customer/customer.module';

// Business Modules
import { OrganizationModule } from './modules/organization/organization.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { DriverModule } from './modules/driver/driver.module';
import { FinancialModule } from './modules/financial/financial.module';
import { DocumentModule } from './modules/document/document.module';
import { ReportModule } from './modules/report/report.module';

// Common
import { ClsModule, ClsMiddleware } from 'nestjs-cls';
import { TenantContextMiddleware } from './common/middlewares/tenant-context.middleware';
import { TenantSubscriber } from './common/subscribers/tenant.subscriber';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: false },
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfigService,
    }),

    // Core
    TenantModule,
    TenantModuleModule,
    UserModule,
    AuthModule,
    RoleModule,
    PermissionModule,
    ActivityLogModule,
    CustomerModule,

    // Business
    OrganizationModule,
    CategoryModule,
    ProductModule,
    OrderModule,
    DeliveryModule,
    VehicleModule,
    DriverModule,
    FinancialModule,
    DocumentModule,
    ReportModule,
  ],
  controllers: [],
  providers: [TenantSubscriber],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ClsMiddleware, TenantContextMiddleware)
      .forRoutes('*');
  }
}
