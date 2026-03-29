import { IsUUID } from 'class-validator';

export class LikeBodyDto {
  @IsUUID()
  bodyId!: string;
}
