'use client';

import { useEffect, useMemo } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  PointsMaterial,
} from 'three';
import type { Position3D } from '@/lib/types';

type Cluster = {
  center: Position3D;
  members: Position3D[];
};

type NebulaCloudProps = {
  clusters: Cluster[];
};

export default function NebulaCloud({ clusters }: NebulaCloudProps): JSX.Element | null {
  const { geometry, material } = useMemo(() => {
    const points: number[] = [];

    for (const cluster of clusters) {
      for (let index = 0; index < 40; index += 1) {
        const angle = (index / 40) * Math.PI * 2;
        const radius = 2 + (index % 7) * 0.45;
        points.push(
          cluster.center.x + Math.cos(angle) * radius,
          cluster.center.y + (Math.random() - 0.5) * 2.2,
          cluster.center.z + Math.sin(angle) * radius,
        );
      }
    }

    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute('position', new BufferAttribute(new Float32Array(points), 3));
    const nextMaterial = new PointsMaterial({
      size: 1.1,
      color: '#8b5cf6',
      transparent: true,
      opacity: 0.12,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    return {
      geometry: nextGeometry,
      material: nextMaterial,
    };
  }, [clusters]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  if (clusters.length === 0) {
    return null;
  }

  return <points geometry={geometry} material={material} />;
}
