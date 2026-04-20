import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargingStation } from '../../entities/charging-station.entity';
import { paginateQuery } from '../../common/helpers/pagination.helper';

@Injectable()
export class ChargingStationsService {
  constructor(
    @InjectRepository(ChargingStation)
    private stationRepo: Repository<ChargingStation>,
  ) {}

  async findAll(query: {
    search?: string;
    cityId?: string;
    chargerType?: string;
    provider?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.stationRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.city', 'city')
      .where('s.is_active = true');

    if (query.search) {
      qb.andWhere('(s.name ILIKE :search OR s.provider ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.cityId) qb.andWhere('s.city_id = :cityId', { cityId: query.cityId });
    if (query.chargerType) qb.andWhere('s.charger_type = :chargerType', { chargerType: query.chargerType });
    if (query.provider) qb.andWhere('s.provider ILIKE :provider', { provider: `%${query.provider}%` });

    qb.orderBy('s.name', 'ASC');
    return paginateQuery(qb, query.page || 1, query.limit || 20);
  }

  async findOne(id: string) {
    const station = await this.stationRepo.findOne({
      where: { id, is_active: true },
      relations: ['city'],
    });
    if (!station) throw new NotFoundException('Charging station not found');
    return station;
  }

  async suggest(userId: string, dto: {
    name: string;
    provider?: string;
    charger_type: string;
    city_id?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) {
    const station = this.stationRepo.create({
      ...dto,
      charger_type: dto.charger_type as any,
      suggested_by_user_id: userId,
      is_verified: false,
      is_active: false,
    });
    return this.stationRepo.save(station);
  }

  // Admin methods
  async adminCreate(dto: any) {
    const station = this.stationRepo.create({ ...dto, is_verified: true, is_active: true });
    return this.stationRepo.save(station);
  }

  async adminUpdate(id: string, dto: any) {
    const station = await this.stationRepo.findOne({ where: { id } });
    if (!station) throw new NotFoundException('Station not found');
    Object.assign(station, dto);
    return this.stationRepo.save(station);
  }

  async adminDelete(id: string) {
    await this.stationRepo.update(id, { is_active: false });
  }
}
