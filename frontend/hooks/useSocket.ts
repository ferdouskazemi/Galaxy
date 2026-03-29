'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import type {
  BodyUpdatePayload,
  CelestialBodyData,
  ShootingStarPayload,
  SupernovaPayload,
  ViewerCountPayload,
} from '@/lib/types';
import { useGalaxyStore } from './useGalaxy';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

export function useSocket(): void {
  const handleNewBody = useGalaxyStore((state) => state.handleNewBody);
  const handleBodyUpdated = useGalaxyStore((state) => state.handleBodyUpdated);
  const handleSupernova = useGalaxyStore((state) => state.handleSupernova);
  const setViewerCount = useGalaxyStore((state) => state.setViewerCount);
  const setFeaturedBodies = useGalaxyStore((state) => state.setFeaturedBodies);
  const setConnectionState = useGalaxyStore((state) => state.setConnectionState);

  useEffect(() => {
    const socket = getSocket(WS_URL);

    const onConnect = () => setConnectionState('connected');
    const onDisconnect = () => setConnectionState('reconnecting');
    const onReconnectAttempt = () => setConnectionState('reconnecting');
    const onReconnect = () => setConnectionState('connected');
    const onConnectError = () => setConnectionState('reconnecting');
    const onViewerCount = (payload: ViewerCountPayload) => {
      setViewerCount(payload.count);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('new_body', handleNewBody as (body: CelestialBodyData) => void);
    socket.on(
      'body_updated',
      handleBodyUpdated as (payload: BodyUpdatePayload) => void,
    );
    socket.on(
      'supernova',
      handleSupernova as (payload: SupernovaPayload) => void,
    );
    socket.on('viewer_count', onViewerCount as (payload: ViewerCountPayload) => void);
    socket.on(
      'shooting_star',
      setFeaturedBodies as (payload: ShootingStarPayload) => void,
    );
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);

    setConnectionState(socket.connected ? 'connected' : 'connecting');
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('new_body', handleNewBody as (body: CelestialBodyData) => void);
      socket.off(
        'body_updated',
        handleBodyUpdated as (payload: BodyUpdatePayload) => void,
      );
      socket.off(
        'supernova',
        handleSupernova as (payload: SupernovaPayload) => void,
      );
      socket.off('viewer_count', onViewerCount as (payload: ViewerCountPayload) => void);
      socket.off(
        'shooting_star',
        setFeaturedBodies as (payload: ShootingStarPayload) => void,
      );
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onReconnect);
      socket.disconnect();
    };
  }, [
    handleBodyUpdated,
    handleNewBody,
    handleSupernova,
    setConnectionState,
    setFeaturedBodies,
    setViewerCount,
  ]);
}
