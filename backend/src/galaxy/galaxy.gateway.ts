import {
  BadRequestException,
  forwardRef,
  Inject,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { extractIpFromSocket } from '../common/utils/request-ip.util';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { LikeBodyDto } from '../messages/dto/like-body.dto';
import { MessagesService } from '../messages/messages.service';
import { GalaxyService } from './galaxy.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class GalaxyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly galaxyService: GalaxyService,
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
  ) {}

  afterInit(server: Server): void {
    this.galaxyService.registerServer(server);
  }

  async handleConnection(client: Socket): Promise<void> {
    await this.galaxyService.handleViewerConnected(client.id);
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.galaxyService.handleViewerDisconnected(client.id);
  }

  @SubscribeMessage('post_message')
  async handlePostMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<unknown> {
    return this.messagesService.create(dto, extractIpFromSocket(client));
  }

  @SubscribeMessage('like_body')
  async handleLikeBody(
    @MessageBody() dto: LikeBodyDto,
    @ConnectedSocket() client: Socket,
  ): Promise<unknown> {
    if (!dto.bodyId) {
      throw new BadRequestException('bodyId is required');
    }

    return this.messagesService.likeBody(dto.bodyId, extractIpFromSocket(client));
  }
}


