import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { UserVehicle } from '../../entities/user-vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    @InjectRepository(UserVehicle)
    private readonly vehicleRepo: Repository<UserVehicle>,
  ) {}

  async findAllForUser(userId: string): Promise<UserVehicle[]> {
    return this.vehicleRepo.find({
      where: { user_id: userId, deleted_at: IsNull() },
      relations: ['brand', 'model', 'trim'],
      order: { is_default: 'DESC', created_at: 'DESC' },
    });
  }

  async findOneForUser(userId: string, vehicleId: string): Promise<UserVehicle> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId, user_id: userId, deleted_at: IsNull() },
      relations: ['brand', 'model', 'trim'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async create(userId: string, dto: CreateVehicleDto): Promise<UserVehicle> {
    if (dto.is_default) {
      await this.clearDefaultVehicle(userId);
    }

    const vehicle = this.vehicleRepo.create({
      user_id: userId,
      brand_id: dto.brand_id,
      model_id: dto.model_id,
      trim_id: dto.trim_id ?? null,
      year: dto.year,
      nickname: dto.nickname ?? null,
      battery_capacity_kwh: dto.battery_capacity_kwh ?? null,
      drivetrain: dto.drivetrain ?? null,
      is_default: dto.is_default ?? false,
    });

    const saved = await this.vehicleRepo.save(vehicle);
    this.logger.log(`Vehicle created for user ${userId}: ${saved.id}`);

    return this.vehicleRepo.findOne({
      where: { id: saved.id },
      relations: ['brand', 'model', 'trim'],
    }) as Promise<UserVehicle>;
  }

  async update(userId: string, vehicleId: string, dto: UpdateVehicleDto): Promise<UserVehicle> {
    const vehicle = await this.findOneForUser(userId, vehicleId);

    if (dto.is_default === true) {
      await this.clearDefaultVehicle(userId);
    }

    Object.assign(vehicle, {
      brand_id: dto.brand_id ?? vehicle.brand_id,
      model_id: dto.model_id ?? vehicle.model_id,
      trim_id: dto.trim_id !== undefined ? dto.trim_id : vehicle.trim_id,
      year: dto.year ?? vehicle.year,
      nickname: dto.nickname !== undefined ? dto.nickname : vehicle.nickname,
      battery_capacity_kwh:
        dto.battery_capacity_kwh !== undefined
          ? dto.battery_capacity_kwh
          : vehicle.battery_capacity_kwh,
      drivetrain: dto.drivetrain !== undefined ? dto.drivetrain : vehicle.drivetrain,
      is_default: dto.is_default !== undefined ? dto.is_default : vehicle.is_default,
    });

    const saved = await this.vehicleRepo.save(vehicle);
    this.logger.log(`Vehicle ${vehicleId} updated by user ${userId}`);

    return this.vehicleRepo.findOne({
      where: { id: saved.id },
      relations: ['brand', 'model', 'trim'],
    }) as Promise<UserVehicle>;
  }

  async setDefault(userId: string, vehicleId: string): Promise<UserVehicle> {
    const vehicle = await this.findOneForUser(userId, vehicleId);
    await this.clearDefaultVehicle(userId);
    vehicle.is_default = true;
    await this.vehicleRepo.save(vehicle);
    this.logger.log(`Vehicle ${vehicleId} set as default for user ${userId}`);
    return vehicle;
  }

  async remove(userId: string, vehicleId: string): Promise<{ message: string }> {
    const vehicle = await this.findOneForUser(userId, vehicleId);

    // Soft delete
    await this.vehicleRepo.update(vehicle.id, { deleted_at: new Date() });
    this.logger.log(`Vehicle ${vehicleId} soft-deleted by user ${userId}`);

    return { message: 'Vehicle deleted successfully' };
  }

  async uploadImage(userId: string, vehicleId: string, imageUrl: string): Promise<UserVehicle> {
    const vehicle = await this.findOneForUser(userId, vehicleId);
    vehicle.image_url = imageUrl;
    return this.vehicleRepo.save(vehicle);
  }

  private async clearDefaultVehicle(userId: string): Promise<void> {
    await this.vehicleRepo
      .createQueryBuilder()
      .update(UserVehicle)
      .set({ is_default: false })
      .where('user_id = :userId AND is_default = true AND deleted_at IS NULL', { userId })
      .execute();
  }
}
