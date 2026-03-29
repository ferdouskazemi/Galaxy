'use client';

import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils, Mesh, Vector3 } from 'three';
import { hashStringToUnit } from '@/lib/astronomy';
import type { Position3D } from '@/lib/types';

type UseCelestialBodyOptions = {
  id: string;
  position: Position3D;
  size: number;
  hovered: boolean;
  selected: boolean;
  spawnedAt?: number;
  updatedAt?: number;
  supernovaAt?: number;
  offset?: Position3D;
};

export function useCelestialBody(options: UseCelestialBodyOptions): {
  groupRef: MutableRefObject<Group | null>;
  hoverRingRef: MutableRefObject<Mesh | null>;
  metricsRef: MutableRefObject<{
    spawnProgress: number;
    likePulse: number;
    supernovaAge: number;
  }>;
} {
  const groupRef = useRef<Group | null>(null);
  const hoverRingRef = useRef<Mesh | null>(null);
  const metricsRef = useRef({
    spawnProgress: 1,
    likePulse: 0,
    supernovaAge: Number.POSITIVE_INFINITY,
  });
  const currentScale = useRef(Math.max(options.size, 0.001));
  const targetScale = useRef(Math.max(options.size, 0.001));
  const targetPosition = useMemo(() => new Vector3(), []);
  const ringScale = useRef(1);
  const spinSpeed = useMemo(
    () => 0.14 + hashStringToUnit(options.id) * 0.35,
    [options.id],
  );

  useEffect(() => {
    targetScale.current = Math.max(options.size, 0.001);
  }, [options.size]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const now = Date.now();
    const offset = options.offset ?? { x: 0, y: 0, z: 0 };
    targetPosition.set(
      options.position.x + offset.x,
      options.position.y + offset.y,
      options.position.z + offset.z,
    );
    group.position.lerp(targetPosition, 0.1);
    group.rotation.y += spinSpeed * delta;

    const spawnProgress = options.spawnedAt
      ? Math.min(1, Math.max(0, (now - options.spawnedAt) / 1200))
      : 1;
    const likeAge = options.updatedAt ? now - options.updatedAt : Number.POSITIVE_INFINITY;
    const likePulse = likeAge < 800 ? 1 - likeAge / 800 : 0;
    const supernovaAge = options.supernovaAt
      ? now - options.supernovaAt
      : Number.POSITIVE_INFINITY;

    metricsRef.current.spawnProgress = spawnProgress;
    metricsRef.current.likePulse = likePulse;
    metricsRef.current.supernovaAge = supernovaAge;

    let desiredScale = targetScale.current * (options.hovered ? 1.3 : 1);

    if (supernovaAge < 500) {
      desiredScale = MathUtils.lerp(targetScale.current, targetScale.current * 8, supernovaAge / 500);
    } else if (supernovaAge < 800) {
      desiredScale = MathUtils.lerp(targetScale.current * 8, targetScale.current * 0.3, (supernovaAge - 500) / 300);
    } else if (Number.isFinite(supernovaAge)) {
      desiredScale = targetScale.current * (0.32 + Math.sin(now / 180) * 0.04);
    }

    currentScale.current = MathUtils.lerp(
      currentScale.current,
      desiredScale,
      likeAge < 900 ? 0.16 : 0.1,
    );

    const spawnScale = MathUtils.smoothstep(spawnProgress, 0, 1);
    const pulseScale = options.spawnedAt && now - options.spawnedAt < 1400
      ? 1 + Math.sin((spawnProgress + 0.15) * Math.PI) * 0.18
      : 1 + likePulse * 0.12;

    group.scale.setScalar(Math.max(0.001, currentScale.current * spawnScale * pulseScale));

    if (hoverRingRef.current) {
      ringScale.current = MathUtils.lerp(
        ringScale.current,
        options.hovered || options.selected ? 1.1 : 0.7,
        0.14,
      );
      hoverRingRef.current.visible = options.hovered || options.selected;
      hoverRingRef.current.scale.setScalar(ringScale.current);
    }
  });

  return {
    groupRef,
    hoverRingRef,
    metricsRef,
  };
}
