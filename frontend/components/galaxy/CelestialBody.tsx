'use client';

import { Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { JSX, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PointLight,
  Points,
  PointsMaterial,
} from 'three';
import { getVisualProfile, hashStringToUnit } from '@/lib/astronomy';
import { useCelestialBody } from '@/hooks/useCelestialBody';
import type { CelestialBodyData, Position3D } from '@/lib/types';

type CelestialBodyProps = {
  body: CelestialBodyData;
  selected: boolean;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  offset?: Position3D;
};

export default function CelestialBody({
  body,
  selected,
  hovered,
  onHover,
  onSelect,
  offset,
}: CelestialBodyProps): JSX.Element {
  const profile = useMemo(() => getVisualProfile(body), [body]);
  const baseMaterialRef = useRef<MeshStandardMaterial | MeshPhysicalMaterial | null>(null);
  const glowMaterialRef = useRef<MeshBasicMaterial | null>(null);
  const spawnPointsRef = useRef<Points | null>(null);
  const spawnPointsMaterialRef = useRef<PointsMaterial | null>(null);
  const spawnLightRef = useRef<PointLight | null>(null);
  const rippleRef = useRef<Mesh | null>(null);
  const rippleMaterialRef = useRef<MeshBasicMaterial | null>(null);
  const atmosphereMaterialRef = useRef<MeshBasicMaterial | null>(null);
  const { groupRef, hoverRingRef, metricsRef } = useCelestialBody({
    id: body.id,
    position: body.position,
    size: body.size,
    hovered,
    selected,
    spawnedAt: body.spawnedAt,
    updatedAt: body.updatedAt,
    supernovaAt: body.supernovaAt,
    offset,
  });

  const burstSeeds = useMemo(() => {
    return Array.from({ length: 20 }, (_, index) => {
      const seed = hashStringToUnit(`${body.id}-${index}`) * Math.PI * 2;
      const lift = hashStringToUnit(`${body.id}-lift-${index}`) * 2 - 1;
      const radius = 0.6 + hashStringToUnit(`${body.id}-radius-${index}`) * 1.2;
      return [Math.cos(seed) * radius, lift, Math.sin(seed) * radius] as const;
    });
  }, [body.id]);

  useFrame(() => {
    const metrics = metricsRef.current;
    const supernovaAge = metrics.supernovaAge;
    const spawnProgress = metrics.spawnProgress;
    const likePulse = metrics.likePulse;

    if (spawnPointsRef.current) {
      spawnPointsRef.current.visible = spawnProgress < 1;
      spawnPointsRef.current.scale.setScalar(0.2 + spawnProgress * 4);
    }

    if (spawnPointsMaterialRef.current) {
      spawnPointsMaterialRef.current.opacity = Math.max(0, 1 - spawnProgress);
    }

    if (spawnLightRef.current) {
      const spawnGlow = Math.max(0, 3 * (1 - Math.min(1, spawnProgress)));
      const supernovaGlow = Number.isFinite(supernovaAge)
        ? supernovaAge < 800
          ? 8 - Math.min(6, supernovaAge / 160)
          : 2.6 + Math.sin(Date.now() / 180) * 0.35
        : 0;
      spawnLightRef.current.intensity = Math.max(0, spawnGlow + supernovaGlow);
    }

    if (rippleRef.current && rippleMaterialRef.current) {
      rippleRef.current.visible = likePulse > 0.01;
      rippleRef.current.scale.setScalar(1 + (1 - likePulse) * 3.5);
      rippleMaterialRef.current.opacity = likePulse * 0.55;
    }

    if (atmosphereMaterialRef.current) {
      atmosphereMaterialRef.current.opacity = profile.kind === 'ocean_planet' ? 0.22 + likePulse * 0.18 : 0.12 + likePulse * 0.08;
    }

    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity = hovered || selected ? 0.9 : 0.28;
    }

    if (baseMaterialRef.current) {
      if (Number.isFinite(supernovaAge) && supernovaAge >= 800) {
        baseMaterialRef.current.color = new Color('#050505');
        baseMaterialRef.current.emissive = new Color('#050505');
        baseMaterialRef.current.emissiveIntensity = 0.4;
      } else if (profile.kind === 'main_star' || profile.kind === 'neutron_star') {
        baseMaterialRef.current.color = new Color(profile.color);
        baseMaterialRef.current.emissive = new Color(profile.color);
        baseMaterialRef.current.emissiveIntensity = profile.kind === 'neutron_star' ? 2.6 : 1.7;
      } else {
        baseMaterialRef.current.color = new Color(profile.color);
      }

      baseMaterialRef.current.transparent = true;
      baseMaterialRef.current.opacity = Math.max(0.45, spawnProgress);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group
        ref={groupRef}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(body.id);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onHover(null);
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(body.id);
        }}
      >
        <mesh castShadow receiveShadow>
          {profile.kind === 'asteroid' ? (
            <dodecahedronGeometry args={[1, 0]} />
          ) : (
            <sphereGeometry args={[1, 32, 32]} />
          )}
          {profile.kind === 'main_star' || profile.kind === 'neutron_star' ? (
            <meshStandardMaterial ref={baseMaterialRef} color={profile.color} emissive={profile.color} emissiveIntensity={1.6} />
          ) : (
            <meshPhysicalMaterial
              ref={baseMaterialRef}
              color={profile.color}
              roughness={profile.kind === 'asteroid' ? 0.95 : 0.6}
              metalness={profile.kind === 'asteroid' ? 0.04 : 0.1}
              clearcoat={profile.kind === 'ocean_planet' ? 0.24 : 0.08}
              reflectivity={0.3}
              flatShading={profile.kind === 'asteroid'}
            />
          )}
        </mesh>

        {profile.kind !== 'asteroid' ? (
          <mesh scale={1.12}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial
              ref={atmosphereMaterialRef}
              color={profile.kind === 'ocean_planet' ? '#7dd3fc' : profile.color}
              transparent
              opacity={0.14}
              blending={AdditiveBlending}
            />
          </mesh>
        ) : null}

        {profile.ringed ? (
          <mesh rotation={[Math.PI / 12, 0, 0]}>
            <ringGeometry args={[1.45, 2.25, 64]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.52} side={2} />
          </mesh>
        ) : null}

        <mesh ref={hoverRingRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <torusGeometry args={[1.75, 0.06, 16, 80]} />
          <meshBasicMaterial
            ref={glowMaterialRef}
            color={profile.color}
            transparent
            opacity={0.3}
            blending={AdditiveBlending}
          />
        </mesh>

        <mesh ref={rippleRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <torusGeometry args={[1.3, 0.05, 12, 80]} />
          <meshBasicMaterial
            ref={rippleMaterialRef}
            color={profile.color}
            transparent
            opacity={0}
            blending={AdditiveBlending}
          />
        </mesh>

        <points ref={spawnPointsRef} visible={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array(burstSeeds.flat()),
                3,
              ]}
            />
          </bufferGeometry>
          <pointsMaterial
            ref={spawnPointsMaterialRef}
            color={profile.color}
            size={0.22}
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </points>

        <pointLight ref={spawnLightRef} color={profile.color} intensity={0} distance={18} />
      </group>
    </Float>
  );
}
