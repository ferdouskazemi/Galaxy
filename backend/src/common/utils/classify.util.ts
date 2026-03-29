import { BodyType, PlanetClass } from '../../messages/entities/celestial-body.entity';

export type Classification = {
  type: BodyType;
  planetClass: PlanetClass | null;
  color: string;
};

export function classifyBody(message: string, likes: number): Classification {
  const length = message.length;

  if (likes >= 1000) {
    return {
      type: BodyType.NEUTRON_STAR,
      planetClass: null,
      color: '#ffffff',
    };
  }

  if (likes >= 100) {
    return {
      type: BodyType.STAR,
      planetClass: null,
      color: '#fde68a',
    };
  }

  if (length > 300) {
    return {
      type: BodyType.PLANET,
      planetClass: PlanetClass.GAS,
      color: '#f59e0b',
    };
  }

  if (length > 150) {
    return {
      type: BodyType.PLANET,
      planetClass: PlanetClass.OCEAN,
      color: '#3b82f6',
    };
  }

  if (length > 80) {
    return {
      type: BodyType.PLANET,
      planetClass: PlanetClass.ROCKY,
      color: '#ef4444',
    };
  }

  if (length > 40) {
    return {
      type: BodyType.PLANET,
      planetClass: PlanetClass.ICE,
      color: '#67e8f9',
    };
  }

  return {
    type: BodyType.ASTEROID,
    planetClass: null,
    color: '#9ca3af',
  };
}

export function getBaseSize(type: BodyType): number {
  switch (type) {
    case BodyType.ASTEROID:
      return 0.6;
    case BodyType.STAR:
    case BodyType.NEUTRON_STAR:
      return 2;
    case BodyType.PLANET:
    default:
      return 1.2;
  }
}

export function calculateBodySize(
  message: string,
  likes: number,
  type: BodyType,
): number {
  return getBaseSize(type) + likes * 0.015 + message.length / 120;
}
