import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
  ) {}

  async create(createDeliveryDto: any): Promise<Delivery> {
    const delivery = this.deliveryRepository.create(createDeliveryDto as Delivery);
    return this.deliveryRepository.save(delivery);
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({ where: { id }, relations: ['order', 'driver'] });
    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }
    return delivery;
  }

  async findByOrder(orderId: string): Promise<Delivery> {
      return this.deliveryRepository.findOne({ where: { orderId } });
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<Delivery> {
      const delivery = await this.findOne(id);
      delivery.currentLat = lat;
      delivery.currentLng = lng;
      return this.deliveryRepository.save(delivery);
  }

  async start(id: string): Promise<Delivery> {
      const delivery = await this.findOne(id);
      delivery.startedAt = new Date();
      return this.deliveryRepository.save(delivery);
  }

  async complete(id: string, proof: any): Promise<Delivery> {
      const delivery = await this.findOne(id);
      delivery.completedAt = new Date();
      delivery.photoUrl = proof.photoUrl;
      delivery.signature = proof.signature;
      delivery.signedBy = proof.signedBy;
      return this.deliveryRepository.save(delivery);
  }
}
