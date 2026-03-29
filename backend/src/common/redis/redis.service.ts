import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type RedisHandler = (payload: string) => void;

type RateEntry = {
  count: number;
  expiresAt: number;
};

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly commandClient: Redis;
  private readonly publisherClient: Redis;
  private readonly subscriberClient: Redis;
  private readonly handlers = new Map<string, Set<RedisHandler>>();
  private readonly memoryCounters = new Map<string, RateEntry>();
  private readonly memorySets = new Map<string, Set<string>>();
  private connectPromise?: Promise<void>;
  private fallbackToMemory = false;

  constructor(private readonly configService: ConfigService) {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const options = {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    } as const;

    this.commandClient = new Redis(redisUrl, options);
    this.publisherClient = new Redis(redisUrl, options);
    this.subscriberClient = new Redis(redisUrl, options);

    this.subscriberClient.on('message', (channel, payload) => {
      this.dispatch(channel, payload);
    });
  }

  async ensureConnected(): Promise<void> {
    if (this.fallbackToMemory) {
      return;
    }

    if (!this.connectPromise) {
      this.connectPromise = Promise.all([
        this.commandClient.connect(),
        this.publisherClient.connect(),
        this.subscriberClient.connect(),
      ])
        .then(() => undefined)
        .catch((error: unknown) => {
          this.logger.warn(
            'Redis is unavailable; falling back to in-memory mode for local runtime.',
          );
          this.fallbackToMemory = true;
          this.connectPromise = Promise.resolve();
          void Promise.allSettled([
            this.commandClient.quit(),
            this.publisherClient.quit(),
            this.subscriberClient.quit(),
          ]);
          if (error instanceof Error) {
            this.logger.debug(error.message);
          }
          return undefined;
        });
    }

    await this.connectPromise;
  }

  async incrementWithExpiry(key: string, ttlSeconds: number): Promise<number> {
    await this.ensureConnected();

    if (this.fallbackToMemory) {
      const now = Date.now();
      const current = this.memoryCounters.get(key);
      if (!current || current.expiresAt <= now) {
        this.memoryCounters.set(key, {
          count: 1,
          expiresAt: now + ttlSeconds * 1000,
        });
        return 1;
      }

      current.count += 1;
      return current.count;
    }

    const multi = this.commandClient.multi();
    multi.incr(key);
    multi.expire(key, ttlSeconds, 'NX');
    const results = await multi.exec();
    const rawCount = results?.[0]?.[1];
    return typeof rawCount === 'number' ? rawCount : Number(rawCount ?? 0);
  }

  async getTtl(key: string): Promise<number> {
    await this.ensureConnected();

    if (this.fallbackToMemory) {
      const current = this.memoryCounters.get(key);
      if (!current) {
        return 0;
      }

      const ttl = Math.ceil((current.expiresAt - Date.now()) / 1000);
      if (ttl <= 0) {
        this.memoryCounters.delete(key);
        return 0;
      }

      return ttl;
    }

    const ttl = await this.commandClient.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  async publish<T>(channel: string, payload: T): Promise<void> {
    await this.ensureConnected();
    const serialized = JSON.stringify(payload);

    if (this.fallbackToMemory) {
      this.dispatch(channel, serialized);
      return;
    }

    await this.publisherClient.publish(channel, serialized);
  }

  async subscribe<T>(
    channel: string,
    handler: (payload: T) => void,
  ): Promise<void> {
    await this.ensureConnected();

    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      if (!this.fallbackToMemory) {
        await this.subscriberClient.subscribe(channel);
      }
    }

    this.handlers.get(channel)?.add((payload) => {
      handler(JSON.parse(payload) as T);
    });
  }

  async addToSet(key: string, value: string): Promise<number> {
    await this.ensureConnected();

    if (this.fallbackToMemory) {
      const set = this.memorySets.get(key) ?? new Set<string>();
      set.add(value);
      this.memorySets.set(key, set);
      return set.size;
    }

    await this.commandClient.sadd(key, value);
    return this.commandClient.scard(key);
  }

  async removeFromSet(key: string, value: string): Promise<number> {
    await this.ensureConnected();

    if (this.fallbackToMemory) {
      const set = this.memorySets.get(key);
      if (!set) {
        return 0;
      }

      set.delete(value);
      if (set.size === 0) {
        this.memorySets.delete(key);
        return 0;
      }

      return set.size;
    }

    await this.commandClient.srem(key, value);
    return this.commandClient.scard(key);
  }

  private dispatch(channel: string, payload: string): void {
    const channelHandlers = this.handlers.get(channel);
    if (!channelHandlers) {
      return;
    }

    for (const handler of channelHandlers) {
      handler(payload);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([
      this.commandClient.quit(),
      this.publisherClient.quit(),
      this.subscriberClient.quit(),
    ]);
  }
}
