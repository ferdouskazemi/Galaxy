'use client';

import { create } from 'zustand';
import {
  calculateBodySize,
  getVisualProfile,
  trimMessagePreview,
} from '@/lib/astronomy';
import type {
  BodyUpdatePayload,
  CelestialBodyData,
  GalaxyStats,
  LiveFeedEntry,
  PaginatedBodiesResponse,
  Position3D,
  ShootingStarPayload,
  SupernovaPayload,
} from '@/lib/types';

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type FlashState = {
  key: number;
  intensity: number;
};

type AudioCue = {
  key: number;
  frequency: number;
};

type SupernovaEvent = {
  id: string;
  bodyId: string;
  position: Position3D;
  triggeredAt: number;
};

interface GalaxyStore {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  connectionState: ConnectionState;
  bodies: CelestialBodyData[];
  selectedBodyId: string | null;
  viewerCount: number;
  stats: GalaxyStats | null;
  liveFeed: LiveFeedEntry[];
  featuredBodies: CelestialBodyData[];
  likedBodyIds: Record<string, true>;
  pendingLikeIds: Record<string, true>;
  postCooldownUntil: number | null;
  soundEnabled: boolean;
  audioCue: AudioCue | null;
  globalFlash: FlashState | null;
  orbitResetToken: number;
  auroraPulse: number;
  supernovaEvents: SupernovaEvent[];
  initialize: () => Promise<void>;
  refreshStats: () => Promise<void>;
  postMessage: (message: string) => Promise<{ ok: boolean; message?: string }>;
  likeBody: (id: string) => Promise<{ ok: boolean; message?: string }>;
  selectBody: (id: string) => void;
  closeReader: () => void;
  setConnectionState: (state: ConnectionState) => void;
  setViewerCount: (count: number) => void;
  setFeaturedBodies: (payload: ShootingStarPayload) => void;
  handleNewBody: (body: CelestialBodyData) => void;
  handleBodyUpdated: (payload: BodyUpdatePayload) => void;
  handleSupernova: (payload: SupernovaPayload) => void;
  toggleSound: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function normalizeBody(body: CelestialBodyData): CelestialBodyData {
  const type = body.type ?? body.bodyType;
  const color = body.color ?? body.colorHex;
  const colorHex = body.colorHex ?? body.color;

  return {
    ...body,
    type,
    bodyType: body.bodyType ?? type,
    color,
    colorHex,
    baseSize:
      body.baseSize ?? (type === 'asteroid' ? 0.6 : type === 'planet' ? 1.2 : 2),
    createdAt: body.createdAt ?? new Date().toISOString(),
    size:
      body.size ??
      calculateBodySize(body.message, body.likes, body.bodyType ?? body.type),
  };
}

function toFeedEntry(body: CelestialBodyData): LiveFeedEntry {
  return {
    id: body.id,
    preview: trimMessagePreview(body.message),
    label: getVisualProfile(body).label,
    createdAt: body.createdAt,
  };
}

function upsertBodies(
  bodies: CelestialBodyData[],
  incoming: CelestialBodyData,
): CelestialBodyData[] {
  const normalized = normalizeBody(incoming);
  const existingIndex = bodies.findIndex((body) => body.id === normalized.id);

  if (existingIndex === -1) {
    return [...bodies, normalized].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }

  return bodies.map((body) =>
    body.id === normalized.id ? { ...body, ...normalized } : body,
  );
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function readError(
  response: Response,
): Promise<{ message: string; retryAfter?: number }> {
  try {
    const payload = (await response.json()) as {
      message?: string | string[] | { message?: string; retryAfter?: number };
      retryAfter?: number;
    };

    if (typeof payload.message === 'string') {
      return { message: payload.message, retryAfter: payload.retryAfter };
    }

    if (Array.isArray(payload.message)) {
      return { message: payload.message.join(', '), retryAfter: payload.retryAfter };
    }

    if (payload.message && typeof payload.message === 'object') {
      return {
        message: payload.message.message ?? 'Request failed',
        retryAfter: payload.message.retryAfter ?? payload.retryAfter,
      };
    }
  } catch {
    return { message: response.statusText || 'Request failed' };
  }

  return { message: response.statusText || 'Request failed' };
}

export const useGalaxyStore = create<GalaxyStore>((set, get) => ({
  initialized: false,
  loading: true,
  error: null,
  connectionState: 'connecting',
  bodies: [],
  selectedBodyId: null,
  viewerCount: 1,
  stats: null,
  liveFeed: [],
  featuredBodies: [],
  likedBodyIds: {},
  pendingLikeIds: {},
  postCooldownUntil: null,
  soundEnabled: false,
  audioCue: null,
  globalFlash: null,
  orbitResetToken: 0,
  auroraPulse: 0,
  supernovaEvents: [],

  async initialize() {
    if (get().initialized) {
      return;
    }

    set({ loading: true, error: null, connectionState: 'connecting' });

    try {
      const [messagesResponse, statsResponse] = await Promise.all([
        fetch(`${API_URL}/messages?limit=500&sort=created_at`, {
          cache: 'no-store',
        }),
        fetch(`${API_URL}/stats`, {
          cache: 'no-store',
        }),
      ]);

      if (!messagesResponse.ok) {
        throw new Error((await readError(messagesResponse)).message);
      }

      if (!statsResponse.ok) {
        throw new Error((await readError(statsResponse)).message);
      }

      const messages = await readJson<PaginatedBodiesResponse>(messagesResponse);
      const stats = await readJson<GalaxyStats>(statsResponse);
      const bodies = messages.data.map(normalizeBody).sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );

      set({
        initialized: true,
        loading: false,
        error: null,
        bodies,
        stats,
        liveFeed: [...bodies]
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime(),
          )
          .slice(0, 5)
          .map(toFeedEntry),
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to load galaxy',
      });
    }
  },

  async refreshStats() {
    const response = await fetch(`${API_URL}/stats`, { cache: 'no-store' });
    if (!response.ok) {
      return;
    }

    const stats = await readJson<GalaxyStats>(response);
    set({ stats });
  },

  async postMessage(message) {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await readError(response);
      if (response.status === 429) {
        set({
          postCooldownUntil: Date.now() + (error.retryAfter ?? 60) * 1000,
        });
      }

      return { ok: false, message: error.message };
    }

    const body = normalizeBody(await readJson<CelestialBodyData>(response));
    get().handleNewBody(body);
    set({ postCooldownUntil: null });
    return { ok: true };
  },

  async likeBody(id) {
    if (get().pendingLikeIds[id] || get().likedBodyIds[id]) {
      return { ok: false, message: 'Already liked' };
    }

    set((state) => ({
      pendingLikeIds: { ...state.pendingLikeIds, [id]: true },
    }));

    try {
      const response = await fetch(`${API_URL}/messages/${id}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await readError(response);
        if (response.status === 409) {
          set((state) => ({
            likedBodyIds: { ...state.likedBodyIds, [id]: true },
          }));
        }
        return { ok: false, message: error.message };
      }

      const body = normalizeBody(await readJson<CelestialBodyData>(response));
      get().handleBodyUpdated({
        id: body.id,
        likes: body.likes,
        newSize: body.size,
        type: body.type,
        color: body.color,
      });

      set((state) => ({
        likedBodyIds: { ...state.likedBodyIds, [id]: true },
      }));
      return { ok: true };
    } finally {
      set((state) => {
        const nextPending = { ...state.pendingLikeIds };
        delete nextPending[id];
        return { pendingLikeIds: nextPending };
      });
    }
  },

  selectBody(id) {
    set({ selectedBodyId: id });
  },

  closeReader() {
    set((state) => ({
      selectedBodyId: null,
      orbitResetToken: state.orbitResetToken + 1,
    }));
  },

  setConnectionState(state) {
    set({ connectionState: state });
  },

  setViewerCount(count) {
    set((state) => ({
      viewerCount: count,
      auroraPulse: count > state.viewerCount ? state.auroraPulse + 1 : state.auroraPulse,
    }));
  },

  setFeaturedBodies(payload) {
    set({ featuredBodies: payload.bodies.map(normalizeBody) });
  },

  handleNewBody(body) {
    const normalized = normalizeBody({
      ...body,
      spawnedAt: Date.now(),
    });

    set((state) => {
      const alreadyExists = state.bodies.some((item) => item.id === normalized.id);
      const bodies = upsertBodies(state.bodies, normalized);
      const topBody = state.stats?.top_body;
      const nextStats = state.stats
        ? {
            ...state.stats,
            total_bodies: state.stats.total_bodies + (alreadyExists ? 0 : 1),
            top_body:
              !topBody || normalized.likes >= topBody.likes
                ? {
                    id: normalized.id,
                    message: normalized.message,
                    likes: normalized.likes,
                    color: normalized.color,
                    type: normalized.type,
                  }
                : topBody,
          }
        : state.stats;
      const visual = getVisualProfile(normalized);

      return {
        bodies,
        stats: nextStats,
        liveFeed: [toFeedEntry(normalized), ...state.liveFeed].slice(0, 5),
        audioCue: {
          key: Date.now(),
          frequency: visual.tone,
        },
      };
    });
  },

  handleBodyUpdated(payload) {
    set((state) => {
      const target = state.bodies.find((body) => body.id === payload.id);
      if (!target) {
        return state;
      }

      const previousLikes = payload.previousLikes ?? target.likes;
      const likes = payload.likes;
      const crossed100 = previousLikes < 100 && likes >= 100;
      const crossed500 = previousLikes < 500 && likes >= 500;
      const crossed1000 = previousLikes < 1000 && likes >= 1000;
      const updatedBodies = state.bodies.map((body) =>
        body.id === payload.id
          ? {
              ...body,
              likes,
              size: payload.newSize,
              type: payload.type ?? body.type,
              bodyType: payload.type ?? body.bodyType,
              color: payload.color ?? body.color,
              colorHex: payload.color ?? body.colorHex,
              updatedAt: Date.now(),
            }
          : body,
      );

      const active = updatedBodies.find((body) => body.id === payload.id) ?? target;
      const nextTopBody =
        !state.stats?.top_body || likes >= state.stats.top_body.likes
          ? {
              id: active.id,
              message: active.message,
              likes,
              color: active.color,
              type: active.type,
            }
          : state.stats.top_body;

      return {
        bodies: updatedBodies,
        stats: state.stats
          ? {
              ...state.stats,
              total_likes: state.stats.total_likes + Math.max(0, likes - previousLikes),
              top_body: nextTopBody,
            }
          : state.stats,
        globalFlash:
          crossed1000 || crossed500 || crossed100
            ? {
                key: Date.now(),
                intensity: crossed1000 ? 1 : crossed500 ? 0.55 : 0.28,
              }
            : state.globalFlash,
      };
    });
  },

  handleSupernova(payload) {
    set((state) => ({
      bodies: state.bodies.map((body) =>
        body.id === payload.id ? { ...body, supernovaAt: Date.now() } : body,
      ),
      globalFlash: {
        key: Date.now(),
        intensity: 1,
      },
      supernovaEvents: [
        ...state.supernovaEvents.filter(
          (event) => Date.now() - event.triggeredAt < 5000,
        ),
        {
          id: `${payload.id}-${Date.now()}`,
          bodyId: payload.id,
          position: payload.position,
          triggeredAt: Date.now(),
        },
      ].slice(-8),
    }));
  },

  toggleSound() {
    set((state) => ({ soundEnabled: !state.soundEnabled }));
  },
}));



