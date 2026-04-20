import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Report } from '../../entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus } from '../../common/enums';
import { PaginatedResult } from '../../common/interceptors/transform.interceptor';
import { paginateQuery } from '../../common/helpers/pagination.helper';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {}

  async create(userId: string, dto: CreateReportDto): Promise<Report> {
    // One report per user per target — upsert logic
    const existing = await this.reportRepo.findOne({
      where: {
        reporter_id: userId,
        target_type: dto.target_type,
        target_id: dto.target_id,
      },
    });

    if (existing) {
      existing.type = dto.type;
      existing.reason = dto.reason ?? null;
      existing.status = ReportStatus.PENDING;
      const updated = await this.reportRepo.save(existing);
      this.logger.log(`Report updated: ${updated.id} by user ${userId}`);
      return updated;
    }

    const report = this.reportRepo.create({
      reporter_id: userId,
      type: dto.type,
      target_type: dto.target_type,
      target_id: dto.target_id,
      reason: dto.reason ?? null,
      status: ReportStatus.PENDING,
    });

    const saved = await this.reportRepo.save(report);
    this.logger.log(`Report created: ${saved.id} by user ${userId}`);
    return saved;
  }

  async getAll(
    page: number = 1,
    limit: number = 20,
    status?: ReportStatus,
    targetType?: string,
  ): Promise<PaginatedResult<Report>> {
    const qb = this.reportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.reviewed_by', 'reviewed_by')
      .orderBy('report.created_at', 'DESC');

    if (status) {
      qb.where('report.status = :status', { status });
    }

    if (targetType) {
      qb.andWhere('report.target_type = :targetType', { targetType });
    }

    return paginateQuery(qb, page, limit);
  }

  async updateReport(
    adminId: string,
    reportId: string,
    status: ReportStatus,
    notes?: string,
  ): Promise<Report> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = status;
    report.admin_notes = notes ?? report.admin_notes;
    report.reviewed_by_id = adminId;
    report.reviewed_at = new Date();

    const saved = await this.reportRepo.save(report);
    this.logger.log(`Report ${reportId} updated to ${status} by admin ${adminId}`);
    return saved;
  }

  async findById(reportId: string): Promise<Report> {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['reporter', 'reviewed_by'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }
}
