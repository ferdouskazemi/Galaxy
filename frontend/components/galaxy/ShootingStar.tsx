'use client';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { JSX, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Mesh,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from 'three';
import type { CelestialBodyData } from '@/lib/types';

type ShootingStarProps = {
  bodies: CelestialBodyData[];
};

function easeInOut(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export default function ShootingStar({ bodies }: ShootingStarProps): JSX.Element | null {
  const cometRef = useRef<Mesh | null>(null);
  const [labelIndex, setLabelIndex] = useState(0);
  const segmentIndexRef = useRef(0);
  const segmentProgressRef = useRef(0);
  const pauseRef = useRef(0);
  const position = useMemo(() => new Vector3(), []);

  const pathPoints = useMemo(() => {
    if (bodies.length === 0) {
      return [];
    }

    const start = new Vector3(-140, 45, -120);
    const middle = bodies.map(
      (body, index) =>
        new Vector3(
          body.position.x,
          body.position.y + 6 + index * 2,
          body.position.z,
        ),
    );
    const end = new Vector3(140, 28, 120);
    return [start, ...middle, end];
  }, [bodies]);

  const { curve, trailGeometry, trailMaterial } = useMemo(() => {
    if (pathPoints.length < 2) {
      return {
        curve: null,
        trailGeometry: null,
        trailMaterial: null,
      };
    }

    const nextCurve = new CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.25);
    return {
      curve: nextCurve,
      trailGeometry: new TubeGeometry(nextCurve, 160, 0.18, 8, false),
      trailMaterial: new MeshBasicMaterial({
        color: '#fff4b5',
        transparent: true,
        opacity: 0.34,
        blending: AdditiveBlending,
      }),
    };
  }, [pathPoints]);

  useEffect(() => {
    return () => {
      trailGeometry?.dispose();
      trailMaterial?.dispose();
    };
  }, [trailGeometry, trailMaterial]);

  useFrame((_, delta) => {
    if (!cometRef.current || pathPoints.length < 2) {
      return;
    }

    if (pauseRef.current > 0) {
      pauseRef.current -= delta;
      return;
    }

    const currentPoint = pathPoints[segmentIndexRef.current];
    const nextPoint = pathPoints[Math.min(pathPoints.length - 1, segmentIndexRef.current + 1)];
    segmentProgressRef.current += delta * 0.34;

    if (segmentProgressRef.current >= 1) {
      segmentProgressRef.current = 0;
      segmentIndexRef.current += 1;

      if (segmentIndexRef.current >= pathPoints.length - 1) {
        segmentIndexRef.current = 0;
        setLabelIndex(0);
        pauseRef.current = 1.5;
        return;
      }

      if (segmentIndexRef.current <= bodies.length) {
        setLabelIndex(Math.max(0, segmentIndexRef.current - 1));
        pauseRef.current = 0.8;
      }
    }

    position.lerpVectors(currentPoint, nextPoint, easeInOut(segmentProgressRef.current));
    cometRef.current.position.copy(position);
  });

  if (bodies.length === 0 || !curve || !trailGeometry || !trailMaterial) {
    return null;
  }

  return (
    <group>
      <mesh geometry={trailGeometry} material={trailMaterial} />
      <mesh ref={cometRef}>
        <sphereGeometry args={[0.6, 18, 18]} />
        <meshBasicMaterial color="#fff8dc" />
        <pointLight color="#fde68a" intensity={1.8} distance={20} />
      </mesh>
      {bodies[labelIndex] ? (
        <Html position={[bodies[labelIndex].position.x, bodies[labelIndex].position.y + 5, bodies[labelIndex].position.z]} center distanceFactor={14}>
          <div className="rounded-full border border-nova/40 bg-black/60 px-3 py-1 text-xs text-star shadow-glow backdrop-blur-sm">
            ? Featured
          </div>
        </Html>
      ) : null}
    </group>
  );
}
