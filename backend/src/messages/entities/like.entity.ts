import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CelestialBody } from './celestial-body.entity';

@Entity('likes')
@Unique('UQ_body_ip_hash', ['body', 'ipHash'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CelestialBody, (body) => body.likesHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'body_id' })
  body!: CelestialBody;

  @Column({ type: 'varchar', length: 64, name: 'ip_hash' })
  ipHash!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
