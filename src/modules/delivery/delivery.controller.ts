import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
// Delivery often accessed by mobile app drivers, permissions might be different
// Keeping it simple for now

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) { }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveryService.findOne(id);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.deliveryService.start(id);
  }

  @Post(':id/location')
  updateLocation(@Param('id') id: string, @Body() location: { lat: number; lng: number }) {
    return this.deliveryService.updateLocation(id, location.lat, location.lng);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() proof: CompleteDeliveryDto) {
    return this.deliveryService.complete(id, proof);
  }
}
