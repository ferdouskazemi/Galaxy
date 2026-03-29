import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from '../messages/entities/like.entity';
import { MessagesModule } from '../messages/messages.module';
import { GalaxyGateway } from './galaxy.gateway';
import { GalaxyService } from './galaxy.service';

@Module({
  imports: [TypeOrmModule.forFeature([Like]), forwardRef(() => MessagesModule)],
  providers: [GalaxyGateway, GalaxyService],
  exports: [GalaxyService],
})
export class GalaxyModule {}
