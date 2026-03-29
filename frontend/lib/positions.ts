function mixColor(start: [number, number, number], end: [number, number, number], t: number) {
  return [
    start[0] + (end[0] - start[0]) * t,
    start[1] + (end[1] - start[1]) * t,
    start[2] + (end[2] - start[2]) * t,
  ] as const;
}

export function generateGalaxyPosition(index: number): {
  x: number;
  y: number;
  z: number;
} {
  const arms = 5;
  const arm = index % arms;
  const armOffset = (arm / arms) * Math.PI * 2;
  const radius = 10 + Math.sqrt(index) * 2.5;
  const theta = Math.sqrt(index) * 0.8 + armOffset;
  const spread = Math.random() * 4 - 2;

  return {
    x: Math.cos(theta) * radius + spread,
    y: (Math.random() - 0.5) * 6,
    z: Math.sin(theta) * radius + spread,
  };
}

export function generateSpiralArmCloud(count = 5000): {
  positions: Float32Array;
  colors: Float32Array;
} {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const purple: [number, number, number] = [0.6549, 0.5451, 0.9804];
  const gold: [number, number, number] = [0.9608, 0.6196, 0.0431];
  const arms = 5;

  for (let index = 0; index < count; index += 1) {
    const arm = index % arms;
    const armOffset = (arm / arms) * Math.PI * 2;
    const radius = 4 + Math.sqrt(index) * 1.3 + Math.random() * 10;
    const theta = radius * 0.35 + Math.random() * 0.8;
    const x = radius * Math.cos(theta + armOffset);
    const y = (Math.random() - 0.5) * 0.8;
    const z = radius * Math.sin(theta + armOffset);
    const tint = Math.min(1, radius / 90);
    const [r, g, b] = mixColor(purple, gold, tint);

    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;

    colors[index * 3] = r;
    colors[index * 3 + 1] = g;
    colors[index * 3 + 2] = b;
  }

  return { positions, colors };
}
