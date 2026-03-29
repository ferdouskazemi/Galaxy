'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  PointsMaterial,
} from 'three';
import { generateSpiralArmCloud } from '@/lib/positions';

export default function GalaxyCore(): JSX.Element {
  const pointsRef = useRef<Points | null>(null);
  const geometry = useMemo(() => {
    const starCloud = generateSpiralArmCloud(5000);
    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute('position', new BufferAttribute(starCloud.positions, 3));
    nextGeometry.setAttribute('color', new BufferAttribute(starCloud.colors, 3));
    return nextGeometry;
  }, []);
  const material = useMemo(
    () =>
      new PointsMaterial({
        size: 0.3,
        transparent: true,
        opacity: 0.86,
        sizeAttenuation: true,
        vertexColors: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <group>
      <points ref={pointsRef} geometry={geometry} material={material} />
      <mesh castShadow>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#fde68a" emissiveIntensity={2} />
      </mesh>
      <mesh scale={1.7}>
        <sphereGeometry args={[2, 24, 24]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.14} blending={AdditiveBlending} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2} distance={80} color="#fde68a" />
    </group>
  );
}
