import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Server } from 'socket.io';
import { Repository } from 'typeorm';
import { RedisService } from '../common/redis/redis.service';
import { Like } from '../messages/entities/like.entity';

type GalaxyEventMap = {
  new_body: Record<string, unknown>;
  body_updated: Record<string, unknown>;
  supernova: Record<string, unknown>;
  viewer_count: { count: number };
  shooting_star: { bodies: unknown[] };
};

type RedisEnvelope<K extends keyof GalaxyEventMap> = {
  event: K;
  payload: GalaxyEventMap[K];
};

@Injectable()
export class GalaxyService implements OnModuleInit, OnModuleDestroy {
  private readonly redisChannel = 'galaxy:events';
  private readonly viewersKey = 'galaxy:viewers';
  private shootingStarInterval?: NodeJS.Timeout;
  private server?: Server;

  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.redisService.subscribe<RedisEnvelope<keyof GalaxyEventMap>>(
      this.redisChannel,
      ({ event, payload }) => {
        this.server?.emit(event, payload);
      },
    );

    this.shootingStarInterval = setInterval(() => {
      void this.broadcastShootingStars();
    }, 45000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.shootingStarInterval) {
      clearInterval(this.shootingStarInterval);
    }
  }

  registerServer(server: Server): void {
    this.server = server;
  }

  async handleViewerConnected(socketId: string): Promise<void> {
    const count = await this.redisService.addToSet(this.viewersKey, socketId);
    await this.emitViewerCount(count);
  }

  async handleViewerDisconnected(socketId: string): Promise<void> {
    const count = await this.redisService.removeFromSet(this.viewersKey, socketId);
    await this.emitViewerCount(count);
  }

  async emitNewBody(payload: GalaxyEventMap['new_body']): Promise<void> {
    await this.publish('new_body', payload);
  }

  async emitBodyUpdated(payload: GalaxyEventMap['body_updated']): Promise<void> {
    await this.publish('body_updated', payload);
  }

  async emitSupernova(payload: GalaxyEventMap['supernova']): Promise<void> {
    await this.publish('supernova', payload);
  }

  async emitViewerCount(count: number): Promise<void> {
    await this.publish('viewer_count', { count });
  }

  async emitShootingStar(payload: GalaxyEventMap['shooting_star']): Promise<void> {
    await this.publish('shooting_star', payload);
  }

  private async publish<K extends keyof GalaxyEventMap>(
    event: K,
    payload: GalaxyEventMap[K],
  ): Promise<void> {
    await this.redisService.publish<RedisEnvelope<K>>(this.redisChannel, {
      event,
      payload,
    });
  }

  private async broadcastShootingStars(): Promise<void> {
    const bodies = await this.likesRepository
      .createQueryBuilder('like')
      .innerJoin('like.body', 'body')
      .where("like.created_at >= NOW() - INTERVAL '1 hour'")
      .select('body.id', 'id')
      .addSelect('body.message', 'message')
      .addSelect('body.bodyType', 'bodyType')
      .addSelect('body.planetClass', 'planetClass')
      .addSelect('body.positionX', 'positionX')
      .addSelect('body.positionY', 'positionY')
      .addSelect('body.positionZ', 'positionZ')
      .addSelect('body.colorHex', 'colorHex')
      .addSelect('body.likes', 'likes')
      .addSelect('COUNT(like.id)', 'recentLikes')
      .groupBy('body.id')
      .addGroupBy('body.message')
      .addGroupBy('body.bodyType')
      .addGroupBy('body.planetClass')
      .addGroupBy('body.positionX')
      .addGroupBy('body.positionY')
      .addGroupBy('body.positionZ')
      .addGroupBy('body.colorHex')
      .addGroupBy('body.likes')
      .orderBy('recentLikes', 'DESC')
      .addOrderBy('body.likes', 'DESC')
      .limit(3)
      .getRawMany<{
        id: string;
        message: string;
        bodyType: string;
        planetClass: string | null;
        positionX: string;
        positionY: string;
        positionZ: string;
        colorHex: string;
        likes: string;
      }>();

    if (bodies.length === 0) {
      return;
    }

    await this.emitShootingStar({
      bodies: bodies.map((body) => ({
        id: body.id,
        message: body.message,
        type: body.bodyType,
        bodyType: body.bodyType,
        planetClass: body.planetClass,
        position: {
          x: Number(body.positionX),
          y: Number(body.positionY),
          z: Number(body.positionZ),
        },
        color: body.colorHex,
        likes: Number(body.likes),
      })),
    });
  }
}
