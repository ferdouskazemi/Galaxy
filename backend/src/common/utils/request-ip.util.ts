import type { Request } from 'express';
import type { Socket } from 'socket.io';

function normalizeIp(ipAddress: string | undefined): string {
  if (!ipAddress) {
    return '0.0.0.0';
  }

  return ipAddress.replace('::ffff:', '');
}

export function extractIpFromRequest(request: Request): string {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return normalizeIp(forwardedFor.split(',')[0]?.trim());
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return normalizeIp(forwardedFor[0]);
  }

  return normalizeIp(request.ip ?? request.socket.remoteAddress);
}

export function extractIpFromSocket(client: Socket): string {
  const forwardedFor = client.handshake.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return normalizeIp(forwardedFor.split(',')[0]?.trim());
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return normalizeIp(forwardedFor[0]);
  }

  return normalizeIp(client.handshake.address);
}
