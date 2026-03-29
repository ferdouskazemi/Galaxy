import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import sanitizeHtml from 'sanitize-html';
import { QueryFailedError, Repository } from 'typeorm';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import {
  calculateBodySize,
  classifyBody,
  getBaseSize,
} from '../common/utils/classify.util';
import { hashIp } from '../common/utils/hash-ip.util';
import { detectLanguage } from '../common/utils/language.util';
import { generateGalaxyPosition } from '../common/utils/position.util';
import { GalaxyService } from '../galaxy/galaxy.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages.query';
import { BodyType, CelestialBody } from './entities/celestial-body.entity';
import { Like } from './entities/like.entity';

export type SerializedBody = {
  id: string;
  type: BodyType;
  bodyType: BodyType;
  planetClass: CelestialBody['planetClass'];
  position: { x: number; y: number; z: number };
  color: string;
  colorHex: string;
  size: number;
  baseSize: number;
  message: string;
  likes: number;
  language: string;
  createdAt: string;
};

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(CelestialBody)
    private readonly bodiesRepository: Repository<CelestialBody>,
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
    private readonly rateLimitGuard: RateLimitGuard,
    @Inject(forwardRef(() => GalaxyService))
    private readonly galaxyService: GalaxyService,
  ) {}

  async create(dto: CreateMessageDto, rawIp: string): Promise<SerializedBody> {
    const message = sanitizeHtml(dto.message, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    if (message.length < 3) {
      throw new BadRequestException('Message must contain at least 3 characters');
    }

    const ipHash = hashIp(rawIp);
    await this.rateLimitGuard.consumeOrThrow({
      scope: 'message',
      key: ipHash,
      limit: 1,
      ttlSeconds: 60,
    });

    const index = (await this.bodiesRepository.count()) + 1;
    const position = generateGalaxyPosition(index);
    const classification = classifyBody(message, 0);

    const body = this.bodiesRepository.create({
      message,
      bodyType: classification.type,
      planetClass: classification.planetClass,
      positionX: position.x,
      positionY: position.y,
      positionZ: position.z,
      colorHex: classification.color,
      likes: 0,
      baseSize: getBaseSize(classification.type),
      language: detectLanguage(message),
      ipHash,
    });

    const savedBody = await this.bodiesRepository.save(body);
    const serialized = this.serializeBody(savedBody);
    await this.galaxyService.emitNewBody(serialized);
    return serialized;
  }

  async findAll(query: GetMessagesQueryDto): Promise<{
    data: SerializedBody[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const [bodies, total] = await this.bodiesRepository.findAndCount({
      order:
        query.sort === 'likes'
          ? { likes: 'DESC', createdAt: 'DESC' }
          : { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data: bodies.map((body) => this.serializeBody(body)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async findOne(id: string): Promise<SerializedBody> {
    const body = await this.bodiesRepository.findOne({ where: { id } });
    if (!body) {
      throw new NotFoundException('Celestial body not found');
    }

    return this.serializeBody(body);
  }

  async likeBody(id: string, rawIp: string): Promise<SerializedBody> {
    const ipHash = hashIp(rawIp);
    await this.rateLimitGuard.consumeOrThrow({
      scope: 'like',
      key: ipHash,
      limit: 10,
      ttlSeconds: 60,
    });

    const body = await this.bodiesRepository.findOne({ where: { id } });
    if (!body) {
      throw new NotFoundException('Celestial body not found');
    }

    try {
      await this.likesRepository.save(
        this.likesRepository.create({
          body,
          ipHash,
        }),
      );
    } catch (error) {
      const driverError = error as QueryFailedError & {
        driverError?: { constraint?: string };
      };

      if (driverError.driverError?.constraint === 'UQ_body_ip_hash') {
        throw new ConflictException('You already liked this celestial body');
      }

      throw error;
    }

    const previousLikes = body.likes;
    body.likes += 1;

    const classification = classifyBody(body.message, body.likes);
    body.bodyType = classification.type;
    body.planetClass = classification.planetClass;
    body.colorHex = classification.color;
    body.baseSize = getBaseSize(classification.type);

    const savedBody = await this.bodiesRepository.save(body);
    const serialized = this.serializeBody(savedBody);

    await this.galaxyService.emitBodyUpdated({
      id: serialized.id,
      likes: serialized.likes,
      newSize: serialized.size,
      previousLikes,
      type: serialized.type,
      color: serialized.color,
    });

    if (serialized.likes >= 1000) {
      await this.galaxyService.emitSupernova({
        id: serialized.id,
        position: serialized.position,
      });
    }

    return serialized;
  }

  private serializeBody(body: CelestialBody): SerializedBody {
    const size = calculateBodySize(body.message, body.likes, body.bodyType);

    return {
      id: body.id,
      type: body.bodyType,
      bodyType: body.bodyType,
      planetClass: body.planetClass,
      position: {
        x: body.positionX,
        y: body.positionY,
        z: body.positionZ,
      },
      color: body.colorHex,
      colorHex: body.colorHex,
      size,
      baseSize: body.baseSize,
      message: body.message,
      likes: body.likes,
      language: body.language,
      createdAt: body.createdAt.toISOString(),
    };
  }
}


