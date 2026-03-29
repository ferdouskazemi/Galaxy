import { io, type Socket } from 'socket.io-client';

let socketSingleton: Socket | null = null;
let currentUrl = '';

export function getSocket(url: string): Socket {
  if (!socketSingleton || currentUrl !== url) {
    if (socketSingleton) {
      socketSingleton.disconnect();
    }

    currentUrl = url;
    socketSingleton = io(url, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 10000,
      withCredentials: true,
    });
  }

  return socketSingleton;
}
