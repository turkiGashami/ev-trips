import { DataSource } from 'typeorm';
import { AdminLog } from '../../entities/admin-log.entity';

export async function logAdminAction(
  dataSource: DataSource,
  params: {
    actorId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    payload?: Record<string, any>;
    ipAddress?: string;
  },
): Promise<void> {
  const repo = dataSource.getRepository(AdminLog);
  const log = repo.create({
    actor_id: params.actorId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    payload: params.payload,
    ip_address: params.ipAddress,
  });
  await repo.save(log);
}
