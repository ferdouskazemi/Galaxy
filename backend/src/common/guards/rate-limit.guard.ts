import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitGuard {
  constructor(private readonly redisService: RedisService) {}

  async consumeOrThrow(options: {
    scope: 'message' | 'like';
    key: string;
    limit: number;
    ttlSeconds: number;
  }): Promise<void> {
    const redisKey = `galaxy:rate:${options.scope}:${options.key}`;
    const count = await this.redisService.incrementWithExpiry(
      redisKey,
      options.ttlSeconds,
    );

    if (count <= options.limit) {
      return;
    }

    const retryAfter = await this.redisService.getTtl(redisKey);
    throw new HttpException(
      {
        message: `Too many ${options.scope} requests`,
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
