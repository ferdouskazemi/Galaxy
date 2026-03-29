import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Like } from './like.entity';

export enum BodyType {
  STAR = 'star',
  PLANET = 'planet',
  ASTEROID = 'asteroid',
  NEUTRON_STAR = 'neutron_star',
}

export enum PlanetClass {
  ROCKY = 'rocky',
  OCEAN = 'ocean',
  GAS = 'gas',
  ICE = 'ice',
  HOT = 'hot',
  DWARF = 'dwarf',
}

@Entity('celestial_bodies')
@Index(['likes'])
@Index(['createdAt'])
export class CelestialBody {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  message!: string;

  @Column({ type: 'enum', enum: BodyType, name: 'body_type' })
  bodyType!: BodyType;

  @Column({
    type: 'enum',
    enum: PlanetClass,
    name: 'planet_class',
    nullable: true,
  })
  planetClass!: PlanetClass | null;

  @Column({ type: 'float', name: 'position_x' })
  positionX!: number;

  @Column({ type: 'float', name: 'position_y' })
  positionY!: number;

  @Column({ type: 'float', name: 'position_z' })
  positionZ!: number;

  @Column({ type: 'varchar', length: 7, name: 'color_hex' })
  colorHex!: string;

  @Column({ type: 'int', default: 0 })
  likes!: number;

  @Column({ type: 'float', name: 'base_size' })
  baseSize!: number;

  @Column({ type: 'varchar', length: 10 })
  language!: string;

  @Column({ type: 'varchar', length: 64, name: 'ip_hash' })
  ipHash!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Like, (like) => like.body)
  likesHistory!: Like[];
}
