import { createHash } from 'crypto';

export function hashIp(ipAddress: string): string {
  return createHash('sha256').update(ipAddress).digest('hex');
}

