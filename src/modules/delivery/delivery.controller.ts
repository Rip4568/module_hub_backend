import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { DeliveryDocumentType } from './entities/delivery-document.entity';

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) { }

  @Post()
  create(@Body() createDeliveryDto: CreateDeliveryDto) {
    return this.deliveryService.create(createDeliveryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveryService.findOne(id);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.deliveryService.start(id);
  }

  @Patch(':id/location')
  updateLocation(
    @Param('id') id: string,
    @Body() location: { lat: number; lng: number; batteryLevel?: number; timestamp?: Date },
    @Req() req: any
  ) {
    return this.deliveryService.updateLocation(id, location, req.user.userId);
  }

  @Post(':id/documents')
  uploadDocument(
    @Param('id') id: string,
    @Body() document: { type: DeliveryDocumentType; url: string },
    @Req() req: any
  ) {
    return this.deliveryService.uploadDocument(id, document, req.user.userId);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() proof: CompleteDeliveryDto) {
    return this.deliveryService.complete(id, proof);
  }
}
