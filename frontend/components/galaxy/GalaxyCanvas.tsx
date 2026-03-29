'use client';

import { OrbitControls, Stars } from '@react-three/drei';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  DoubleSide,
  InstancedMesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  Vector3,
} from 'three';
import { getVisualProfile } from '@/lib/astronomy';
import { useGalaxyStore } from '@/hooks/useGalaxy';
import type { CelestialBodyData, Position3D } from '@/lib/types';
import CelestialBody from './CelestialBody';
import GalaxyCore from './GalaxyCore';
import NebulaCloud from './NebulaCloud';
import ShootingStar from './ShootingStar';

type Shockwave = {
  id: string;
  bodyId: string;
  position: Position3D;
  triggeredAt: number;
};

function computeClusters(bodies: CelestialBodyData[]) {
  const clusters: Array<{ center: Position3D; members: Position3D[] }> = [];
  const consumed = new Set<string>();

  for (const body of bodies) {
    if (consumed.has(body.id)) {
      continue;
    }

    const members = bodies.filter((candidate) => {
      const dx = candidate.position.x - body.position.x;
      const dy = candidate.position.y - body.position.y;
      const dz = candidate.position.z - body.position.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) <= 15;
    });

    if (members.length >= 5) {
      members.forEach((member) => consumed.add(member.id));
      const center = members.reduce(
        (accumulator, member) => ({
          x: accumulator.x + member.position.x / members.length,
          y: accumulator.y + member.position.y / members.length,
          z: accumulator.z + member.position.z / members.length,
        }),
        { x: 0, y: 0, z: 0 },
      );
      clusters.push({
        center,
        members: members.map((member) => member.position),
      });
    }
  }

  return clusters.slice(0, 16);
}

function computeShockOffset(body: CelestialBodyData, events: Shockwave[]): Position3D {
  const offset = { x: 0, y: 0, z: 0 };
  const now = Date.now();

  for (const event of events) {
    if (event.bodyId === body.id) {
      continue;
    }

    const age = now - event.triggeredAt;
    if (age > 1800) {
      continue;
    }

    const dx = body.position.x - event.position.x;
    const dy = body.position.y - event.position.y;
    const dz = body.position.z - event.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance <= 0.001 || distance > 20) {
      continue;
    }

    const strength = ((20 - distance) / 20) * (1 - age / 1800) * 4;
    offset.x += (dx / distance) * strength;
    offset.y += (dy / distance) * strength;
    offset.z += (dz / distance) * strength;
  }

  return offset;
}

function AuroraWave({ pulse }: { pulse: number }): JSX.Element {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPulse: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform float uPulse;
          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.z += sin((uv.x * 10.0) + uTime * 1.6) * (1.3 + uPulse * 2.2);
            pos.y += sin((uv.x * 4.0) + uTime * 0.8) * 0.6;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform float uPulse;
          void main() {
            float band = smoothstep(0.18, 0.9, sin(vUv.x * 12.0 + uTime * 1.8) * 0.5 + 0.5);
            float fade = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 1.4);
            vec3 color = mix(vec3(0.02, 0.72, 0.82), vec3(0.64, 0.48, 0.98), vUv.x);
            float alpha = band * fade * (0.06 + uPulse * 0.18);
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );
  const pulseValue = useRef(0);
  const previousPulse = useRef(pulse);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  useFrame((state) => {
    if (pulse !== previousPulse.current) {
      previousPulse.current = pulse;
      pulseValue.current = 1;
    }

    pulseValue.current *= 0.97;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPulse.value = pulseValue.current;
  });

  return (
    <mesh position={[0, 22, 0]} rotation={[-Math.PI / 2.6, 0, 0]}>
      <planeGeometry args={[320, 120, 64, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function CameraRig({
  selectedBody,
  controlsRef,
}: {
  selectedBody: CelestialBodyData | null;
  controlsRef: { current: any };
}): null {
  const { camera } = useThree();
  const defaultPosition = useMemo(() => new Vector3(0, 80, 200), []);
  const defaultTarget = useMemo(() => new Vector3(0, 0, 0), []);
  const targetPosition = useMemo(() => new Vector3(), []);
  const targetLookAt = useMemo(() => new Vector3(), []);

  useFrame(() => {
    if (selectedBody) {
      const focus = new Vector3(
        selectedBody.position.x,
        selectedBody.position.y,
        selectedBody.position.z,
      );
      const direction = focus.clone().normalize().multiplyScalar(8);
      targetPosition.copy(focus).add(direction).add(new Vector3(0, 2, 0));
      targetLookAt.copy(focus);
    } else {
      targetPosition.copy(defaultPosition);
      targetLookAt.copy(defaultTarget);
    }

    camera.position.lerp(targetPosition, 0.06);
    controlsRef.current?.target.lerp(targetLookAt, 0.08);
    controlsRef.current?.update();
  });

  return null;
}

function InstancedBodiesLayer({
  bodies,
  onSelect,
  onHover,
}: {
  bodies: CelestialBodyData[];
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}): JSX.Element {
  const groups = useMemo(() => {
    return bodies.reduce<Record<string, CelestialBodyData[]>>((accumulator, body) => {
      const key = getVisualProfile(body).kind;
      accumulator[key] ??= [];
      accumulator[key].push(body);
      return accumulator;
    }, {});
  }, [bodies]);

  return (
    <group>
      {Object.entries(groups).map(([key, groupBodies]) => (
        <InstancedGroup
          key={key}
          kind={key}
          bodies={groupBodies}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

function InstancedGroup({
  kind,
  bodies,
  onSelect,
  onHover,
}: {
  kind: string;
  bodies: CelestialBodyData[];
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}): JSX.Element | null {
  const meshRef = useRef<InstancedMesh | null>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    bodies.forEach((body, index) => {
      dummy.position.set(body.position.x, body.position.y, body.position.z);
      dummy.scale.setScalar(body.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [bodies, dummy]);

  if (bodies.length === 0) {
    return null;
  }

  const profile = getVisualProfile(bodies[0]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, bodies.length]}
      castShadow
      receiveShadow
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        if (typeof event.instanceId === 'number') {
          onHover(bodies[event.instanceId]?.id ?? null);
        }
      }}
      onPointerOut={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onHover(null);
      }}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        if (typeof event.instanceId === 'number') {
          const targetBody = bodies[event.instanceId];
          if (targetBody) {
            onSelect(targetBody.id);
          }
        }
      }}
    >
      {kind === 'asteroid' ? (
        <dodecahedronGeometry args={[1, 0]} />
      ) : (
        <sphereGeometry args={[1, 18, 18]} />
      )}
      {kind === 'main_star' || kind === 'neutron_star' ? (
        <meshStandardMaterial color={profile.color} emissive={profile.color} emissiveIntensity={1.4} />
      ) : (
        <meshPhysicalMaterial color={profile.color} roughness={0.68} metalness={0.1} />
      )}
    </instancedMesh>
  );
}

export default function GalaxyCanvas(): JSX.Element {
  const bodies = useGalaxyStore((state) => state.bodies);
  const selectedBodyId = useGalaxyStore((state) => state.selectedBodyId);
  const selectBody = useGalaxyStore((state) => state.selectBody);
  const featuredBodies = useGalaxyStore((state) => state.featuredBodies);
  const auroraPulse = useGalaxyStore((state) => state.auroraPulse);
  const supernovaEvents = useGalaxyStore((state) => state.supernovaEvents);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [interacting, setInteracting] = useState(false);
  const controlsRef = useRef<any>(null);

  const selectedBody = useMemo(
    () => bodies.find((body) => body.id === selectedBodyId) ?? null,
    [bodies, selectedBodyId],
  );
  const clusters = useMemo(() => computeClusters(bodies), [bodies]);
  const useInstancing = bodies.length > 500;
  const instancedBodies = useMemo(
    () =>
      useInstancing
        ? bodies.filter((body) => body.id !== selectedBodyId && body.id !== hoveredId)
        : [],
    [bodies, hoveredId, selectedBodyId, useInstancing],
  );
  const interactiveBodies = useMemo(
    () =>
      useInstancing
        ? bodies.filter((body) => body.id === selectedBodyId || body.id === hoveredId)
        : bodies,
    [bodies, hoveredId, selectedBodyId, useInstancing],
  );

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 80, 200], fov: 60 }}
        onPointerMissed={() => setHoveredId(null)}
      >
        <color attach="background" args={['#00000f']} />
        <fog attach="fog" args={['#020214', 120, 340]} />
        <ambientLight intensity={0.38} color="#c4b5fd" />
        <directionalLight position={[60, 80, 40]} intensity={0.8} color="#f8fafc" castShadow />
        <Stars radius={400} depth={60} count={8000} factor={4} saturation={0.9} fade speed={0.2} />
        <AuroraWave pulse={auroraPulse} />
        <GalaxyCore />
        <NebulaCloud clusters={clusters} />

        {useInstancing ? (
          <InstancedBodiesLayer
            bodies={instancedBodies}
            onSelect={selectBody}
            onHover={setHoveredId}
          />
        ) : null}

        {interactiveBodies.map((body) => (
          <CelestialBody
            key={body.id}
            body={body}
            selected={body.id === selectedBodyId}
            hovered={body.id === hoveredId}
            onHover={setHoveredId}
            onSelect={selectBody}
            offset={computeShockOffset(body, supernovaEvents as Shockwave[])}
          />
        ))}

        <ShootingStar bodies={featuredBodies} />
        <CameraRig selectedBody={selectedBody} controlsRef={controlsRef} />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableDamping
          autoRotate={!interacting && !selectedBody}
          autoRotateSpeed={0.15}
          minDistance={18}
          maxDistance={260}
          onStart={() => setInteracting(true)}
          onEnd={() => setInteracting(false)}
        />
        <EffectComposer>
          <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={0.8} />
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
