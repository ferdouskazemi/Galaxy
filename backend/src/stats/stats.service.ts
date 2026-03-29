import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CelestialBody } from '../messages/entities/celestial-body.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(CelestialBody)
    private readonly bodiesRepository: Repository<CelestialBody>,
  ) {}

  async getStats(): Promise<{
    total_bodies: number;
    total_likes: number;
    top_body: {
      id: string;
      message: string;
      likes: number;
      color: string;
      type: string;
    } | null;
    galaxy_age_days: number;
  }> {
    const [totalBodies, likesResult, topBody, firstBody] = await Promise.all([
      this.bodiesRepository.count(),
      this.bodiesRepository
        .createQueryBuilder('body')
        .select('COALESCE(SUM(body.likes), 0)', 'totalLikes')
        .getRawOne<{ totalLikes: string }>(),
      this.bodiesRepository.findOne({
        order: { likes: 'DESC', createdAt: 'ASC' },
      }),
      this.bodiesRepository.findOne({
        order: { createdAt: 'ASC' },
      }),
    ]);

    const galaxyAgeDays = firstBody
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(firstBody.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    return {
      total_bodies: totalBodies,
      total_likes: Number(likesResult?.totalLikes ?? 0),
      top_body: topBody
        ? {
            id: topBody.id,
            message: topBody.message,
            likes: topBody.likes,
            color: topBody.colorHex,
            type: topBody.bodyType,
          }
        : null,
      galaxy_age_days: galaxyAgeDays,
    };
  }
}
