export type BodyType = 'star' | 'planet' | 'asteroid' | 'neutron_star';
export type PlanetClass = 'rocky' | 'ocean' | 'gas' | 'ice' | 'hot' | 'dwarf' | null;
export type BodyVisualKind =
  | 'main_star'
  | 'hot_planet'
  | 'ocean_planet'
  | 'gas_giant'
  | 'ice_giant'
  | 'asteroid'
  | 'neutron_star';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface CelestialBodyData {
  id: string;
  type: BodyType;
  bodyType: BodyType;
  planetClass: PlanetClass;
  position: Position3D;
  color: string;
  colorHex: string;
  size: number;
  baseSize: number;
  message: string;
  likes: number;
  language: string;
  createdAt: string;
  spawnedAt?: number;
  updatedAt?: number;
  supernovaAt?: number;
}

export interface BodyUpdatePayload {
  id: string;
  likes: number;
  newSize: number;
  previousLikes?: number;
  type?: BodyType;
  color?: string;
}

export interface SupernovaPayload {
  id: string;
  position: Position3D;
}

export interface ViewerCountPayload {
  count: number;
}

export interface ShootingStarPayload {
  bodies: CelestialBodyData[];
}

export interface LiveFeedEntry {
  id: string;
  preview: string;
  label: string;
  createdAt: string;
}

export interface GalaxyStats {
  total_bodies: number;
  total_likes: number;
  top_body: {
    id: string;
    message: string;
    likes: number;
    color: string;
    type: BodyType;
  } | null;
  galaxy_age_days: number;
}

export interface PaginatedBodiesResponse {
  data: CelestialBodyData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
