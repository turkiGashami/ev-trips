import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type ContactMessageType = 'general' | 'suggestion' | 'bug' | 'partnership';
export type ContactMessageStatus = 'new' | 'read' | 'handled';

@Entity('contact_messages')
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 200 })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 30, default: 'general' })
  type: ContactMessageType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'new' })
  status: ContactMessageStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip: string | null;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @Column({ type: 'text', nullable: true })
  admin_reply: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  replied_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  replied_by_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
