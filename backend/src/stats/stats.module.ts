import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CelestialBody } from '../messages/entities/celestial-body.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([CelestialBody])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
