import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { extractIpFromRequest } from '../common/utils/request-ip.util';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages.query';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async create(
    @Body() dto: CreateMessageDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.messagesService.create(dto, extractIpFromRequest(request));
  }

  @Get()
  async findAll(@Query() query: GetMessagesQueryDto): Promise<unknown> {
    return this.messagesService.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<unknown> {
    return this.messagesService.findOne(id);
  }

  @Post(':id/like')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async like(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.messagesService.likeBody(id, extractIpFromRequest(request));
  }
}
