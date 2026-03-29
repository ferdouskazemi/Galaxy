import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { GalaxyModule } from '../galaxy/galaxy.module';
import { CelestialBody } from './entities/celestial-body.entity';
import { Like } from './entities/like.entity';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CelestialBody, Like]),
    forwardRef(() => GalaxyModule),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, RateLimitGuard],
  exports: [MessagesService, TypeOrmModule],
})
export class MessagesModule {}
