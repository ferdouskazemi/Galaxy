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

